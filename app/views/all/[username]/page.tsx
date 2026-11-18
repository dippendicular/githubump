import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCounterStore } from '@/lib/counter-store'
import { PLATFORM_IDS, PLATFORMS, platformCounterKey, platformUsername } from '@/lib/platforms'

export const dynamic = 'force-dynamic'

export default async function AllViewsPage({ params, searchParams }: PageProps<'/views/all/[username]'>) {
  const [{ username: rawUsername }, aliases] = await Promise.all([params, searchParams])
  const handle = PLATFORM_IDS.map((platform) => platformUsername(rawUsername, platform)).find(Boolean)
  if (!handle) notFound()

  const entries = await Promise.all(PLATFORM_IDS.map(async (platform) => {
    const alias = aliases[platform]
    const username = platformUsername(typeof alias === 'string' ? alias : handle, platform)
    if (!username) return { platform, username, views: null }

    try {
      const views = await (await getCounterStore()).get(platformCounterKey(platform, username))
      return { platform, username, views }
    } catch {
      return { platform, username, views: null }
    }
  }))
  const total = entries.reduce((sum, entry) => sum + (entry.views ?? 0), 0)
  const incomplete = entries.some((entry) => entry.username && entry.views === null)

  return (
    <main className="badge-workspace">
      <div className="workspace-width workspace-content all-views-page">
        <Link className="preview-open" href="/">← githubump</Link>
        <section className="workspace-card">
          <div className="card-heading"><h1>Views across platforms</h1></div>
          <div className="all-views-summary"><span>@{handle}</span><strong>{incomplete ? '—' : total.toLocaleString('en-US')}</strong><span>Total views</span></div>
          <dl className="platform-view-list">
            {entries.map(({ platform, username, views }) => (
              <div key={platform}>
                <dt>{PLATFORMS[platform]}{username && <span>@{username}</span>}</dt>
                <dd>{views === null ? '—' : views.toLocaleString('en-US')}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  )
}
