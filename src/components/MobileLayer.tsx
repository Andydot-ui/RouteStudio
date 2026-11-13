import { Download, Pencil, Settings2, UploadCloud, Waypoints } from 'lucide-react'
import { PLANNER_DEFS } from '../lib/planners'
import type { PlannerDraft, PlannerResult } from '../lib/types'

export type MobilePanel = 'planner' | 'settings' | 'mission' | 'waypoints' | null
export function MobileLayer({ draft, result, setDrawing, setMobilePanel, importFile, exportKmz }: {
  draft: PlannerDraft
  result: PlannerResult
  setDrawing: React.Dispatch<React.SetStateAction<boolean>>
  setMobilePanel: React.Dispatch<React.SetStateAction<MobilePanel>>
  importFile: () => void
  exportKmz: () => void
}) {
  const def = PLANNER_DEFS.find((item) => item.kind === draft.kind) ?? PLANNER_DEFS[0]
  return <div className="mobile-quickbar"><button type="button" className="is-active" onClick={() => setDrawing(true)}><Pencil size={18}/><span>绘制</span></button><button type="button" onClick={() => setMobilePanel('settings')}><Settings2 size={18}/><span>参数</span></button><button type="button" onClick={() => setMobilePanel('waypoints')}><Waypoints size={18}/><span>航点 {result.waypoints.length}</span></button><button type="button" onClick={importFile}><UploadCloud size={18}/><span>导入</span></button><button type="button" className="mobile-export" onClick={exportKmz}><Download size={18}/><span>导出</span></button><span className="mobile-def-color" style={{ background: def.color }}/></div>
}
