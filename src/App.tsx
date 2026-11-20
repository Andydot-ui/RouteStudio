import { useEffect, useMemo, useRef, useState } from 'react'
import { FileDown, FolderOpen, Trash2, Waypoints, X } from 'lucide-react'
import { MainTopbar, Sidebar, type Theme } from './components/Shell'
import { MissionSettings } from './components/MissionSettings'
import { MapWorkspace } from './components/MapWorkspace'
import { WaypointList, FilesPanel, type SavedMission } from './components/Panels'
import { MobileLayer, type MobilePanel } from './components/MobileLayer'
import { PlannerGlyph } from './components/PlannerGlyph'
import { buildKmz, buildWaylinesXml, downloadBytes, importMissionBuffer, validateWpmlMission } from './lib/dji'
import { calculatePlan, createDemoDraft, DEFAULT_DRAFT, PLANNER_DEFS, sanitizeSettings } from './lib/planners'
import { migrateDraft, DATUM_VERSION } from './lib/datum'
import type { BaseMap } from './components/MapCanvas'
import type { LngLat, PlannerDraft, PlannerKind, PlannerSettings, Waypoint } from './lib/types'
import './App.css'
import './planner.css'

const STORAGE_KEY = 'dji-route-studio-missions-v1'
const SESSION_KEY = 'dji-route-studio-session-v1'
const THEME_KEY = 'dji-route-studio-theme'
function cloneDraft(draft: PlannerDraft) { return structuredClone(draft) }
// The session wrapper records when the draft was last stored, which is what lets the datum
// migration tell pre-fix data from post-fix data. The bare-draft form written by earlier
// builds carries no timestamp and is therefore treated as pre-fix.
type SessionRecord = { v: 2; savedAt: number; draft: PlannerDraft }
function parseDraft(value: unknown): PlannerDraft | null {
  if (!value || typeof value !== 'object') return null
  const parsed = value as PlannerDraft
  if (!Array.isArray(parsed.input) || !parsed.settings) return null
  return { ...parsed, kind: 'grid', settings: sanitizeSettings({ ...DEFAULT_DRAFT.settings, ...parsed.settings }) }
}
function readSession(): PlannerDraft {
  try {
    const value = sessionStorage.getItem(SESSION_KEY)
    if (!value) return cloneDraft(DEFAULT_DRAFT)
    const stored = JSON.parse(value) as unknown
    if (stored && typeof stored === 'object' && (stored as SessionRecord).v === 2) {
      const record = stored as SessionRecord
      const draft = parseDraft(record.draft)
      if (!draft) return cloneDraft(DEFAULT_DRAFT)
      return migrateDraft(draft, Number.isFinite(record.savedAt) ? record.savedAt : null)
    }
    const draft = parseDraft(stored)
    if (!draft) return cloneDraft(DEFAULT_DRAFT)
    return migrateDraft(draft, null)
  } catch { return cloneDraft(DEFAULT_DRAFT) }
}
function writeSession(draft: PlannerDraft) {
  // Every draft this build stores is stamped with the current datum, so the migration never
  // has to trust the machine clock for data that was drawn on the WGS 84 base maps.
  const record: SessionRecord = { v: 2, savedAt: Date.now(), draft: { ...draft, datum: DATUM_VERSION } }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(record))
}
function readTheme(): Theme { const value = localStorage.getItem(THEME_KEY); if (value === 'light' || value === 'dark') return value; return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }
function readMissions(): SavedMission[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    const parsed = value ? JSON.parse(value) as unknown : []
    if (!Array.isArray(parsed)) return []
    return (parsed as SavedMission[]).map((mission) => {
      const savedAt = Date.parse(mission.updatedAt)
      return { ...mission, draft: migrateDraft(mission.draft, Number.isFinite(savedAt) ? savedAt : null) }
    })
  } catch { return [] }
}
function postToast(message: string, tone: 'success' | 'error' | 'info' = 'success') { window.dispatchEvent(new CustomEvent('route-toast', { detail: { message, tone } })) }
function safeFilename(name: string) { return (name.trim() || 'DJI 航线任务').replace(/[/:*?"<>|]/g, '_') }
function applyMissionName(draft: PlannerDraft, name: string): PlannerDraft { const importedBase = draft.importedName?.replace(/\.(kmz|kml)$/i, ''); return { ...draft, settings: { ...draft.settings, name }, importedWaypoints: draft.importedWaypoints && importedBase !== name ? undefined : draft.importedWaypoints } }

function App() {
  const [draft, setDraft] = useState<PlannerDraft>(readSession)
  const [history, setHistory] = useState<PlannerDraft[]>([readSession()])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [drawing, setDrawing] = useState(() => readSession().input.length === 0)
  const [baseMap, setBaseMap] = useState<BaseMap>('satellite')
  const [showNumbers, setShowNumbers] = useState(false)
  const [showCamera, setShowCamera] = useState(true)
  const [workspaceMode, setWorkspaceMode] = useState<'planner' | 'waypoints' | 'files'>('planner')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [missions, setMissions] = useState<SavedMission[]>(readMissions)
  const [savedName, setSavedName] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: string; id: number } | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const result = useMemo(() => calculatePlan(draft), [draft])
  const previewIndexSafe = previewIndex === null || result.waypoints.length === 0 ? null : Math.min(previewIndex, result.waypoints.length - 1)
  const activeDef = PLANNER_DEFS.find((item) => item.kind === draft.kind) ?? PLANNER_DEFS[0]
  const lastDrawTime = useRef(0)
  const actionsRef = useRef({ save: () => undefined as void, exportKmz: () => undefined as void, waypointCount: 0 })

  useEffect(() => { writeSession(draft) }, [draft])
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; localStorage.setItem(THEME_KEY, theme); document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#202020' : '#f3f3f3') }, [theme])
  useEffect(() => { const onToast = (event: Event) => { const data = (event as CustomEvent<{ message: string; tone: string }>).detail; setToast({ ...data, id: Date.now() }) }; window.addEventListener('route-toast', onToast); return () => window.removeEventListener('route-toast', onToast) }, [])
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(null), 3300); return () => window.clearTimeout(timeout) }, [toast])
  useEffect(() => { const onRadius = (event: Event) => setDraft((current) => ({ ...current, settings: sanitizeSettings({ ...current.settings, orbitRadius: Number((event as CustomEvent<number>).detail) }) })); window.addEventListener('route-radius', onRadius); return () => window.removeEventListener('route-radius', onRadius) }, [])
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return; if (event.key === 'Escape') { setDrawing(false); setMobilePanel(null); setDrawerOpen(false) } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); setHistoryIndex((index) => { const next = event.shiftKey ? Math.min(history.length - 1, index + 1) : Math.max(0, index - 1); setDraft(cloneDraft(history[next])); return next }) } if ((event.key === 'Delete' || event.key === 'Backspace') && draft.selectedIndex !== null) { event.preventDefault(); setDraft((current) => ({ ...current, importedWaypoints: undefined, input: current.input.filter((_, index) => index !== current.selectedIndex), selectedIndex: null })) } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); actionsRef.current.save() } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') { event.preventDefault(); actionsRef.current.exportKmz() } if (event.key === '[') { event.preventDefault(); setPreviewIndex((index) => Math.max(0, (index ?? 1) - 1)) } if (event.key === ']') { event.preventDefault(); setPreviewIndex((index) => Math.min(Math.max(0, actionsRef.current.waypointCount - 1), index === null ? 0 : index + 1)) } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [draft.selectedIndex, history])

  const commit = (next: PlannerDraft) => { const nextHistory = history.slice(0, historyIndex + 1); nextHistory.push(cloneDraft(next)); setHistory(nextHistory.slice(-80)); setHistoryIndex(Math.min(79, nextHistory.length - 1)); setDraft(next) }
  const undo = () => { if (historyIndex <= 0) return; const next = historyIndex - 1; setHistoryIndex(next); setDraft(cloneDraft(history[next])) }
  const redo = () => { if (historyIndex >= history.length - 1) return; const next = historyIndex + 1; setHistoryIndex(next); setDraft(cloneDraft(history[next])) }
  const setSelected = (index: number | null) => setDraft((current) => ({ ...current, selectedIndex: index }))
  const addPoint = (point: LngLat) => { const now = Date.now(); if (now - lastDrawTime.current < 90) return; lastDrawTime.current = now; commit({ ...draft, importedWaypoints: undefined, input: [...draft.input, point], selectedIndex: draft.input.length }) }
  const setInput = (points: LngLat[]) => commit({ ...draft, importedWaypoints: undefined, input: points })
  const removeInput = (index: number) => commit({ ...draft, importedWaypoints: undefined, input: draft.input.filter((_, itemIndex) => itemIndex !== index), selectedIndex: null })
  const undoDrawing = () => { if (historyIndex > 0) undo(); else postToast('没有可撤销的绘制操作', 'info') }
  const finishPolygon = () => { setDrawing(false); postToast(draft.input.length >= 3 ? '区域绘制完成，航线已生成' : '至少需要 3 个控制点才能生成面状航线', draft.input.length >= 3 ? 'success' : 'info') }
  const setSettings = (patch: Partial<PlannerSettings>) => setDraft((current) => ({ ...current, settings: sanitizeSettings({ ...current.settings, ...patch }) }))
  const onName = (name: string) => setDraft((current) => applyMissionName(current, name))
  const selectPlanner = (_kind: PlannerKind) => { setDraft((current) => ({ ...current, kind: 'grid', input: [], selectedIndex: null, importedWaypoints: undefined })); setDrawing(true); setWorkspaceMode('planner'); setDrawerOpen(false); setMobilePanel(null) }
  const loadDemo = () => { commit(createDemoDraft('grid')); setDrawing(false); setMobilePanel(null); setDrawerOpen(false); postToast('已载入当前航线类型的示例任务') }
  const saveMission = () => { const mission: SavedMission = { id: savedName || crypto.randomUUID(), name: draft.settings.name || '未命名任务', kind: 'grid', updatedAt: new Date().toISOString(), draft: { ...cloneDraft(draft), datum: DATUM_VERSION } }; const next = missions.filter((item) => item.id !== mission.id).concat(mission); setMissions(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSavedName(mission.name); postToast('任务已保存到本地浏览器') }
  const openMission = (mission: SavedMission) => { const restored = cloneDraft(mission.draft); restored.kind = 'grid'; commit(restored); setWorkspaceMode('planner'); setMobilePanel(null); setSavedName(mission.name); postToast('任务已打开') }
  const deleteMission = (id: string) => { const next = missions.filter((item) => item.id !== id); setMissions(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); postToast('已删除保存的任务', 'info') }
  const importFile = () => fileRef.current?.click()
  const onImport = async (file: File) => { try { const imported = importMissionBuffer(await file.arrayBuffer(), file.name); commit(imported.draft); setSavedName(imported.draft.settings.name); setWorkspaceMode('planner'); setDrawing(false); setMobilePanel(null); postToast(`已导入 ${imported.draft.input.length} 个航点`) } catch (error) { postToast(error instanceof Error ? error.message : '文件导入失败', 'error') } finally { if (fileRef.current) fileRef.current.value = '' } }
  const exportKmz = () => { if (!result.waypoints.length) { postToast('请先绘制航线再导出', 'error'); return } const issues = validateWpmlMission(result, draft.settings); const error = issues.find((issue) => issue.level === 'error'); if (error) { postToast(`${error.field}: ${error.message}`, 'error'); return } downloadBytes(buildKmz(result, draft.settings, draft.settings.name), `${safeFilename(draft.settings.name)}.kmz`, 'application/vnd.google-earth.kmz'); const warning = issues.find((issue) => issue.level === 'warning'); postToast(warning ? `KMZ 已生成；${warning.message}` : 'DJI KMZ 已生成，可导入 DJI Fly') }
  const exportKml = () => { if (!result.waypoints.length) { postToast('请先绘制航线再导出', 'error'); return } downloadBytes(new TextEncoder().encode(buildWaylinesXml(result, draft.settings, draft.settings.name)), `${safeFilename(draft.settings.name)}_waylines.wpml`, 'application/xml'); postToast('WPML 文件已下载') }
  const exportJson = () => { downloadBytes(new TextEncoder().encode(JSON.stringify({ version: 1, kind: draft.kind, settings: draft.settings, input: draft.input, result }, null, 2)), `${safeFilename(draft.settings.name)}.route.json`, 'application/json'); postToast('规划数据已下载') }
  const clearAll = () => { commit({ ...draft, input: [], importedWaypoints: undefined, selectedIndex: null }); setDrawing(true); postToast('画布已清空', 'info') }
  useEffect(() => { actionsRef.current = { save: saveMission, exportKmz, waypointCount: result.waypoints.length } })

  const deleteWaypoint = (index: number) => { if (!draft.importedWaypoints) { removeInput(Math.min(index, draft.input.length - 1)); return } const nextPoints = draft.importedWaypoints.filter((_, itemIndex) => itemIndex !== index); commit({ ...draft, importedWaypoints: nextPoints.length ? nextPoints : undefined, input: nextPoints.map((point) => [point.lon, point.lat]) }) }
  const locate = (point: LngLat) => { setSelected(draft.input.findIndex((item) => item[0] === point[0] && item[1] === point[1])) }
  const viewWaypoint = (point: Waypoint) => locate([point.lon, point.lat])

  return <div className={`app-shell theme-${theme}`}><MainTopbar draft={draft} onName={onName} activeMissionName={savedName} saveMission={saveMission} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} undo={undo} redo={redo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} onImport={importFile} theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}/><div className="app-body"><div className={`sidebar-layer ${drawerOpen ? 'is-open' : ''}`}><Sidebar draft={draft} onSelect={selectPlanner} onDemo={loadDemo} active={`${result.waypoints.length} 航点 · ${activeDef.shortLabel}`}/><button type="button" className="sidebar-backdrop" aria-label="关闭菜单" onClick={() => setDrawerOpen(false)}/></div><div className={`workspace-grid ${workspaceMode === 'planner' ? '' : 'is-single'}`}>{workspaceMode === 'planner' ? <><MapWorkspace draft={draft} result={result} baseMap={baseMap} setBaseMap={setBaseMap} showNumbers={showNumbers} setShowNumbers={setShowNumbers} showCamera={showCamera} setShowCamera={setShowCamera} drawing={drawing} setDrawing={setDrawing} onAddPoint={addPoint} onSetInput={setInput} onSelectInput={setSelected} onLocate={locate} onClear={clearAll} onUndo={undoDrawing} onFinishPolygon={finishPolygon} previewIndex={previewIndexSafe} setPreviewIndex={setPreviewIndex} onNotice={postToast}/><MissionSettings draft={draft} onName={onName} result={result} setSettings={setSettings} onRedraw={() => { setDraft((current) => ({ ...current, importedWaypoints: undefined })); setDrawing(false); postToast('已按当前参数重新规划') }}/></> : workspaceMode === 'waypoints' ? <WaypointList result={result} onView={viewWaypoint} onDelete={deleteWaypoint}/> : <FilesPanel missions={missions} onOpen={openMission} onDelete={deleteMission} draft={draft} result={result} onExport={exportKmz}/>}</div></div><div className="map-bottom-actions"><button type="button" className="button secondary" onClick={() => setWorkspaceMode('waypoints')}><Waypoints size={16}/>航点列表 <span className="count-badge">{result.waypoints.length}</span></button><button type="button" className="button secondary" onClick={() => setWorkspaceMode('files')}><FolderOpen size={16}/>我的航线</button><button type="button" className="button ghost" onClick={exportKml}><FileDown size={16}/>导出 WPML</button><button type="button" className="button ghost" onClick={exportJson}><FileDown size={16}/>规划 JSON</button><div className="bottom-spacer"/><button type="button" className="button secondary" onClick={clearAll}><Trash2 size={16}/>清空</button><button type="button" className="button primary" onClick={exportKmz}><FileDown size={16}/>导出 DJI KMZ</button></div><MobileLayer result={result} setDrawing={setDrawing} setMobilePanel={setMobilePanel} importFile={importFile} exportKmz={exportKmz}/><div className={`mobile-sheet-backdrop ${mobilePanel ? 'is-visible' : ''}`} onClick={() => setMobilePanel(null)}/><div className={`mobile-sheet ${mobilePanel ? 'is-open' : ''}`}>{mobilePanel === 'planner' && <><div className="sheet-handle"/><div className="sheet-header"><div><span className="eyebrow">{activeDef.shortLabel}</span><h2>{activeDef.label}</h2><p>{activeDef.hint}</p></div><button type="button" className="icon-button" onClick={() => setMobilePanel(null)}><X size={18}/></button></div><div className="sheet-missions single"><button type="button" className="is-active" style={{ '--item-color': activeDef.color } as React.CSSProperties} onClick={() => { selectPlanner('grid'); setMobilePanel(null) }}><span><PlannerGlyph kind="grid"/></span><div><strong>{activeDef.label}</strong><small>{activeDef.desc}</small></div></button></div></>}{mobilePanel === 'settings' && <><div className="sheet-handle"/><div className="mobile-sheet-settings"><MissionSettings draft={draft} onName={onName} result={result} setSettings={setSettings} onRedraw={() => setMobilePanel(null)}/></div></>}{mobilePanel === 'waypoints' && <><div className="sheet-handle"/><WaypointList result={result} onView={viewWaypoint} onDelete={deleteWaypoint}/></>}</div><input ref={fileRef} className="visually-hidden" type="file" accept=".kmz,.kml,.wpml,application/vnd.google-earth.kmz,application/xml" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onImport(file) }}/>{toast && <div className={`toast ${toast.tone}`}><span className="toast-icon">{toast.tone === 'error' ? '!' : toast.tone === 'info' ? 'i' : '✓'}</span>{toast.message}<button type="button" onClick={() => setToast(null)}><X size={14}/></button></div>}</div>
}
export default App

import './theme.css'
import './winui.css'
