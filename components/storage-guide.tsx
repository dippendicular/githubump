import { ArrowUpRight, ChevronDown, Database } from 'lucide-react'

const OPTIONS = [
  { name: 'Upstash', description: 'For Vercel or a hosted deployment. Create an Upstash Redis database and copy the REST URL and read/write token.', config: 'COUNTER_STORAGE=upstash\nKV_REST_API_URL=https://your-db.upstash.io\nKV_REST_API_TOKEN=your-read-write-token' },
  { name: 'SQLite', description: 'For a single self-hosted server, using Node.js 22.13 or newer. Point to a writable file on a persistent volume. The app creates the database.', config: 'COUNTER_STORAGE=sqlite\nCOUNTER_SQLITE_PATH=/var/lib/github-counter/counters.sqlite' },
  { name: 'Your Redis', description: 'For your own standalone Redis instance. Keep Redis on a private network and enable persistence. Use rediss:// if the server requires TLS.', config: 'COUNTER_STORAGE=redis\nREDIS_URL=redis://127.0.0.1:6379' },
]

export default function StorageGuide() {
  return (
    <details className="workspace-card storage-guide">
      <summary><Database size={18} aria-hidden="true" /> Counter storage setup <ChevronDown size={16} aria-hidden="true" /></summary>
      <div className="storage-guide-content">
        <p>Choose one backend for your deployment. Set its variables on the server and restart or redeploy the app.</p>
        <div className="storage-options">
          {OPTIONS.map(({ name, description, config }) => (
            <section key={name}>
              <h3>{name}</h3>
              <p>{description}</p>
              <pre><code>{config}</code></pre>
            </section>
          ))}
        </div>
        <a className="preview-open" href="https://github.com/dippendicular/githubvisitcounter#counter-storage">
          Full setup and verification guide <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
    </details>
  )
}
