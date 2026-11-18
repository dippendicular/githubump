import { formatNumber } from './badge-utils'
import { hasBadgeDesign, isNewDesign, readBadgeDesign, renderBadgeDesign, type BadgeDesign } from './badge-design'

export type RepositoryOrder = 'views-first' | 'repos-first'

export type RepositoryBadgeOptions = { label?: string; style?: string; design?: BadgeDesign }
export const REPOSITORY_STYLE = 'split'
export const REPOSITORY_ACCENT = '#6741c7'

function labelFor(value?: string | null) {
  return value?.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 48) || 'Public repos'
}

export function readRepositoryBadge(params: URLSearchParams): RepositoryBadgeOptions {
  const style = params.get('repoStyle')
  return {
    label: labelFor(params.get('repoLabel')),
    style: style && isNewDesign(style) ? style : undefined,
    design: readBadgeDesign(params, 'repo'),
  }
}

export function renderRepositoryBadge(count: number | null, options: RepositoryBadgeOptions) {
  const style = options.style && isNewDesign(options.style) ? options.style : REPOSITORY_STYLE
  const svg = renderBadgeDesign(labelFor(options.label), count === null ? '—' : formatNumber(count), REPOSITORY_ACCENT, style, options.design ?? {})
  // Both nested SVGs share the outer document, so local fragment IDs must differ.
  return svg.replace(/id="([a-z]+)"|(fill|clip-path)="url\(#([a-z]+)\)"/g, (_, id, attr, reference) => id ? `id="repo-${id}"` : `${attr}="url(#repo-${reference})"`)
}

function dimensions(svg: string) {
  const match = /^<svg[^>]* width="(\d+)" height="(\d+)"/.exec(svg)
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null
}

export function withRepositoryBadge(views: string, repositories: number | null, order: RepositoryOrder, options: RepositoryBadgeOptions = {}) {
  const size = dimensions(views)
  if (!size) return views
  const { width, height } = size
  const customized = Boolean(options.style || labelFor(options.label) !== 'Public repos' || (options.design && hasBadgeDesign(options.design)))
  if (customized) {
    const repo = renderRepositoryBadge(repositories, options)
    const repoSize = dimensions(repo)
    if (repoSize) {
      const combinedHeight = Math.max(height, repoSize.height)
      const reposFirst = order === 'repos-first'
      const at = (svg: string, x: number, h: number) => svg.replace('<svg ', `<svg x="${x}" y="${(combinedHeight - h) / 2}" `)
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 6 + repoSize.width}" height="${combinedHeight}">
${at(views, reposFirst ? repoSize.width + 6 : 0, height)}
${at(repo, reposFirst ? 0 : width + 6, repoSize.height)}
</svg>`
    }
  }
  const repoHeight = Math.min(height, 42)
  const center = repoHeight / 2
  const gap = 6
  const count = repositories === null ? '—' : formatNumber(repositories)
  const labelWidth = Math.round(repoHeight * 3.7)
  const countWidth = Math.round(repoHeight * Math.max(1.8, count.length * .38 + .5))
  const repoWidth = labelWidth + countWidth
  const reposFirst = order === 'repos-first'
  const repoX = reposFirst ? 0 : width + gap
  const viewsX = reposFirst ? repoWidth + gap : 0
  const description = repositories === null ? 'Public repositories unavailable' : `Public repositories: ${repositories}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width + gap + repoWidth}" height="${height}">
${views.replace('<svg ', `<svg x="${viewsX}" `)}
<svg x="${repoX}" y="${(height - repoHeight) / 2}" width="${repoWidth}" height="${repoHeight}" role="img" aria-label="${description}">
  <title>${description}</title>
  <rect width="${repoWidth}" height="${repoHeight}" rx="${repoHeight * .18}" fill="#29243e"/>
  <path d="M${labelWidth} 3V${repoHeight - 3}" stroke="#a69ac7" opacity=".55"/>
  <g fill="#fff" font-family="Arial, sans-serif" font-size="${repoHeight * .53}" dominant-baseline="central" text-anchor="middle">
    <text x="${labelWidth / 2}" y="${center}">Public repos</text>
    <text x="${labelWidth + countWidth / 2}" y="${center}">${count}</text>
  </g>
</svg></svg>`
}
