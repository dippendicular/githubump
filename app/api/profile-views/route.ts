import { loadBadgeAssets } from '@/lib/badge-assets-server'
import { formatViewCount } from '@/lib/badge-utils'
import { getPublicRepositories } from '@/lib/public-repositories'
import { parsePlatform, platformCounterKey, platformUsername, type Platform } from '@/lib/platforms'
import { readRepositoryBadge, withRepositoryBadge } from '@/lib/repository-badge'
import { hasBadgeDesign, isNewDesign, NEW_DESIGNS, readBadgeDesign, renderBadgeDesign } from '@/lib/badge-design'
import { getCounterStore } from '@/lib/counter-store'
import { createHash } from 'crypto'
import { BADGE_STYLES, type BadgeStyle } from '@/lib/badge-styles'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type BadgeStyleConfig = {
  radius: number
  height: number
  fontSize: number
  yShadow: number
  yText: number
  fontFamily: string
  social?: boolean
}

const STYLES: Record<Exclude<BadgeStyle, 'ticket' | 'ledger' | 'orbit' | keyof typeof NEW_DESIGNS>, BadgeStyleConfig> = {
  flat: { radius: 0, height: 20, fontSize: 110, yShadow: 150, yText: 140, fontFamily: 'Verdana,Geneva,DejaVu Sans,sans-serif' },
  'flat-square': { radius: 0, height: 20, fontSize: 110, yShadow: 150, yText: 140, fontFamily: 'Verdana,Geneva,DejaVu Sans,sans-serif' },
  plastic: { radius: 3, height: 20, fontSize: 110, yShadow: 150, yText: 140, fontFamily: 'Verdana,Geneva,DejaVu Sans,sans-serif' },
  rounded: { radius: 10, height: 20, fontSize: 110, yShadow: 150, yText: 140, fontFamily: 'Verdana,Geneva,DejaVu Sans,sans-serif' },
  'for-the-badge': { radius: 4, height: 28, fontSize: 120, yShadow: 190, yText: 180, fontFamily: 'Arial,Helvetica,sans-serif' },
  social: { radius: 3, height: 20, fontSize: 110, yShadow: 150, yText: 140, fontFamily: 'Verdana,Geneva,DejaVu Sans,sans-serif', social: true },
  pill: { radius: 12, height: 24, fontSize: 115, yShadow: 168, yText: 158, fontFamily: 'Verdana,Geneva,sans-serif' },
  outline: { radius: 5, height: 24, fontSize: 115, yShadow: 168, yText: 158, fontFamily: 'Verdana,Geneva,sans-serif' },
  terminal: { radius: 4, height: 24, fontSize: 115, yShadow: 168, yText: 158, fontFamily: 'Consolas,DejaVu Sans Mono,monospace' },
  minimal: { radius: 4, height: 24, fontSize: 115, yShadow: 168, yText: 158, fontFamily: 'Verdana,Geneva,sans-serif' },
}
type CountMode = 'unique' | 'total'

const DEFAULT_COLOR = '0e75b6'
const DEFAULT_TTL_SECONDS = 21600
const MIN_TTL_SECONDS = 60
const MAX_TTL_SECONDS = 86400

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sanitizeText(value: string, fallback: string, maxLength = 48): string {
  const trimmed = value.trim().slice(0, maxLength)
  return trimmed || fallback
}

function sanitizeColor(value: string): string {
  const color = value.replace('#', '').trim()
  return /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color) ? color : DEFAULT_COLOR
}

function sanitizeStyle(value: string | null): BadgeStyle {
  return value && Object.prototype.hasOwnProperty.call(BADGE_STYLES, value) ? (value as BadgeStyle) : 'flat'
}

function sanitizeMode(value: string | null): CountMode {
  return value === 'total' ? 'total' : 'unique'
}

function sanitizeTtl(value: string | null): number {
  if (value === null) return DEFAULT_TTL_SECONDS
  const ttl = Number(value)
  if (!Number.isFinite(ttl)) return DEFAULT_TTL_SECONDS
  return Math.min(Math.max(Math.floor(ttl), MIN_TTL_SECONDS), MAX_TTL_SECONDS)
}

function getClientFingerprint(request: NextRequest, username: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwardedFor || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown-ip'
  const userAgent = request.headers.get('user-agent') || 'unknown-agent'
  return createHash('sha256').update(`${username}:${ip}:${userAgent}`).digest('hex')
}

async function getViews(request: NextRequest, platform: Platform, username: string, mode: CountMode, ttlSeconds: number): Promise<number> {
  const store = await getCounterStore()
  const visit = mode === 'unique' ? { fingerprint: getClientFingerprint(request, username), ttl: ttlSeconds } : undefined
  return store.count(platformCounterKey(platform, username), visit)
}

function renderIllustratedBadge(label: string, message: string, color: string, style: 'ticket' | 'ledger' | 'orbit') {
  const labelWidth = Math.max(80, label.length * 8 + 42)
  const countWidth = Math.max(48, message.length * 10 + 20)
  const width = labelWidth + countWidth
  const accent = `#${color}`
  const safeLabel = escapeXml(label)
  const safeMessage = escapeXml(message)

  const graphics = {
    ticket: `<path d="M5 0H${width - 5}Q${width} 0 ${width} 5V11a5 5 0 0 0 0 10v6q0 5-5 5H5q-5 0-5-5v-6a5 5 0 0 0 0-10V5q0-5 5-5Z" fill="#27334b"/>
      <path d="M${labelWidth} 5v22" stroke="${accent}" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M12 13h14v6H12z" fill="none" stroke="${accent}" stroke-width="2"/>`,
    ledger: `<rect width="${width}" height="32" rx="5" fill="#111827"/>
      <rect x="${labelWidth + 1}" y="4" width="${countWidth - 5}" height="24" rx="3" fill="#263044"/>
      <path d="M10 22h3v-5h-3zm5 0h3v-9h-3zm5 0h3V9h-3z" fill="${accent}"/>`,
    orbit: `<rect width="${width}" height="32" rx="16" fill="#1b1b31"/>
      <ellipse cx="18" cy="16" rx="10" ry="5" transform="rotate(-38 18 16)" fill="none" stroke="${accent}" stroke-width="1.8"/>
      <circle cx="18" cy="16" r="2.4" fill="#faf8ff"/>
      <circle cx="24" cy="10" r="2" fill="${accent}"/>
      <circle cx="${labelWidth}" cy="16" r="2" fill="${accent}"/>`,
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="32" role="img" aria-label="${safeLabel}: ${safeMessage}">
    <title>${safeLabel}: ${safeMessage}</title>
    ${graphics[style]}
    <text x="33" y="20" fill="#e9edf6" font-family="Verdana,Geneva,sans-serif" font-size="12">${safeLabel}</text>
    <text x="${labelWidth + countWidth / 2}" y="21" fill="#fff" text-anchor="middle" font-family="Consolas,monospace" font-size="14" font-weight="700">${safeMessage}</text>
  </svg>`
}

function generateSVG(label: string, message: string, color: string, style: Exclude<BadgeStyle, keyof typeof NEW_DESIGNS> = 'flat'): string {
  if (style === 'ticket' || style === 'ledger' || style === 'orbit') {
    return renderIllustratedBadge(label, message, color, style)
  }
  const styleConfig = STYLES[style] || STYLES.flat
  const height = styleConfig.height
  const safeLabel = escapeXml(label)
  const safeMessage = escapeXml(message)
  const labelWidth = Math.max(label.length * (style === 'for-the-badge' ? 8 : 7) + 14, 56)
  const messageWidth = Math.max(message.length * (style === 'for-the-badge' ? 8 : 7) + 14, 50)
  const totalWidth = labelWidth + messageWidth
  const leftX = labelWidth
  const plain = style === 'outline' || style === 'minimal' || style === 'terminal'
  const neutral = style === 'terminal' ? '#111827' : '#f8fafc'
  const accent = `#${color}`
  const outline = style === 'outline' ? `<rect x=".5" y=".5" width="${totalWidth - 1}" height="${height - 1}" rx="${styleConfig.radius}" fill="none" stroke="${accent}"/>` : ''
  const rightFill = plain ? neutral : styleConfig.social ? '#fafafa' : accent
  const rightTextFill = style === 'terminal' ? '#dcfce7' : plain ? '#0f172a' : styleConfig.social ? '#333' : '#fff'
  const leftFill = plain ? neutral : style === 'pill' ? '#27243c' : styleConfig.social ? '#f5f5f5' : '#555'
  const leftTextFill = style === 'terminal' ? '#d1d5db' : plain ? '#334155' : styleConfig.social ? '#333' : '#fff'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${safeLabel}: ${safeMessage}">
    <title>${safeLabel}: ${safeMessage}</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb"/>
      <stop offset="1" stop-color="#999"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalWidth}" height="${height}" rx="${styleConfig.radius}" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
      <rect width="${labelWidth}" height="${height}" fill="${leftFill}"/>
      <rect x="${leftX}" width="${messageWidth}" height="${height}" fill="${rightFill}"/>
      <rect width="${totalWidth}" height="${height}" fill="url(#s)" opacity="${plain ? '0' : styleConfig.social ? '0.05' : '0.1'}"/>
      ${style === 'minimal' ? `<rect y="${height - 2}" width="${totalWidth}" height="2" fill="${accent}"/>` : ''}
      ${style === 'terminal' ? `<circle cx="${leftX + 5}" cy="${height / 2}" r="2.5" fill="${accent}"/>` : ''}
    </g>
    ${outline}
    <g text-anchor="middle" font-family="${styleConfig.fontFamily}" text-rendering="geometricPrecision" font-size="${styleConfig.fontSize}" letter-spacing="-0.05em">
      <text aria-hidden="true" x="${(labelWidth / 2) * 10}" y="${styleConfig.yShadow}" fill="#010101" fill-opacity="${plain ? 0 : 0.3}" transform="scale(.1)">${safeLabel}</text>
      <text x="${(labelWidth / 2) * 10}" y="${styleConfig.yText}" transform="scale(.1)" fill="${leftTextFill}">${safeLabel}</text>
      <text aria-hidden="true" x="${(leftX + messageWidth / 2) * 10}" y="${styleConfig.yShadow}" fill="#010101" fill-opacity="${plain ? 0 : 0.3}" transform="scale(.1)">${safeMessage}</text>
      <text x="${(leftX + messageWidth / 2) * 10}" y="${styleConfig.yText}" transform="scale(.1)" fill="${rightTextFill}">${safeMessage}</text>
    </g>
  </svg>`
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = parsePlatform(searchParams.get('platform'))
    const username = platform && platformUsername(searchParams.get('username')?.trim() || 'guest', platform)
    if (!platform || !username) {
      return new NextResponse(generateSVG('Error', 'Invalid account', 'dc143c'), { status: 400, headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } })
    }
    const label = sanitizeText(searchParams.get('label') || 'Profile views', 'Profile views')
    const color = sanitizeColor(searchParams.get('color') || DEFAULT_COLOR)
    const style = sanitizeStyle(searchParams.get('style'))
    const mode = sanitizeMode(searchParams.get('mode'))
    const ttlSeconds = sanitizeTtl(searchParams.get('ttl'))
    const preview = searchParams.get('preview')
    const storedPreview = preview === 'stored'
    const viewCount = storedPreview
      ? getCounterStore().then((store) => store.get(platformCounterKey(platform, username))).catch(() => null)
      : preview === 'true' ? 1234 : getViews(request, platform, username, mode, ttlSeconds)

    const showRepositories = searchParams.get('showRepos') === 'true'
    const design = readBadgeDesign(searchParams)
    const repoBadge = readRepositoryBadge(searchParams)
    const [views, repositories, assets, repoAssets] = await Promise.all([
      viewCount,
      showRepositories ? getPublicRepositories(platform, username).catch(() => null) : null,
      loadBadgeAssets(design),
      showRepositories && repoBadge.design ? loadBadgeAssets(repoBadge.design) : undefined,
    ])
    const requestedFormat = searchParams.get('countFormat')
    const format = requestedFormat === 'exact' || requestedFormat === 'compact' ? requestedFormat : storedPreview ? 'exact' : 'compact'
    const message = formatViewCount(views, format)
    const svg = isNewDesign(style) || hasBadgeDesign(design)
      ? renderBadgeDesign(label, message, `#${color}`, style, design, assets)
      : generateSVG(label, message, color, style)

    const order = searchParams.get('repoOrder') === 'repos-first' ? 'repos-first' : 'views-first'
    return new NextResponse(showRepositories ? withRepositoryBadge(svg, repositories, order, repoBadge, repoAssets) : svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[githubump] Profile views API error:', error)
    const errorSVG = generateSVG('Error', 'Failed', 'dc143c')
    return new NextResponse(errorSVG, {
      status: 500,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
    })
  }
}
