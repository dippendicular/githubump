import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { isBadgeIconKey, isGoogleBadgeFont, type BadgeAssets, type IconPack } from './badge-assets'
import type { BadgeDesign } from './badge-design'

const packs = { solid: fas, regular: far, brands: fab }
const catalog = Object.fromEntries(Object.entries(packs).map(([pack, definitions]) => {
  const unique = new Map(Object.values(definitions).map((definition) => [definition.iconName, definition]))
  return [pack, [...unique.values()].sort((a, b) => a.iconName.localeCompare(b.iconName))]
})) as Record<IconPack, (typeof fas)[string][]>

function iconFor(key?: string | null) {
  if (!isBadgeIconKey(key)) return undefined
  const [pack, name] = key.split(':') as [IconPack, string]
  const icon = catalog[pack].find((definition) => definition.iconName === name)
  if (!icon) return undefined
  const [width, height, , , paths] = icon.icon
  return { width, height, paths: Array.isArray(paths) ? paths : [paths] }
}

export function searchBadgeIcons(pack: IconPack, query: string, page: number) {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, '-')
  const found = catalog[pack].filter(({ iconName, icon }) =>
    iconName.includes(normalizedQuery) || icon[2].some((alias) => typeof alias === 'string' && alias.includes(normalizedQuery)))
  const limit = 24
  const start = page * limit
  return {
    icons: found.slice(start, start + limit).map(({ iconName, icon }) => {
      const [width, height, , , paths] = icon
      return { key: `${pack}:${iconName}`, name: iconName, width, height, paths: Array.isArray(paths) ? paths : [paths] }
    }),
    total: found.length,
    hasMore: found.length > start + limit,
  }
}

const fonts = new Map<string, Promise<string | undefined>>()

export async function loadBadgeAssets(design: Pick<BadgeDesign, 'font' | 'icon'>): Promise<BadgeAssets> {
  const key = design.font
  let font: string | undefined
  if (isGoogleBadgeFont(key)) {
    if (!fonts.has(key)) {
      fonts.set(key, readFile(join(process.cwd(), 'public/badge-fonts', `${key}.woff2`))
        .then((bytes) => bytes.toString('base64'))
        .catch(() => { fonts.delete(key); return undefined }))
    }
    font = await fonts.get(key)
  }
  return { font, icon: iconFor(design.icon) }
}
