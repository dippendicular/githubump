import type { Platform } from './platforms'
import type { RepositoryOrder } from './repository-badge'
import type { BadgeDesign } from './badge-design'

export type CountMode = 'unique' | 'total'

export interface BadgeUrlOptions {
  mode?: CountMode
  ttl?: number
  preview?: boolean | 'stored'
  countFormat?: 'exact'
  design?: BadgeDesign
  platform?: Platform
  repositories?: RepositoryOrder
}

export function exactViewCount(count: number | null): string {
  return count === null ? '—' : count.toLocaleString('en-US')
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export function generateBadgeUrl(
  baseUrl: string,
  username: string,
  label: string,
  color: string,
  style: string,
  options: BadgeUrlOptions = {}
): string {
  const params = new URLSearchParams({
    username,
    label,
    color: color.replace('#', ''),
    style,
    mode: options.mode || 'unique',
  })

  if (options.ttl) {
    params.set('ttl', options.ttl.toString())
  }

  if (options.preview) {
    params.set('preview', options.preview === 'stored' ? 'stored' : 'true')
  }

  if (options.countFormat) params.set('countFormat', options.countFormat)
  if (options.platform && options.platform !== 'github') params.set('platform', options.platform)
  if (options.repositories) {
    params.set('showRepos', 'true')
    params.set('repoOrder', options.repositories)
  }

  const design = options.design
  if (design) {
    if (design.shape && design.shape !== 'auto') params.set('shape', design.shape)
    if (design.font && design.font !== 'auto') params.set('font', design.font)
    if (design.labelColor) params.set('labelColor', design.labelColor)
    if (design.countColor) params.set('countColor', design.countColor)
    if (design.labelPosition?.some(Boolean)) params.set('labelPosition', design.labelPosition.join(','))
    if (design.countPosition?.some(Boolean)) params.set('countPosition', design.countPosition.join(','))
  }

  return `${baseUrl}/api/profile-views?${params.toString()}`
}

export function generateMarkdownCode(badgeUrl: string, username: string): string {
  return `<img src="${badgeUrl}" alt="${username} profile views" />`
}

export function generateHTMLCode(badgeUrl: string, username: string): string {
  return generateMarkdownCode(badgeUrl, username)
}
