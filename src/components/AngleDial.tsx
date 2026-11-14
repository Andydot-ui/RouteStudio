import { useEffect, useRef, useState } from 'react'
import type React from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const snap = (value: number, step: number, min: number, max: number) => clamp(Math.round(value / step) * step, min, max)
const norm360 = (value: number) => ((Math.round(value) % 360) + 360) % 360


type DialProps = {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  fullCircle?: boolean
  axis?: boolean
  label: string
  caption: string
}

function useDialDrag(ref: React.RefObject<SVGSVGElement | null>, apply: (angle: number) => void) {
  const [dragging, setDragging] = useState(false)
  const applyRef = useRef(apply)
  useEffect(() => { applyRef.current = apply })
  const angleFrom = (event: React.PointerEvent) => {
    const node = ref.current
    if (!node) return null
    const box = node.getBoundingClientRect()
    const dx = event.clientX - (box.left + box.width / 2)
    const dy = event.clientY - (box.top + box.height / 2)
    if (Math.hypot(dx, dy) < 6) return null
    return { dx, dy }
  }
  const handlers = {
    onPointerDown: (event: React.PointerEvent) => {
      const hit = angleFrom(event)
      if (!hit) return
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
      applyRef.current(Math.atan2(hit.dx, -hit.dy) * 180 / Math.PI)
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (!dragging) return
      const hit = angleFrom(event)
      if (!hit) return
      applyRef.current(Math.atan2(hit.dx, -hit.dy) * 180 / Math.PI)
    },
    onPointerUp: (event: React.PointerEvent) => {
      setDragging(false)
      try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* pointer already released */ }
    },
    onPointerCancel: () => setDragging(false),
  }
  return { dragging, handlers }
}

export function AngleDial({ value, onChange, step = 5, min = 0, max = 359, fullCircle = false, axis = false, label, caption }: DialProps) {
  const ref = useRef<SVGSVGElement | null>(null)
  const { handlers } = useDialDrag(ref, (screenAngle) => {
    const next = fullCircle
      ? norm360(screenAngle)
      : snap(norm360(screenAngle), step, min, max)
    if (next !== value) onChange(next)
  })
  const rotation = axis ? -value : value
  const size = 78
  const c = size / 2
  const r = c - 6
  return <div className={`angle-dial ${axis ? 'is-axis' : ''}`} role="slider" tabIndex={0} aria-label={label}
    aria-valuemin={fullCircle ? 0 : min} aria-valuemax={fullCircle ? 359 : max} aria-valuenow={Math.round(value)}
    onKeyDown={(event) => {
      const delta = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -step : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? step : 0
      if (!delta) return
      event.preventDefault()
      onChange(fullCircle ? norm360(value + delta) : snap(value + delta, step, min, max))
    }}>
    <svg ref={ref} viewBox={`0 0 ${size} ${size}`} {...handlers}>
      <circle className="dial-face" cx={c} cy={c} r={c - 1}/>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180
        const outer = r
        const inner = i % 3 === 0 ? r - 7 : r - 4
        return <line key={i} className="dial-tick" x1={c + Math.cos(angle) * inner} y1={c + Math.sin(angle) * inner} x2={c + Math.cos(angle) * outer} y2={c + Math.sin(angle) * outer}/>
      })}
      <text className="dial-cardinal north" x={c} y={12} textAnchor="middle">N</text>
      <text className="dial-cardinal" x={size - 9} y={c + 3} textAnchor="middle">E</text>
      <text className="dial-cardinal" x={c} y={size - 4} textAnchor="middle">S</text>
      <text className="dial-cardinal" x={9} y={c + 3} textAnchor="middle">W</text>
      <g transform={`rotate(${rotation} ${c} ${c})`}>
        {axis ? <>
          <line className="dial-needle" x1={c} y1={c} x2={c} y2={c - r + 6} transform={`rotate(90 ${c} ${c})`}/>
          <line className="dial-needle" x1={c} y1={c} x2={c} y2={c + r - 6} transform={`rotate(90 ${c} ${c})`}/>
          <polygon className="dial-arrow" points={`${c},${c - r + 3} ${c - 3.4},${c - r + 11} ${c + 3.4},${c - r + 11}`} transform={`rotate(90 ${c} ${c})`}/>
          <polygon className="dial-arrow" points={`${c},${c - r + 3} ${c - 3.4},${c - r + 11} ${c + 3.4},${c - r + 11}`} transform={`rotate(-90 ${c} ${c})`}/>
        </> : <>
          <line className="dial-tail" x1={c} y1={c} x2={c} y2={c + r - 12}/>
          <line className="dial-needle" x1={c} y1={c} x2={c} y2={c - r + 5}/>
          <polygon className="dial-arrow" points={`${c},${c - r + 1} ${c - 4.2},${c - r + 10} ${c + 4.2},${c - r + 10}`}/>
        </>}
      </g>
      <circle className="dial-knob" cx={c} cy={c} r={axis ? 3.4 : 3.4}/>
    </svg>
    <div className="dial-copy"><strong>{caption}</strong><small>拖动表盘调整 · 方向键微调 {step}°</small></div>
  </div>
}

export function PitchDial({ value, onChange, step = 5, label, caption }: { value: number; onChange: (value: number) => void; step?: number; label: string; caption: string }) {
  const ref = useRef<SVGSVGElement | null>(null)
  const { handlers } = useDialDrag(ref, (screenAngle) => {
    // screenAngle is clockwise from north. Fold it into the east/south half plane and
    // read the depression below the horizon as the gimbal pitch (0 down to -90).
    const clockwiseFromEast = screenAngle - 90
    const mirrored = Math.abs(clockwiseFromEast) > 90 ? 180 - Math.abs(clockwiseFromEast) : clockwiseFromEast
    const depression = Math.abs(mirrored)
    onChange(snap(-depression, step, -90, 0))
  })
  const size = 78
  const c = size / 2
  const r = c - 8
  const rad = value * Math.PI / 180
  const tipX = c + Math.cos(rad) * r
  const tipY = c - Math.sin(rad) * r
  return <div className="angle-dial is-pitch" role="slider" tabIndex={0} aria-label={label} aria-valuemin={-90} aria-valuemax={0} aria-valuenow={Math.round(value)}
    onKeyDown={(event) => {
      const delta = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -step : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? step : 0
      if (!delta) return
      event.preventDefault()
      onChange(snap(value + delta, step, -90, 0))
    }}>
    <svg ref={ref} viewBox={`0 0 ${size} ${size}`} {...handlers}>
      <circle className="dial-face" cx={c} cy={c} r={c - 1}/>
      <line className="dial-horizon" x1={8} y1={c} x2={size - 8} y2={c}/>
      <path className="dial-arc" d={`M ${c + r} ${c} A ${r} ${r} 0 0 1 ${c} ${c + r}`}/>
      <text className="dial-cardinal" x={c} y={12} textAnchor="middle">水平 0°</text>
      <text className="dial-cardinal" x={c} y={size - 5} textAnchor="middle">垂直 -90°</text>
      <line className="dial-needle" x1={c} y1={c} x2={tipX} y2={tipY}/>
      <circle className="dial-knob" cx={c} cy={c} r={3.4}/>
      <circle className="dial-tip" cx={tipX} cy={tipY} r={3.6}/>
    </svg>
    <div className="dial-copy"><strong>{caption}</strong><small>拖动表盘调整 · 方向键微调 {step}°</small></div>
  </div>
}
