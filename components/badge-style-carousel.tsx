import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props<Style extends string> = {
  name: string
  label: string
  styles: Readonly<Record<Style, string>>
  thumbnails: Partial<Record<Style, string>>
  value: Style
  onChange: (value: Style) => void
  reducedMotion: boolean | null
}

export default function BadgeStyleCarousel<Style extends string>({ name, label, styles, thumbnails, value, onChange, reducedMotion }: Props<Style>) {
  const track = useRef<HTMLDivElement>(null)
  const selected = useRef<HTMLLabelElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const element = track.current
    if (!element) return
    const update = () => setEdges({ start: element.scrollLeft < 4, end: element.scrollWidth - element.clientWidth - element.scrollLeft < 4 })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    element.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => {
    const element = track.current
    const item = selected.current
    if (!element || !item) return
    const left = item.offsetLeft - element.scrollLeft
    const right = left + item.offsetWidth
    if (left < 0 || right > element.clientWidth) {
      element.scrollBy({ left: left < 0 ? left : right - element.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' })
    }
  }, [value, reducedMotion])

  function step(direction: -1 | 1) {
    const element = track.current
    if (!element) return
    element.scrollBy({ left: direction * element.clientWidth * .82, behavior: reducedMotion ? 'instant' : 'smooth' })
  }

  return (
    <div className="style-carousel" role="group" aria-label={label}>
      <div className="style-carousel-heading">
        <span>{label}</span>
        <div className="style-carousel-controls">
          <button type="button" className="quiet-button" aria-label={`Previous ${label.toLowerCase()} options`} disabled={edges.start} onClick={() => step(-1)}><ChevronLeft size={17} aria-hidden="true" /></button>
          <button type="button" className="quiet-button" aria-label={`Next ${label.toLowerCase()} options`} disabled={edges.end} onClick={() => step(1)}><ChevronRight size={17} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="style-carousel-track" ref={track}>
        {(Object.keys(styles) as Style[]).map((style) => (
          <label key={style} className="style-option" ref={style === value ? selected : undefined}>
            <input type="radio" name={name} checked={style === value} onChange={() => onChange(style)} />
            {thumbnails[style] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img className="style-thumbnail" src={thumbnails[style]} alt="" />
            ) : <span className="style-sample" data-style={style} aria-hidden="true"><i /><i /></span>}
            <span>{styles[style]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
