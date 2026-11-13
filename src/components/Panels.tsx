import { useState } from 'react'
import { Camera, ChevronRight, Crosshair, Download, FolderOpen, MoreHorizontal, Settings2, Trash2 } from 'lucide-react'
import { IconButton } from './FormControls'
import { PLANNER_DEFS } from '../lib/planners'
import type { PlannerDraft, PlannerKind, PlannerResult, Waypoint } from '../lib/types'

type SavedMission = { id: string; name: string; kind: PlannerKind; updatedAt: string; draft: PlannerDraft }
const fmtDistance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`

export function WaypointList({ result, onView, onDelete }: { result: PlannerResult; onView: (point: Waypoint) => void; onDelete: (index: number) => void }) {
  const [tab, setTab] = useState<'waypoints' | 'actions'>('waypoints')
  const [search, setSearch] = useState('')
  const filtered = result.waypoints
    .map((point, index) => ({ ...point, index }))
    .filter((point) => !search || String(point.index + 1).includes(search.trim()))
    .filter((point) => tab === 'waypoints' || point.takePhoto)
  return <section className="waypoints-panel"><div className="settings-panel-header"><div><span className="eyebrow">航点与动作</span><h2>航线序列 <span>{result.waypoints.length}</span></h2></div><IconButton label="更多"><MoreHorizontal size={18}/></IconButton></div><div className="tabs"><button type="button" className={tab === 'waypoints' ? 'is-active' : ''} onClick={() => setTab('waypoints')}>航点 <span>{result.waypoints.length}</span></button><button type="button" className={tab === 'actions' ? 'is-active' : ''} onClick={() => setTab('actions')}>相机动作 <span>{result.captureCount}</span></button></div><div className="waypoint-tools"><div className="search-input"><Crosshair size={14}/><input value={search} placeholder="筛选航点序号" onChange={(event) => setSearch(event.target.value)}/></div><IconButton label="航点设置"><Settings2 size={16}/></IconButton></div><div className="waypoint-scroll">{filtered.map((point) => <div className="waypoint-row" key={`${point.index}-${point.lon}`}><span className={`waypoint-index ${point.takePhoto ? 'capture' : ''}`}>{String(point.index + 1).padStart(2, '0')}</span><button type="button" className="waypoint-main" onClick={() => onView(point)}><strong>{point.lat.toFixed(6)}, {point.lon.toFixed(6)}</strong><span>{Math.round(point.height)} m · {point.speed.toFixed(1)} m/s · 云台 {Math.round(point.pitch)}°</span></button>{point.takePhoto && <span className="camera-badge" title="拍照"><Camera size={13}/></span>}<button type="button" className="row-delete" aria-label="删除航点" onClick={() => onDelete(point.index)}><Trash2 size={14}/></button></div>)}{!filtered.length && <div className="empty-list">暂无航点。</div>}</div><div className="waypoint-footer"><span><span className="legend-dot capture"/>拍照航点</span><span><span className="legend-dot"/>过渡航点</span><button type="button">全部展开 <ChevronRight size={13}/></button></div></section>
}

export function FilesPanel({ missions, onOpen, onDelete, draft, result, onExport }: { missions: SavedMission[]; onOpen: (mission: SavedMission) => void; onDelete: (id: string) => void; draft: PlannerDraft; result: PlannerResult; onExport: () => void }) {
  return <section className="files-panel"><div className="settings-panel-header"><div><span className="eyebrow">本地任务库</span><h2>我的航线 <span>{missions.length}</span></h2></div></div><div className="files-summary"><div className="folder-icon"><FolderOpen size={24}/></div><div><strong>任务保存在此浏览器</strong><span>无需账号，不会上传至服务器</span></div></div><div className="file-list">{missions.map((mission) => { const def = PLANNER_DEFS.find((item) => item.kind === mission.kind); return <div className="file-row" key={mission.id}><span className="file-type" style={{ background: def?.color }}>{def?.shortLabel[0]}</span><button type="button" className="file-main" onClick={() => onOpen(mission)}><strong>{mission.name}</strong><span>{def?.label} · {mission.draft.input.length} 控制点 · {new Date(mission.updatedAt).toLocaleDateString('zh-CN')}</span></button><button type="button" className="row-delete" onClick={() => onDelete(mission.id)} aria-label="删除已保存任务"><Trash2 size={14}/></button></div> })} {!missions.length && <div className="empty-files"><FolderOpen size={28}/><strong>还没有保存的任务</strong><span>完成规划后点击顶部的“保存”。</span></div>}</div><div className="current-output"><span>当前任务</span><strong>{draft.settings.name}</strong><div><span>{result.waypoints.length} 个航点</span><span>{fmtDistance(result.pathLength)}</span></div><button className="button primary full" type="button" onClick={onExport}><Download size={16}/>导出 DJI KMZ</button></div></section>
}

export type { SavedMission }
