import type { LngLat, PlannerDraft } from './types'
import { migrateLegacyPoint } from './coords'

// Missions drawn before the base maps moved to native WGS 84 were picked off GCJ-02 tiles.
// The buggy datum formula was replaced at 2026-11-19 05:19:34 UTC (deploy commit 1f6f32d).
// Data saved before that instant sits about 120 m east of the clicked feature and must be
// repaired; data saved after it was already converted correctly and only needs stamping.
const LEGACY_CUTOFF = Date.parse('2026-11-19T05:19:34Z')

export const DATUM_VERSION = 3

const migratePoint = (point: LngLat): LngLat => migrateLegacyPoint(point[0], point[1]) as LngLat

// savedAt is when the draft last hit storage. A missing timestamp means the record predates
// this migration entirely, which can only be pre-fix data, so it gets repaired.
// Drafts that carry importedWaypoints came from a KMZ whose provenance is unknown - it may
// hold true WGS coordinates from a real drone - so they are stamped but never shifted.
export function migrateDraft(draft: PlannerDraft, savedAt: number | null): PlannerDraft {
  if (draft.datum && draft.datum >= DATUM_VERSION) return draft
  if (savedAt !== null && savedAt >= LEGACY_CUTOFF) return { ...draft, datum: DATUM_VERSION }
  if (draft.importedWaypoints) return { ...draft, datum: DATUM_VERSION }
  if (!draft.input.length) return { ...draft, datum: DATUM_VERSION }
  return {
    ...draft,
    input: draft.input.map(migratePoint),
    datum: DATUM_VERSION,
  }
}
