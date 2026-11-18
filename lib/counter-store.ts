import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { Redis as Upstash } from '@upstash/redis'
import { createClient } from 'redis'

const COUNTER_TTL = 365 * 24 * 60 * 60

type Visit = { fingerprint: string; ttl: number }
type Store = {
  get(key: string): Promise<number>
  set(key: string, count: number): Promise<void>
  count(key: string, visit?: Visit): Promise<number>
}

type RedisCommands = {
  get(key: string): Promise<unknown>
  set(key: string, value: string): Promise<unknown>
  eval(script: string, keys: string[], args: string[]): Promise<unknown>
}

// Keep the existing Redis key names so existing Upstash counts remain available.
const COUNT_SCRIPT = `
  if #KEYS == 2 and redis.call('EXISTS', KEYS[2]) == 1 then
    return redis.call('GET', KEYS[1]) or '0'
  end
  local count = redis.call('INCR', KEYS[1])
  redis.call('EXPIRE', KEYS[1], ARGV[1])
  if #KEYS == 2 then redis.call('SET', KEYS[2], '1', 'EX', ARGV[2]) end
  return count
`

function redisStore(redis: RedisCommands): Store {
  return {
    async get(key) {
      return Number(await redis.get(key) ?? 0)
    },
    async set(key, count) {
      await redis.set(key, String(count))
    },
    async count(key, visit) {
      const keys = visit ? [key, `${key}:visitor:${visit.fingerprint}`] : [key]
      const args = visit ? [String(COUNTER_TTL), String(visit.ttl)] : [String(COUNTER_TTL)]
      return Number(await redis.eval(COUNT_SCRIPT, keys, args))
    },
  }
}

function sqliteStore(db: DatabaseSync): Store {
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS counters (
      key TEXT PRIMARY KEY, views INTEGER NOT NULL, expires INTEGER
    );
    CREATE TABLE IF NOT EXISTS visitors (
      key TEXT NOT NULL, fingerprint TEXT NOT NULL, expires INTEGER NOT NULL,
      PRIMARY KEY (key, fingerprint)
    );
    CREATE INDEX IF NOT EXISTS visitors_expiry ON visitors (expires);
    CREATE INDEX IF NOT EXISTS counters_expiry ON counters (expires);
  `)

  const read = db.prepare('SELECT views FROM counters WHERE key = ? AND (expires IS NULL OR expires > ?)')
  const set = db.prepare(`
    INSERT INTO counters (key, views) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET views = excluded.views, expires = NULL
  `)
  const increment = db.prepare(`
    INSERT INTO counters (key, views, expires) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET views = views + 1, expires = excluded.expires
    RETURNING views
  `)
  const pruneVisitors = db.prepare('DELETE FROM visitors WHERE expires <= ?')
  const pruneCounters = db.prepare('DELETE FROM counters WHERE expires <= ?')
  const recordVisit = db.prepare('INSERT OR IGNORE INTO visitors (key, fingerprint, expires) VALUES (?, ?, ?)')

  return {
    async get(key) {
      return Number(read.get(key, Date.now())?.views ?? 0)
    },
    async set(key, count) {
      set.run(key, count)
    },
    async count(key, visit) {
      db.exec('BEGIN IMMEDIATE')
      try {
        const now = Date.now()
        pruneVisitors.run(now)
        pruneCounters.run(now)
        const repeat = visit && recordVisit.run(key, visit.fingerprint, now + visit.ttl * 1000).changes === 0
        const row = repeat ? read.get(key, now) : increment.get(key, now + COUNTER_TTL * 1000)
        db.exec('COMMIT')
        return Number(row?.views ?? 0)
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} for the selected counter storage backend.`)
  return value
}

async function openStore(): Promise<Store> {
  switch (process.env.COUNTER_STORAGE ?? 'upstash') {
    case 'upstash': {
      const redis = new Upstash({ url: required('KV_REST_API_URL'), token: required('KV_REST_API_TOKEN') })
      return redisStore({
        get: (key) => redis.get(key),
        set: (key, value) => redis.set(key, value),
        eval: (script, keys, args) => redis.eval(script, keys, args),
      })
    }
    case 'redis': {
      const redis = createClient({
        url: required('REDIS_URL'),
        socket: { connectTimeout: 5000, reconnectStrategy: (attempt) => attempt < 3 ? 250 * (attempt + 1) : false },
        disableOfflineQueue: true,
      })
      redis.on('error', () => console.error('Counter Redis connection error.'))
      let connection: Promise<unknown> | undefined
      async function connected() {
        if (!redis.isOpen) {
          connection ??= redis.connect().finally(() => { connection = undefined })
        }
        await connection
        return redis
      }
      return redisStore({
        get: async (key) => (await connected()).get(key),
        set: async (key, value) => (await connected()).set(key, value),
        eval: async (script, keys, args) => (await connected()).eval(script, { keys, arguments: args }),
      })
    }
    case 'sqlite': {
      const { DatabaseSync } = await import('node:sqlite')
      const path = resolve(required('COUNTER_SQLITE_PATH'))
      mkdirSync(dirname(path), { recursive: true })
      const db = new DatabaseSync(path)
      try {
        return sqliteStore(db)
      } catch (error) {
        db.close()
        throw error
      }
    }
    default:
      throw new Error('COUNTER_STORAGE must be upstash, redis, or sqlite.')
  }
}

let store: Promise<Store> | undefined

export function getCounterStore(): Promise<Store> {
  store ??= openStore().catch((error) => {
    store = undefined
    throw error
  })
  return store
}
