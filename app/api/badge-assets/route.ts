import { ICON_PACKS, type IconPack } from '@/lib/badge-assets'
import { loadBadgeAssets, searchBadgeIcons } from '@/lib/badge-assets-server'
import { readBadgeDesign } from '@/lib/badge-design'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const pack = params.get('pack')
  const headers = { 'Cache-Control': 'public, max-age=3600' }
  if (pack !== null) {
    if (!Object.hasOwn(ICON_PACKS, pack)) return Response.json({ error: 'Invalid icon pack.' }, { status: 400 })
    const page = Math.min(500, Math.max(0, Number.parseInt(params.get('page') ?? '', 10) || 0))
    return Response.json(searchBadgeIcons(pack as IconPack, (params.get('q') ?? '').slice(0, 60), page), { headers })
  }
  return Response.json(await loadBadgeAssets(readBadgeDesign(params)), { headers })
}
