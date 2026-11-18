import { getCounterStore } from '@/lib/counter-store'
import { parsePlatform, platformCounterKey, platformUsername } from '@/lib/platforms'

export async function GET(_request: Request, context: RouteContext<'/api/views/[platform]/[username]'>) {
  const { platform: rawPlatform, username: rawUsername } = await context.params
  const platform = parsePlatform(rawPlatform)
  const username = platform && platformUsername(rawUsername, platform)
  if (!platform || !username) return Response.json({ error: 'Invalid platform or username.' }, { status: 400 })

  try {
    const views = await (await getCounterStore()).get(platformCounterKey(platform, username))
    return Response.json({ platform, username, views }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Counter storage is unavailable.' }, { status: 503 })
  }
}
