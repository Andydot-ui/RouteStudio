import type { PlannerKind } from '../lib/types'

export function PlannerGlyph({ kind, size = 22 }: { kind: PlannerKind; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (kind === 'points') return <svg {...shared}><path d="m5 17 4-10 4 7 6-8"/><circle cx="5" cy="17" r="1.8" fill="currentColor"/><circle cx="9" cy="7" r="1.8" fill="currentColor"/><circle cx="13" cy="14" r="1.8" fill="currentColor"/><circle cx="19" cy="6" r="1.8" fill="currentColor"/></svg>
  if (kind === 'line') return <svg {...shared}><path d="M4 18 10 7l4 9 6-11"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/><circle cx="10" cy="7" r="1.5" fill="currentColor"/><circle cx="14" cy="16" r="1.5" fill="currentColor"/><circle cx="20" cy="5" r="1.5" fill="currentColor"/></svg>
  if (kind === 'corridor') return <svg {...shared}><path d="M7 5c4 4-3 6 1 10 2 2 5 2 8 4"/><path d="M12 4c4 4-3 7 1 10 2 2 5 2 7 3"/><path d="M3 7c4 4-2 7 2 10"/></svg>
  if (kind === 'grid') return <svg {...shared}><path d="M5 4v16M10 4v16M15 4v16M20 4v16M3 7h18M3 12h18M3 17h18"/></svg>
  if (kind === 'oblique') return <svg {...shared}><path d="m12 3 9 16H3L12 3Z"/><path d="M12 7v11M8 16l4-3 4 3"/></svg>
  return <svg {...shared}><ellipse cx="12" cy="12" rx="9" ry="4"/><path d="M7 7c3 3-3 7 3 10M13 6c4 3-2 8 4 11M17 9c2 2-1 4 2 6"/></svg>
}
