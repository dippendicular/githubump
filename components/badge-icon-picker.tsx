import { useEffect, useState } from 'react'
import { Search, Shapes } from 'lucide-react'
import { ICON_PACKS, type BadgeIcon, type IconPack } from '@/lib/badge-assets'

type Result = BadgeIcon & { key: string; name: string }
type Catalog = { icons: Result[]; total: number; hasMore: boolean }

export default function BadgeIconPicker({ label, value, onChange }: { label: string; value?: string; onChange: (icon?: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pack, setPack] = useState<IconPack>('solid')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<{ key: string; catalog: Catalog | null } | null>(null)
  const key = new URLSearchParams({ pack, q: query, page: String(page) }).toString()
  const current = result?.key === key ? result.catalog : undefined

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/badge-assets?${key}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Icon list unavailable')
        const catalog: Catalog = await response.json()
        if (!controller.signal.aborted) setResult({ key, catalog })
      } catch {
        if (!controller.signal.aborted) setResult({ key, catalog: null })
      }
    }, 150)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [open, key])

  return (
    <details className="badge-icon-picker" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary><Shapes size={16} aria-hidden="true" /> {label} <span>{value ? value.split(':')[1].replaceAll('-', ' ') : 'None'}</span></summary>
      <div className="badge-icon-picker-body">
        <div className="icon-pack-options" role="group" aria-label={`${label} packs`}>
          {(Object.keys(ICON_PACKS) as IconPack[]).map((item) => (
            <button key={item} type="button" className="quiet-button" aria-pressed={pack === item} onClick={() => { setPack(item); setPage(0) }}>{ICON_PACKS[item]}</button>
          ))}
          {value && <button type="button" className="quiet-button icon-clear" onClick={() => onChange(undefined)}>Remove icon</button>}
        </div>
        <label className="icon-search"><Search size={15} aria-hidden="true" /><input aria-label={`Search ${label.toLowerCase()}`} placeholder="Search Font Awesome" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} maxLength={60} /></label>
        {current === undefined ? <p className="field-hint" role="status">Loading icons…</p> : current === null ? <p className="field-hint" role="status">Icons unavailable.</p> : (
          <>
            <div className="badge-icon-grid">
              {current.icons.map((icon) => (
                <button key={icon.key} type="button" aria-label={icon.name} className="quiet-button" title={icon.name} aria-pressed={value === icon.key} onClick={() => onChange(icon.key)}>
                  <svg viewBox={`0 0 ${icon.width} ${icon.height}`} width="20" height="20" fill="currentColor" aria-hidden="true">
                    {icon.paths.map((path, index) => <path key={index} d={path} />)}
                  </svg>
                </button>
              ))}
            </div>
            <div className="icon-pagination">
              <span role="status">{current.total} {current.total === 1 ? 'icon' : 'icons'}{current.total > 24 ? ` · Page ${page + 1}` : ''}</span>
              <button type="button" className="quiet-button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <button type="button" className="quiet-button" disabled={!current.hasMore} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </>
        )}
      </div>
    </details>
  )
}
