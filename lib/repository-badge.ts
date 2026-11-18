import { formatNumber } from './badge-utils'

export type RepositoryOrder = 'views-first' | 'repos-first'

export function withRepositoryBadge(views: string, repositories: number | null, order: RepositoryOrder) {
  const dimensions = /^<svg[^>]* width="(\d+)" height="(\d+)"/.exec(views)
  if (!dimensions) return views
  const width = Number(dimensions[1])
  const height = Number(dimensions[2])
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
