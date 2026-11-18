import { getCounterStore } from '@/lib/counter-store'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function sanitizeUsername(value: string | null): string | null {
  const username = value?.trim().toLowerCase()
  if (!username || !/^[a-z0-9-]{1,39}$/.test(username)) return null
  return username
}

export async function GET(request: NextRequest) {
  const username = sanitizeUsername(request.nextUrl.searchParams.get('username'))

  if (!username) {
    return NextResponse.json({ error: 'A valid username is required.' }, { status: 400 })
  }

  const store = await getCounterStore()
  const views = await store.get(`views:${username}`)
  return NextResponse.json({ username, views })
}
