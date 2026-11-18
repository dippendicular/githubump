import { useRef, type PointerEvent } from 'react'
import { Move } from 'lucide-react'
import { clampOffset, type Point } from '@/lib/badge-design'

export type PositionKey = 'labelPosition' | 'countPosition'

const HANDLES = [
  { key: 'labelPosition', label: 'Label' },
  { key: 'countPosition', label: 'Count' },
] as const

const ARROWS: Record<string, Point> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
}

type Props = {
  label: Point
  count: Point
  offsets: Record<PositionKey, Point>
  onMove: (key: PositionKey, offset: Point) => void
}

export default function BadgePositionEditor({ label, count, offsets, onMove }: Props) {
  const overlay = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointer: number; x: number; y: number; width: number; height: number; start: Point } | null>(null)

  function start(event: PointerEvent<HTMLButtonElement>, key: PositionKey) {
    const bounds = overlay.current?.getBoundingClientRect()
    if (!bounds?.width || !bounds.height || !event.isPrimary || event.button !== 0) return
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, width: bounds.width, height: bounds.height, start: offsets[key] }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function move(event: PointerEvent<HTMLButtonElement>, key: PositionKey) {
    const active = drag.current
    if (!active || active.pointer !== event.pointerId) return
    onMove(key, [
      clampOffset(active.start[0] + (event.clientX - active.x) * 100 / active.width),
      clampOffset(active.start[1] + (event.clientY - active.y) * 100 / active.height),
    ])
  }

  return (
    <div className="position-overlay" ref={overlay}>
      {HANDLES.map(({ key, label: name }) => {
        const [x, y] = key === 'labelPosition' ? label : count
        return (
          <button key={key} type="button" className="position-handle" style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={`Move ${name.toLowerCase()}`} aria-describedby="position-help"
            onPointerDown={(event) => start(event, key)} onPointerMove={(event) => move(event, key)}
            onLostPointerCapture={(event) => { if (drag.current?.pointer === event.pointerId) drag.current = null }}
            onKeyDown={(event) => {
              const delta = ARROWS[event.key]
              if (!delta) return
              event.preventDefault()
              const step = event.shiftKey ? 5 : 1
              onMove(key, [clampOffset(offsets[key][0] + step * delta[0]), clampOffset(offsets[key][1] + step * delta[1])])
            }}>
            <Move size={12} aria-hidden="true" />{name}
          </button>
        )
      })}
    </div>
  )
}
