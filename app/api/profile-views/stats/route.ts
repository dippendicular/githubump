import { parsePlatform, platformCounterKey, platformUsername } from '@/lib/platforms'
import { getCounterStore } from '@/lib/counter-store'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const requestedPlatform = searchParams.get('platform')
  const platform = parsePlatform(requestedPlatform)
  const username = platform && platformUsername(searchParams.get('username'), platform)

  if (!platform || !username) {
    return NextResponse.json({ error: 'A valid platform and username are required.' }, { status: 400 })
  }

  const store = await getCounterStore()
  const views = await store.get(platformCounterKey(platform, username))
  return NextResponse.json(requestedPlatform ? { platform, username, views } : { username, views })
}
