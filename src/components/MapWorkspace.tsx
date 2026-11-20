import { useState } from 'react'
import { ChevronDown, Copy, Crosshair, Eye, Layers3, LocateFixed, MousePointer2, Pencil, Plus, SkipBack, SkipForward, X } from 'lucide-react'
import { MapCanvas, type BaseMap } from './MapCanvas'
import { PLANNER_DEFS, polygonArea } from '../lib/planners'
import type { LngLat, PlannerDraft, PlannerResult } from '../lib/types'

const BASE_MAP_LABELS: Record<BaseMap, string> = { satellite: '卫星影像', streets: '街道地图' }

export function MapWorkspace({ draft, result, baseMap, setBaseMap, showNumbers, setShowNumbers, showCamera, setShowCamera, showLabels, setShowLabels, drawing, setDrawing, onAddPoint, onSetInput, onSelectInput, onLocate, onClear, onUndo, onFinishPolygon, previewIndex, setPreviewIndex, onNotice }: {
  draft: PlannerDraft
  result: PlannerResult
  baseMap: BaseMap
  setBaseMap: (base: BaseMap) => void
  showNumbers: boolean
  setShowNumbers: React.Dispatch<React.SetStateAction<boolean>>
  showCamera: boolean
  setShowCamera: React.Dispatch<React.SetStateAction<boolean>>
  showLabels: boolean
  setShowLabels: React.Dispatch<React.SetStateAction<boolean>>
  drawing: boolean
  setDrawing: React.Dispatch<React.SetStateAction<boolean>>
  onAddPoint: (point: LngLat) => void
  onSetInput: (points: LngLat[]) => void
  onSelectInput: (index: number | null) => void
  onLocate: (point: LngLat) => void
  onClear: () => void
  onUndo: () => void
  onFinishPolygon: () => void
  previewIndex: number | null
  setPreviewIndex: React.Dispatch<React.SetStateAction<number | null>>
  onNotice: (message: string, tone?: 'success' | 'error' | 'info') => void
}) {
  const [mapMenu, setMapMenu] = useState(false)
  const [layersMenu, setLayersMenu] = useState(false)
  const def = PLANNER_DEFS[0]
  const amount = draft.input.length
  const total = result.waypoints.length
  const current = previewIndex === null ? -1 : Math.min(previewIndex, total - 1)
  const drafting = drawing && amount > 0
  const draftArea = drafting ? polygonArea(draft.input) : 0
  const areaText = draftArea >= 10000 ? `${(draftArea / 10000).toFixed(2)} 公顷` : draftArea > 0 ? `${Math.round(draftArea)} m²` : ''
  const preview = current >= 0 ? result.waypoints[current] : undefined
  const step = (delta: number) => setPreviewIndex((index) => {
    const base = index === null ? (delta > 0 ? -1 : total) : index
    return Math.max(0, Math.min(total - 1, base + delta))
  })
  return <main className="map-workspace">
    <MapCanvas draft={draft} result={result} baseMap={baseMap} showNumbers={showNumbers} showCamera={showCamera} showLabels={showLabels} drawing={drawing} onAddPoint={onAddPoint} onSetInput={onSetInput} onSelectInput={onSelectInput} onLocate={onLocate} onFinishPolygon={onFinishPolygon} previewIndex={previewIndex}/>
    <div className="map-top-left">
      <div className="map-layer-controls"><button type="button" onClick={() => { setMapMenu((value) => !value); setLayersMenu(false) }}><Layers3 size={17}/><span>{BASE_MAP_LABELS[baseMap]}</span><ChevronDown size={13}/></button>{mapMenu && <div className="floating-menu map-menu">{Object.entries(BASE_MAP_LABELS).map(([key, label]) => <button key={key} className={baseMap === key ? 'is-selected' : ''} type="button" onClick={() => { setBaseMap(key as BaseMap); setMapMenu(false) }}>{baseMap === key && <span>✓</span>}{label}</button>)}</div>}</div>
    </div>
    <div className="map-top-right">
      <button type="button" className={`floating-pill drawing-pill ${drawing ? 'is-active' : ''}`} onClick={() => setDrawing((value) => !value)}><span className="drawing-status-icon"><Pencil size={16}/></span><span className="drawing-pill-copy"><strong>{drawing ? '正在绘制' : '开始绘制'}</strong><small>{drawing ? (draft.kind === 'points' ? '连续单击添加 · 右键拖动地图' : '单击连续绘制 · 双击完成 · 右键拖动') : def.hint}</small></span></button>
      <div className="map-tool-stack"><button type="button" title="撤销上一步" onClick={onUndo}><span className="undo-mark">↶</span></button><button type="button" title="图层面板" className={layersMenu ? 'is-active' : ''} onClick={() => { setLayersMenu((value) => !value); setMapMenu(false) }}><Layers3 size={17}/></button><button type="button" title="航点编号" className={showNumbers ? 'is-active' : ''} onClick={() => setShowNumbers((value) => !value)}><span className="small-number">#</span></button><button type="button" title="相机视锥" className={showCamera ? 'is-active' : ''} onClick={() => setShowCamera((value) => !value)}><Eye size={17}/></button><button type="button" title="定位当前位置" onClick={() => navigator.geolocation?.getCurrentPosition((position) => onLocate([position.coords.longitude, position.coords.latitude]), () => onNotice('浏览器未获得定位权限', 'info'))}><LocateFixed size={17}/></button></div>
      {layersMenu && <div className="floating-menu layer-menu"><div className="floating-menu-title">地图显示 <button type="button" onClick={() => setLayersMenu(false)}><X size={14}/></button></div><label><input type="checkbox" checked={showLabels} disabled={baseMap !== 'satellite'} onChange={(event) => setShowLabels(event.target.checked)}/><span>显示路名注记</span></label><label><input type="checkbox" checked={showNumbers} onChange={(event) => setShowNumbers(event.target.checked)}/><span>显示航点编号</span></label><label><input type="checkbox" checked={showCamera} onChange={(event) => setShowCamera(event.target.checked)}/><span>显示相机视锥</span></label><div className="layer-line"/><button className="layer-reset-button" type="button" onClick={() => { onClear(); setDrawing(true); setLayersMenu(false) }}><Plus size={14}/>新建绘制区域</button></div>}
    </div>
    {drafting && <div className="draw-coach" role="status" aria-live="polite">
      <div className="draw-coach-copy">
        <strong>{amount < 3 ? `已放置 ${amount} 个节点` : `${amount} 个节点 · ${areaText}`}</strong>
        <span>{amount < 3 ? '继续单击添加边界节点' : '继续单击添加节点 · 双击或点「完成区域」收尾'}</span>
      </div>
      {amount >= 3 && <button type="button" className="draw-coach-finish" onClick={onFinishPolygon}>完成区域</button>}
    </div>}
    {result.waypoints.length > 0 && !drawing && <div className="wp-stepper" role="group" aria-label="逐航点预览">
      <button type="button" aria-label="上一个航点" title="上一个航点 [" disabled={current <= 0} onClick={() => step(-1)}><SkipBack size={15}/></button>
      <button type="button" className="wp-stepper-main" onClick={() => current >= 0 && onLocate([result.waypoints[current].lon, result.waypoints[current].lat])} title="定位到当前航点">
        <strong>{current >= 0 ? `航点 ${current + 1} / ${total}` : `共 ${total} 个航点`}</strong>
        <span>{preview ? `${Math.round(preview.height)} m · 云台 ${Math.round(preview.pitch)}° · ${preview.takePhoto ? '拍照' : '过渡'}` : '按 [ ] 或点击逐个查看'}</span>
      </button>
      <button type="button" aria-label="下一个航点" title="下一个航点 ]" disabled={current >= result.waypoints.length - 1} onClick={() => step(1)}><SkipForward size={15}/></button>
      <span className="wp-stepper-divider"/>
      <button type="button" className="wp-preview-ring" aria-label="退出航点预览" title="退出预览" onClick={() => setPreviewIndex(null)}>{preview ? <span className="wp-preview-dot"/> : <Eye size={15}/>}</button>
    </div>}
    <div className={`map-bottom-card${drafting ? ' is-drafting' : ''}`}><div className="coordinate-mark"><Crosshair size={14}/></div><div><span>WGS 84</span><strong>{draft.input.length ? `${draft.input[0][1].toFixed(6)}, ${draft.input[0][0].toFixed(6)}` : '点击开始布置航线'}</strong></div><button type="button" aria-label="复制坐标" onClick={() => { const first = draft.input[0] ?? [113.662923, 34.830072]; navigator.clipboard?.writeText(`${first[1]}, ${first[0]}`).then(() => onNotice('坐标已复制')).catch(() => onNotice('复制失败', 'error')) }}><Copy size={15}/></button></div>
    <div className="map-help-hint"><MousePointer2 size={13}/>右键拖动地图 <span>·</span> {amount ? `${amount} 个控制点` : '左键添加节点'} <span>·</span> 拖动控制点调整</div>
  </main>
}
