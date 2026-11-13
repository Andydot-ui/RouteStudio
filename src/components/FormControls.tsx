import React from 'react'
import {
  Box,
  Camera,
  ChevronDown,
  CircleDot,
  X,
} from 'lucide-react'
import { CAMERAS, CAMERA_MAP } from '../lib/planners'
import type { PlannerDraft } from '../lib/types'

export function IconButton({ label, children, onClick, active = false, disabled = false }: {
  label: string
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}) {
  return <button className={`icon-button ${active ? 'is-active' : ''}`} type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}>{children}</button>
}

export function TaskField({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)}/></label>
}

export function NumberField({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (value: number) => void }) {
  return <label className="field"><span>{label}</span><div className="number-input"><input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))}/>{unit && <span>{unit}</span>}</div></label>
}

export function RangeControl({ label, value, min, max, step = 1, unit, onChange, hint }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (value: number) => void; hint?: string }) {
  const percent = ((value - min) / (max - min)) * 100
  return <label className="range-control"><span className="range-label"><span>{label}{hint && <span className="help-mark" title={hint}>?</span>}</span><strong>{value} <small>{unit}</small></strong></span><input type="range" min={min} max={max} step={step} value={value} style={{ '--range-fill': `${percent}%` } as React.CSSProperties} onChange={(event) => onChange(Number(event.target.value))}/></label>
}

export function CameraSelector({ draft, setSettings }: { draft: PlannerDraft; setSettings: (patch: { drone: PlannerDraft['settings']['drone'] }) => void }) {
  const [open, setOpen] = React.useState(false)
  const camera = CAMERA_MAP[draft.settings.drone]
  return <div className="camera-select">
    <button className="camera-select-trigger" type="button" onClick={() => setOpen((v) => !v)}><span className="drone-mini"><Box size={19}/></span><span><strong>{camera.name}</strong><small>{camera.subtitle}</small></span><ChevronDown size={16}/></button>
    {open && <div className="camera-menu"><div className="camera-menu-head">选择机型 <button type="button" onClick={() => setOpen(false)}><X size={15}/></button></div>
      {CAMERAS.map((item) => <button type="button" key={item.id} className={item.id === camera.id ? 'is-selected' : ''} onClick={() => { setSettings({ drone: item.id }); setOpen(false) }}><span className="camera-radio">{item.id === camera.id && <CircleDot size={11}/>}</span><span><strong>{item.name}</strong><small>{item.subtitle}</small></span>{item.id === camera.id && <Camera className="camera-icon" size={15}/>}</button>)}
    </div>}
  </div>
}
