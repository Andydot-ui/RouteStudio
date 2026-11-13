import { useState } from 'react'
import { ChevronDown, Crosshair, Eye, Layers3, LocateFixed, MoreHorizontal, MousePointer2, Pencil, Plus, X } from 'lucide-react'
import { MapCanvas, type BaseMap } from './MapCanvas'
import { PLANNER_DEFS } from '../lib/planners'
import type { LngLat, PlannerDraft, PlannerResult } from '../lib/types'

const BASE_MAP_LABELS: Record<BaseMap, string> = { satellite: '卫星影像', streets: '街道地图', terrain: '地形地图' }

export function MapWorkspace({ draft, result, baseMap, setBaseMap, showNumbers, setShowNumbers, showCamera, setShowCamera, drawing, setDrawing, onAddPoint, onSetInput, onSelectInput, onLocate, onClear, onUndo, onNotice }: {
  draft: PlannerDraft
  result: PlannerResult
  baseMap: BaseMap
  setBaseMap: (base: BaseMap) => void
  showNumbers: boolean
  setShowNumbers: React.Dispatch<React.SetStateAction<boolean>>
  showCamera: boolean
  setShowCamera: React.Dispatch<React.SetStateAction<boolean>>
  drawing: boolean
  setDrawing: React.Dispatch<React.SetStateAction<boolean>>
  onAddPoint: (point: LngLat) => void
  onSetInput: (points: LngLat[]) => void
  onSelectInput: (index: number | null) => void
  onLocate: (point: LngLat) => void
  onClear: () => void
  onUndo: () => void
  onNotice: (message: string, tone?: 'success' | 'error' | 'info') => void
}) {
  const [mapMenu, setMapMenu] = useState(false)
  const [layersMenu, setLayersMenu] = useState(false)
  const def = PLANNER_DEFS.find((item) => item.kind === draft.kind) ?? PLANNER_DEFS[0]
  const amount = draft.input.length
  return <main className="map-workspace">
    <MapCanvas draft={draft} result={result} baseMap={baseMap} showNumbers={showNumbers} showCamera={showCamera} drawing={drawing} onAddPoint={onAddPoint} onSetInput={onSetInput} onSelectInput={onSelectInput} onLocate={onLocate}/>
    <div className="map-top-left">
      <div className="map-layer-controls"><button type="button" onClick={() => { setMapMenu((value) => !value); setLayersMenu(false) }}><Layers3 size={17}/><span>{BASE_MAP_LABELS[baseMap]}</span><ChevronDown size={13}/></button>{mapMenu && <div className="floating-menu map-menu">{Object.entries(BASE_MAP_LABELS).map(([key, label]) => <button key={key} className={baseMap === key ? 'is-selected' : ''} type="button" onClick={() => { setBaseMap(key as BaseMap); setMapMenu(false) }}>{baseMap === key && <span>✓</span>}{label}</button>)}</div>}</div>
    </div>
    <div className="map-top-right">
      <button type="button" className={`floating-pill drawing-pill ${drawing ? 'is-active' : ''}`} onClick={() => setDrawing((value) => !value)}><span className="drawing-status-icon"><Pencil size={16}/></span><span className="drawing-pill-copy"><strong>{drawing ? '正在绘制' : '开始绘制'}</strong><small>{drawing ? '左键添加节点 · 右键拖动地图' : def.hint}</small></span></button>
      <div className="map-tool-stack"><button type="button" title="撤销上一步" onClick={onUndo}><span className="undo-mark">↶</span></button><button type="button" title="图层面板" className={layersMenu ? 'is-active' : ''} onClick={() => { setLayersMenu((value) => !value); setMapMenu(false) }}><Layers3 size={17}/></button><button type="button" title="航点编号" className={showNumbers ? 'is-active' : ''} onClick={() => setShowNumbers((value) => !value)}><span className="small-number">#</span></button><button type="button" title="相机视锥" className={showCamera ? 'is-active' : ''} onClick={() => setShowCamera((value) => !value)}><Eye size={17}/></button><button type="button" title="定位当前位置" onClick={() => navigator.geolocation?.getCurrentPosition((position) => onLocate([position.coords.longitude, position.coords.latitude]), () => onNotice('浏览器未获得定位权限', 'info'))}><LocateFixed size={17}/></button></div>
      {layersMenu && <div className="floating-menu layer-menu"><div className="floating-menu-title">地图显示 <button type="button" onClick={() => setLayersMenu(false)}><X size={14}/></button></div><label><input type="checkbox" checked={showNumbers} onChange={(event) => setShowNumbers(event.target.checked)}/><span>显示航点编号</span></label><label><input type="checkbox" checked={showCamera} onChange={(event) => setShowCamera(event.target.checked)}/><span>显示相机视锥</span></label><div className="layer-line"/><button className="layer-reset-button" type="button" onClick={() => { onClear(); setDrawing(true); setLayersMenu(false) }}><Plus size={14}/>新建绘制区域</button></div>}
    </div>
    <div className="map-bottom-card"><div className="coordinate-mark"><Crosshair size={14}/></div><div><span>WGS 84</span><strong>{draft.input.length ? `${draft.input[0][1].toFixed(6)}, ${draft.input[0][0].toFixed(6)}` : '点击开始布置航线'}</strong></div><button type="button" aria-label="复制坐标" onClick={() => { const first = draft.input[0] ?? [113.66425, 34.8298]; navigator.clipboard?.writeText(`${first[1]}, ${first[0]}`).then(() => onNotice('坐标已复制')).catch(() => onNotice('复制失败', 'error')) }}><MoreHorizontal size={16}/></button></div>
    <div className="map-help-hint"><MousePointer2 size={13}/>右键拖动地图 <span>·</span> {amount ? `${amount} 个控制点` : '左键添加节点'} <span>·</span> 拖动控制点调整</div>
  </main>
}
