import type { RefObject } from 'react'
import BadgeIconPicker from '@/components/badge-icon-picker'
import ThemedSelect from '@/components/themed-select'
import { FONTS, SHAPES, type BadgeDesign } from '@/lib/badge-design'

type Props = {
  prefix: string
  design: BadgeDesign
  labelPaint: string
  countPaint: string
  container: RefObject<HTMLElement | null>
  onChange: <K extends keyof BadgeDesign>(key: K, value: BadgeDesign[K]) => void
}

export default function BadgeAppearance({ prefix, design, labelPaint, countPaint, container, onChange }: Props) {
  const repo = prefix === 'repo'
  const name = (label: string) => repo ? `Repository ${label.toLowerCase()}` : label
  const colors = [
    { key: 'labelColor', text: 'Label color', paint: labelPaint },
    { key: 'countColor', text: 'Count color', paint: countPaint },
  ] as const

  return (
    <div className="appearance-grid">
      <div className="appearance-choice">
        <label id={`${prefix}-font-label`} htmlFor={`${prefix}-font`}>{name('Font')}</label>
        <ThemedSelect id={`${prefix}-font`} container={container} items={FONTS} value={design.font ?? 'auto'} onChange={(value) => onChange('font', value)} />
      </div>
      <div className="appearance-choice">
        <label id={`${prefix}-shape-label`} htmlFor={`${prefix}-shape`}>{name('Shape')}</label>
        <ThemedSelect id={`${prefix}-shape`} container={container} items={SHAPES} value={design.shape ?? 'auto'} onChange={(value) => onChange('shape', value)} />
      </div>
      {colors.map(({ key, text, paint }) => (
        <div className="region-color" key={key}>
          <label>{name(text)} <input type="color" value={paint} onChange={(event) => onChange(key, event.target.value)} /></label>
          {design[key] && <button type="button" className="quiet-button" aria-label={`Reset ${name(text).toLowerCase()}`} onClick={() => onChange(key, undefined)}>Auto</button>}
        </div>
      ))}
      <BadgeIconPicker label={repo ? 'Repository icon' : 'Views icon'} value={design.icon} onChange={(icon) => onChange('icon', icon)} />
    </div>
  )
}
