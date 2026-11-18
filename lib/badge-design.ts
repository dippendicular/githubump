export const NEW_DESIGNS = {
  arcade: 'Arcade',
  blueprint: 'Blueprint',
  split: 'Split tiles',
  stamp: 'Postage stamp',
  seal: 'Round seal',
  stack: 'Stacked',
  meter: 'Signal meter',
  ribbon: 'Ribbon',
  crest: 'Crest',
  marquee: 'Marquee',
  glass: 'Gradient glass',
  circuit: 'Circuit board',
  prism: 'Prism',
  receipt: 'Receipt',
} as const

export const SHAPES = {
  auto: 'Design default',
  rectangle: 'Rectangle',
  rounded: 'Rounded rectangle',
  square: 'Square',
  circle: 'Circle',
  oval: 'Oval',
  pill: 'Pill',
  diamond: 'Diamond',
  hexagon: 'Hexagon',
  octagon: 'Octagon',
  shield: 'Shield',
  ticket: 'Ticket',
} as const

export const FONTS = {
  auto: 'Design default',
  sans: 'Sans serif',
  mono: 'Monospace',
  serif: 'Serif',
  slab: 'Slab serif',
  condensed: 'Condensed',
  rounded: 'Rounded',
} as const

export type Shape = keyof typeof SHAPES
export type Font = keyof typeof FONTS
export type Point = readonly [number, number]
export type BadgeDesign = {
  shape?: Shape
  font?: Font
  labelColor?: string
  countColor?: string
  labelPosition?: Point
  countPosition?: Point
}

export function clampOffset(value: number) {
  return Number.isFinite(value) ? Math.max(-25, Math.min(25, Math.round(value))) : 0
}

const HEX = /^#?(?:[a-f\d]{3}|[a-f\d]{6})$/i

export function badgeColor(value: string | null | undefined) {
  return value && HEX.test(value.trim()) ? `#${value.trim().replace(/^#/, '').toLowerCase()}` : undefined
}

function choice<T extends string>(value: string | null, values: Record<T, string>): T | undefined {
  return value && Object.prototype.hasOwnProperty.call(values, value) ? value as T : undefined
}

export function readBadgeDesign(params: URLSearchParams): BadgeDesign {
  function point(key: string): Point | undefined {
    const value = params.get(key)
    if (!value || !/^-?\d{1,3},-?\d{1,3}$/.test(value)) return
    const [x, y] = value.split(',').map(Number)
    return [clampOffset(x), clampOffset(y)]
  }

  return {
    shape: choice(params.get('shape'), SHAPES),
    font: choice(params.get('font'), FONTS),
    labelColor: badgeColor(params.get('labelColor')),
    countColor: badgeColor(params.get('countColor')),
    labelPosition: point('labelPosition'),
    countPosition: point('countPosition'),
  }
}

export function hasBadgeDesign(design: BadgeDesign) {
  return Boolean((design.shape && design.shape !== 'auto') || (design.font && design.font !== 'auto')
    || design.labelColor || design.countColor || design.labelPosition?.some(Boolean) || design.countPosition?.some(Boolean))
}

type ShapeName = Exclude<Shape, 'auto'>
type Pattern = keyof typeof NEW_DESIGNS
type Orientation = 'horizontal' | 'stacked'
type Recipe = {
  shape: ShapeName
  orientation: Orientation
  pattern?: Pattern
  font: Exclude<Font, 'auto'>
  label: string
  count: string
}

const BASE: Recipe = { shape: 'rectangle', orientation: 'horizontal', font: 'sans', label: '#373344', count: '#0e75b6' }
const RECIPES: Record<Pattern, Recipe> = {
  arcade: { ...BASE, shape: 'octagon', pattern: 'arcade', font: 'mono', label: '#291c42', count: '#9dff78' },
  blueprint: { ...BASE, shape: 'square', orientation: 'stacked', pattern: 'blueprint', font: 'mono', label: '#153c70', count: '#2465a5' },
  split: { ...BASE, pattern: 'split', shape: 'rounded', label: '#f0e9ff', count: '#6741c7' },
  stamp: { ...BASE, pattern: 'stamp', shape: 'ticket', font: 'serif', label: '#fff0d5', count: '#aa4c32' },
  seal: { ...BASE, pattern: 'seal', shape: 'circle', orientation: 'stacked', font: 'serif', label: '#214c43', count: '#173c35' },
  stack: { ...BASE, pattern: 'stack', shape: 'rounded', orientation: 'stacked', label: '#fff5da', count: '#f1bb38' },
  meter: { ...BASE, pattern: 'meter', shape: 'pill', font: 'mono', label: '#142433', count: '#225b51' },
  ribbon: { ...BASE, pattern: 'ribbon', font: 'serif', label: '#702952', count: '#a83d79' },
  crest: { ...BASE, pattern: 'crest', shape: 'shield', orientation: 'stacked', font: 'slab', label: '#412b57', count: '#291c42' },
  marquee: { ...BASE, pattern: 'marquee', shape: 'rounded', font: 'condensed', label: '#241a24', count: '#873d32' },
  glass: { ...BASE, pattern: 'glass', shape: 'pill', font: 'rounded', label: '#513d96', count: '#157a8a' },
  circuit: { ...BASE, pattern: 'circuit', shape: 'hexagon', font: 'mono', label: '#0a3d33', count: '#22554a' },
  prism: { ...BASE, pattern: 'prism', shape: 'diamond', orientation: 'stacked', label: '#4e35a4', count: '#382773' },
  receipt: { ...BASE, pattern: 'receipt', orientation: 'stacked', font: 'mono', label: '#fff9e8', count: '#f5e8c4' },
}

const LEGACY_SHAPES: Partial<Record<string, ShapeName>> = {
  rounded: 'pill', pill: 'pill', social: 'rounded', plastic: 'rounded', outline: 'rounded',
  terminal: 'rounded', minimal: 'rounded', 'for-the-badge': 'rounded', ticket: 'ticket', ledger: 'rounded', orbit: 'pill',
}

export function isNewDesign(style: string): style is Pattern {
  return Object.prototype.hasOwnProperty.call(NEW_DESIGNS, style)
}

function recipeFor(style: string, accent: string) {
  return isNewDesign(style) ? RECIPES[style] : { ...BASE, shape: LEGACY_SHAPES[style] ?? BASE.shape, count: accent }
}

const FAMILY: Record<Exclude<Font, 'auto'>, string> = {
  sans: 'Arial, Helvetica, sans-serif',
  mono: 'Consolas, DejaVu Sans Mono, monospace',
  serif: 'Georgia, Times New Roman, serif',
  slab: 'Rockwell, Georgia, serif',
  condensed: 'Impact, Arial Narrow, sans-serif',
  rounded: 'Trebuchet MS, Verdana, sans-serif',
}

export function badgeGeometry(style: string, design: BadgeDesign, accent = '#0e75b6') {
  const recipe = recipeFor(style, accent)
  const shape = design.shape && design.shape !== 'auto' ? design.shape : recipe.shape
  const compact = ['square', 'circle', 'shield', 'diamond'].includes(shape)
  const stacked = compact || recipe.orientation === 'stacked'
  const width = compact ? 152 : stacked ? 174 : 240
  const height = compact ? 152 : stacked ? 86 : 54
  const label: Point = stacked ? [50, 35] : [32, 50]
  const count: Point = stacked ? [50, 64] : [81, 50]
  const position = (base: Point, offset?: Point): Point => [
    Math.min(88, Math.max(12, base[0] + clampOffset(offset?.[0] ?? 0))),
    Math.min(82, Math.max(18, base[1] + clampOffset(offset?.[1] ?? 0))),
  ]
  return { recipe, shape, stacked, width, height, label: position(label, design.labelPosition), count: position(count, design.countPosition) }
}

function shapeMarkup(shape: ShapeName, w: number, h: number) {
  switch (shape) {
    case 'circle':
    case 'oval': return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>`
    case 'diamond': return `<path d="M${w / 2} 0 ${w} ${h / 2} ${w / 2} ${h} 0 ${h / 2}Z"/>`
    case 'hexagon': return `<path d="M18 0H${w - 18}L${w} ${h / 2} ${w - 18} ${h}H18L0 ${h / 2}Z"/>`
    case 'octagon': return `<path d="M10 0H${w - 10}L${w} 10V${h - 10}L${w - 10} ${h}H10L0 ${h - 10}V10Z"/>`
    case 'shield': return `<path d="M0 12 ${w / 2} 0 ${w} 12V${h * .58}Q${w} ${h * .81} ${w / 2} ${h}Q0 ${h * .81} 0 ${h * .58}Z"/>`
    case 'ticket': return `<path d="M0 0H${w}V${h / 2 - 7}a7 7 0 0 0 0 14V${h}H0V${h / 2 + 7}a7 7 0 0 0 0-14Z"/>`
    default: return `<rect width="${w}" height="${h}" rx="${shape === 'pill' ? h / 2 : shape === 'rounded' ? 12 : 0}"/>`
  }
}

function decorations(pattern: Pattern | undefined, w: number, h: number, stacked: boolean, accent: string) {
  const grid = '<pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="white" opacity=".26"/></pattern>'
  const center = stacked ? h * .51 : w * .64
  switch (pattern) {
    case 'arcade': return `<path d="M5 7H${w - 5}M5 ${h - 7}H${w - 5}" stroke="#fa91d1" stroke-width="3" stroke-dasharray="5 4"/><rect width="${w}" height="${h}" fill="url(#scan)"/>`
    case 'blueprint': return `<defs>${grid}</defs><rect width="${w}" height="${h}" fill="url(#grid)"/><path d="M9 24V9H24m${w - 48} 0h15v15M9 ${h - 24}v15h15m${w - 48} 0h15v-15" fill="none" stroke="#e4f4ff"/>`
    case 'split': return `<path d="${stacked ? `M0 ${center}H${w}` : `M${center} 0V${h}`}" stroke="#fff" stroke-width="6"/>`
    case 'stamp': return `<rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="3" fill="none" stroke="#7f4a52" stroke-width="2" stroke-dasharray="2 4" opacity=".7"/>`
    case 'seal': return `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * .42}" fill="none" stroke="#ddd5a1" stroke-dasharray="2 3"/><path d="M${w * .34} ${h * .51}H${w * .66}" stroke="#ddd5a1"/>`
    case 'stack': return `<path d="M10 ${h - 9}H${w - 10}" stroke="#63381f" stroke-width="2" opacity=".4"/><circle cx="13" cy="12" r="3" fill="${accent}"/><circle cx="23" cy="12" r="3" fill="${accent}"/>`
    case 'meter': return `<path d="M16 ${h - 10}H${w - 16}" stroke="#75edbc" stroke-width="3" stroke-dasharray="6 3"/>`
    case 'ribbon': return `<path d="M0 0H24L17 9 24 18H0zM${w} ${h}h-24l7-9-7-9h24z" fill="#ffbad8"/><path d="M0 ${h - 4}H${w}" stroke="#ffd1e8" opacity=".55"/>`
    case 'crest': return `<path d="M${w * .22} ${h * .25} ${w / 2} ${h * .14} ${w * .78} ${h * .25}M${w * .28} ${h * .75} ${w / 2} ${h * .87} ${w * .72} ${h * .75}" fill="none" stroke="#e6be88" stroke-width="2"/>`
    case 'marquee': return `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="8" fill="none" stroke="#ffe191" stroke-width="3" stroke-dasharray="1 5" stroke-linecap="round"/>`
    case 'glass': return `<rect width="${w}" height="${h}" fill="url(#gloss)"/><path d="M12 ${h * .28}Q${w * .45} 0 ${w - 10} ${h * .27}" fill="none" stroke="white" opacity=".38"/>`
    case 'circuit': return `<path d="M15 11h24l7 7h16M${w - 15} ${h - 11}h-24l-7-7h-16" fill="none" stroke="#8ff7ba"/><circle cx="63" cy="18" r="2" fill="#8ff7ba"/>`
    case 'prism': return `<path d="M0 0H${w}L${w / 2} ${h}Z" fill="white" opacity=".12"/><path d="M${w * .13} ${h * .52}H${w * .87}" stroke="#d0bafb" opacity=".5"/>`
    case 'receipt': return `<path d="M8 ${h * .53}H${w - 8}" stroke="#514438" stroke-dasharray="3 4"/><path d="M8 ${h - 7}H${w - 8}" stroke="#514438" stroke-width="4" stroke-dasharray="1 2 3 1 2 3"/>`
    default: return ''
  }
}

function readable(color: string) {
  const hex = color.slice(1)
  const full = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4
  })
  return .2126 * r + .7152 * g + .0722 * b > .179 ? '#000' : '#fff'
}

function xml(value: string) {
  return value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!)
}

export function renderBadgeDesign(label: string, count: string, accent: string, style: string, design: BadgeDesign) {
  const { recipe, shape, stacked, width: w, height: h, label: labelPoint, count: countPoint } = badgeGeometry(style, design, accent)
  const left = badgeColor(design.labelColor) ?? recipe.label
  const right = badgeColor(design.countColor) ?? recipe.count
  const font = design.font && design.font !== 'auto' ? FAMILY[design.font] : FAMILY[recipe.font]
  const split = stacked ? h * .52 : w * .64
  const rightArea = stacked ? `<rect y="${split}" width="${w}" height="${h - split}" fill="${right}"/>`
    : `<rect x="${split}" width="${w - split}" height="${h}" fill="${right}"/>`

  function text(value: string, point: Point, size: number, color: string, max: number) {
    const x = point[0] * w / 100
    const y = point[1] * h / 100
    const width = Math.max(10, Math.min(max, 2 * Math.min(x, w - x) - 8))
    const fit = [...value].length * size * .68 > width ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : ''
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" stroke="${color === '#fff' ? '#000' : '#fff'}" stroke-width="2" stroke-opacity=".62" paint-order="stroke" ${fit}>${xml(value)}</text>`
  }

  const fillAt = (point: Point) => readable(stacked ? (point[1] >= 52 ? right : left) : (point[0] >= 64 ? right : left))
  const title = xml(`${label}: ${count}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
<title>${title}</title>
<defs><clipPath id="body">${shapeMarkup(shape, w, h)}</clipPath>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1H4" stroke="#000" opacity=".12"/></pattern>
<linearGradient id="gloss" x2="0" y2="100%"><stop stop-color="white" stop-opacity=".34"/><stop offset=".65" stop-color="white" stop-opacity="0"/></linearGradient></defs>
<g clip-path="url(#body)"><rect width="${w}" height="${h}" fill="${left}"/>${rightArea}${decorations(recipe.pattern, w, h, stacked, accent)}
<g font-family="${font}" text-anchor="middle" dominant-baseline="central" font-weight="700">
${text(label, labelPoint, stacked ? 13 : 15, fillAt(labelPoint), shape === 'diamond' ? w * .55 : stacked ? w * .7 : w * .54)}
${text(count, countPoint, stacked ? 26 : 23, fillAt(countPoint), stacked ? w * .55 : w * .29)}
</g></g></svg>`
}
