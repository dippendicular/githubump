import { parsePlatform, platformCounterKey, platformUsername } from '@/lib/platforms'
import { getCounterStore } from '@/lib/counter-store'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.ADMIN_API_TOKEN
  if (!token) return false
  return request.headers.get('authorization') === `Bearer ${token}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const platform = parsePlatform(body?.platform)
  const username = platform && platformUsername(body?.username, platform)
  const action = body?.action

  if (!platform || !username) {
    return NextResponse.json({ error: 'A valid platform and username are required.' }, { status: 400 })
  }

  const counterKey = platformCounterKey(platform, username)

  if (action === 'reset') {
    await (await getCounterStore()).set(counterKey, 0)
    return NextResponse.json({ username, views: 0 })
  }

  if (action === 'set') {
    const views = Number(body?.count)
    if (!Number.isSafeInteger(views) || views < 0) {
      return NextResponse.json({ error: 'count must be a non-negative integer.' }, { status: 400 })
    }

    await (await getCounterStore()).set(counterKey, views)
    return NextResponse.json({ username, views })
  }

  return NextResponse.json({ error: 'action must be reset or set.' }, { status: 400 })
}
