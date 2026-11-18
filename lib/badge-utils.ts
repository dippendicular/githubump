import type { Platform } from './platforms'
import type { RepositoryBadgeOptions, RepositoryOrder } from './repository-badge'
import { writeBadgeDesign, type BadgeDesign } from './badge-design'

export type CountMode = 'unique' | 'total'
export type CountFormat = 'exact' | 'compact'

export interface BadgeUrlOptions {
  mode?: CountMode
  ttl?: number
  preview?: boolean | 'stored'
  countFormat?: CountFormat
  design?: BadgeDesign
  platform?: Platform
  repositories?: RepositoryOrder
  repositoryBadge?: RepositoryBadgeOptions
}

export function formatViewCount(count: number | null, format: CountFormat): string {
  if (count === null) return '—'
  return format === 'exact' ? count.toLocaleString('en-US') : formatNumber(count)
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

  if (options.design) writeBadgeDesign(params, options.design)
  const repo = options.repositoryBadge
  if (options.repositories && repo) {
    if (repo.label?.trim()) params.set('repoLabel', repo.label.trim())
    if (repo.style) params.set('repoStyle', repo.style)
    if (repo.design) writeBadgeDesign(params, repo.design, 'repo')
  }

  return `${baseUrl}/api/profile-views?${params.toString()}`
}

export function generateMarkdownCode(badgeUrl: string, username: string): string {
  return `<img src="${badgeUrl}" alt="${username} profile views" />`
}

export function generateHTMLCode(badgeUrl: string, username: string): string {
  return generateMarkdownCode(badgeUrl, username)
}
