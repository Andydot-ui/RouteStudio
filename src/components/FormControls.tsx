import React, { useState } from 'react'
import { Box, Camera, ChevronDown, CircleDot, X } from 'lucide-react'
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

export function EditableText({ value, onChange, label, placeholder = '', className = '' }: {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  const displayed = editing ? draft : value

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== value) onChange(draft.trim())
  }

  return <input
    className={className}
    value={displayed}
    aria-label={label}
    placeholder={placeholder}
    onFocus={() => setEditing(true)}
    onChange={(event) => setDraft(event.target.value)}
    onBlur={commit}
    onKeyDown={(event) => {
      if (event.key === 'Enter') event.currentTarget.blur()
      if (event.key === 'Escape') {
        setDraft(value)
        event.currentTarget.blur()
      }
    }}
  />
}

export function TaskField({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field"><span>{label}</span><EditableText value={value} onChange={onChange} placeholder={placeholder}/></label>
}

export function NumberField({ label, value, min, max, step = 1, unit, onChange }: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  const [editing, setEditing] = useState(false)
  const displayed = editing ? draft : String(value)

  const commit = () => {
    const text = draft.trim()
    setEditing(false)
    const parsed = text === '' ? Number.NaN : Number(text)
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      return
    }
    const bounded = Math.min(max ?? parsed, Math.max(min ?? parsed, parsed))
    setDraft(String(bounded))
    if (bounded !== value) onChange(bounded)
  }

  return <label className="field"><span>{label}</span><div className="number-input"><input
    type="number"
    inputMode="decimal"
    value={displayed}
    min={min}
    max={max}
    step={step}
    onFocus={() => setEditing(true)}
    onChange={(event) => setDraft(event.target.value)}
    onBlur={commit}
    onWheel={(event) => event.currentTarget.blur()}
    onKeyDown={(event) => {
      if (event.key === 'Enter') event.currentTarget.blur()
      if (event.key === 'Escape') {
        setDraft(String(value))
        event.currentTarget.blur()
      }
    }}
  />{unit && <span>{unit}</span>}</div></label>
}

export function RangeControl({ label, value, min, max, step = 1, unit, onChange, hint }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (value: number) => void; hint?: string }) {
  const percent = ((value - min) / (max - min)) * 100
  return <label className="range-control"><span className="range-label"><span>{label}{hint && <span className="help-mark" title={hint}>?</span>}</span><strong>{value} <small>{unit}</small></strong></span><input type="range" min={min} max={max} step={step} value={value} style={{ '--range-fill': `${percent}%` } as React.CSSProperties} onChange={(event) => onChange(Number(event.target.value))}/></label>
}

export function CameraSelector({ draft, setSettings }: { draft: PlannerDraft; setSettings: (patch: { drone: PlannerDraft['settings']['drone'] }) => void }) {
  const [open, setOpen] = useState(false)
  const camera = CAMERA_MAP[draft.settings.drone] ?? CAMERA_MAP.custom
  const groups = [
    { label: '消费级航拍', items: CAMERAS.filter((item) => item.family === 'consumer') },
    { label: '行业应用', items: CAMERAS.filter((item) => item.family === 'enterprise') },
  ]
  return <div className="camera-select">
    <button className="camera-select-trigger" type="button" onClick={() => setOpen((value) => !value)}><span className="drone-mini"><Box size={19}/></span><span><strong>{camera.name}</strong><small>{camera.subtitle}</small></span><ChevronDown size={16}/></button>
    {open && <div className="camera-menu"><div className="camera-menu-head">选择支持航点的机型 <button type="button" onClick={() => setOpen(false)}><X size={15}/></button></div>
      {groups.map((group) => <div className="camera-group" key={group.label}><div className="camera-group-title">{group.label}</div>{group.items.map((item) => <button type="button" key={item.id} className={item.id === camera.id ? 'is-selected' : ''} onClick={() => { setSettings({ drone: item.id }); setOpen(false) }}><span className="camera-radio">{item.id === camera.id && <CircleDot size={11}/>}</span><span><strong>{item.name}</strong><small>{item.subtitle}</small></span><span className={`waypoint-cap ${item.waypoint}`}>{item.waypoint === 'native' ? '航点支持' : '有限支持'}</span>{item.id === camera.id && <Camera className="camera-icon" size={15}/>}</button>)}</div>)}
    </div>}
  </div>
}
