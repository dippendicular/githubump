import type { Platform } from './platforms'

const FORGES = {
  forgejo: () => process.env.FORGEJO_URL || 'https://code.forgejo.org',
  gitea: () => process.env.GITEA_URL || 'https://gitea.com',
  codeberg: () => 'https://codeberg.org',
} as const

async function request(url: string, token?: string, signal = AbortSignal.timeout(5000)) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'githubump',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 300 },
    redirect: 'error',
    signal,
  })
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`)
  return response
}

function count(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid repository count')
  return value
}

async function paginatedCount(url: string, pageSize: number, sizeParam: 'limit' | 'per_page', totalHeader: string) {
  const endpoint = new URL(url)
  endpoint.searchParams.set(sizeParam, String(pageSize))
  const signal = AbortSignal.timeout(7000)
  let total = 0
  for (let page = 1; page <= 40; page++) {
    endpoint.searchParams.set('page', String(page))
    const response = await request(endpoint.href, undefined, signal)
    const header = response.headers.get(totalHeader)
    if (header !== null && /^\d+$/.test(header)) return count(Number(header))
    const projects: unknown = await response.json()
    if (!Array.isArray(projects)) throw new Error('Invalid repository list')
    total += projects.length
    if (projects.length < pageSize) return total
  }
  throw new Error('Provider did not return a total within the pagination limit')
}

export async function getPublicRepositories(platform: Platform, username: string): Promise<number> {
  const name = encodeURIComponent(username)

  switch (platform) {
    case 'github': {
      const response = await request(`https://api.github.com/users/${name}`, process.env.GITHUB_API_TOKEN)
      return count((await response.json()).public_repos)
    }
    case 'gitlab': {
      const response = await request(`https://gitlab.com/api/v4/users?username=${name}`)
      const users: unknown = await response.json()
      const id = Array.isArray(users) ? users.find((user) => user.username?.toLowerCase() === username)?.id : null
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error('GitLab user is unavailable')
      return paginatedCount(`https://gitlab.com/api/v4/users/${id}/projects?visibility=public`, 100, 'per_page', 'x-total')
    }
    default: {
      const base = new URL(FORGES[platform]())
      if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
        throw new Error('Invalid forge instance URL')
      }
      const path = base.pathname.replace(/\/$/, '')
      return paginatedCount(`${base.origin}${path}/api/v1/users/${name}/repos`, 50, 'limit', 'x-total-count')
    }
  }
}
