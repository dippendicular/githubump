import { parsePlatform, platformUsername } from '@/lib/platforms'
import { getPublicRepositories } from '@/lib/public-repositories'

export async function GET(_request: Request, context: RouteContext<'/api/public-repositories/[platform]/[username]'>) {
  const { platform: rawPlatform, username: rawUsername } = await context.params
  const platform = parsePlatform(rawPlatform)
  const username = platform && platformUsername(rawUsername, platform)
  if (!platform || !username) return Response.json({ error: 'Invalid platform or username.' }, { status: 400 })

  try {
    const publicRepositories = await getPublicRepositories(platform, username)
    return Response.json({ platform, username, publicRepositories }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  } catch {
    return Response.json({ error: 'Public repository count is unavailable.' }, { status: 502 })
  }
}
