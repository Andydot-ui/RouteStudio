import type {
  CameraProfile,
  DroneId,
  FlightLeg,
  LngLat,
  PlannerDefinition,
  PlannerDraft,
  PlannerKind,
  PlannerResult,
  PlannerSettings,
  Point2D,
  Waypoint,
} from './types'

export const PLANNER_DEFS: PlannerDefinition[] = [
  {
    kind: 'grid',
    label: '面状航线',
    shortLabel: '正射大图',
    desc: '绘制区域并自动生成正射摄影航线',
    hint: '单击连续绘制区域边界，至少三个点；双击完成',
    color: '#369ad9',
    tint: '#eaf7fd',
    icon: '/assets/zhengshe.png',
  },
]

export const CAMERAS: CameraProfile[] = [
  // focalLength is kept as an equivalent focal length for labels; activeFocalLength is
  // the physical lens value used in footprint calculations when known.

  {
    id: 'mavic4pro', name: 'DJI Mavic 4 Pro', subtitle: '三摄旗舰 · 1 亿像素主摄',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 10000, imageHeight: 7500,
    maxFlightHeight: 500, droneEnumValue: 100, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'mavic3pro', name: 'DJI Mavic 3 Pro', subtitle: '三摄航拍 · 4/3 CMOS',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 77, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'mavic3classic', name: 'DJI Mavic 3 Classic', subtitle: '经典航拍 · 4/3 CMOS',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 77, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'mini5pro', name: 'DJI Mini 5 Pro', subtitle: '轻量航拍 · 1 英寸传感器',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, activeFocalLength: 8.8, imageWidth: 8192, imageHeight: 6144,
    maxFlightHeight: 500, droneEnumValue: 100, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'mini4pro', name: 'DJI Mini 4 Pro', subtitle: '轻量航拍 · 1/1.3 英寸传感器',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 68, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'mini4k', name: 'DJI Mini 4K', subtitle: '入门航拍 · 1/2.3 英寸传感器',
    sensorWidth: 6.17, sensorHeight: 4.55, focalLength: 24, activeFocalLength: 4.5, imageWidth: 3840, imageHeight: 2160,
    maxFlightHeight: 500, droneEnumValue: 68, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'air3s', name: 'DJI Air 3S', subtitle: '双摄航测 · 1 英寸主摄',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, activeFocalLength: 8.8, imageWidth: 8192, imageHeight: 6144,
    maxFlightHeight: 500, droneEnumValue: 77, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'air3', name: 'DJI Air 3', subtitle: '双摄航拍 · 1/1.3 英寸主摄',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 77, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'phantom4pro', name: 'DJI Phantom 4 Pro', subtitle: '经典航点平台 · 1 英寸传感器',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, imageWidth: 5472, imageHeight: 3648,
    maxFlightHeight: 500, droneEnumValue: 60, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'phantom4rtk', name: 'DJI Phantom 4 RTK', subtitle: '经典测绘平台 · RTK',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, imageWidth: 5472, imageHeight: 3648,
    maxFlightHeight: 500, droneEnumValue: 60, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'zeppelin', name: 'DJI Zeppelin', subtitle: '系留航拍平台 · 广角主摄',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, activeFocalLength: 8.8, imageWidth: 8192, imageHeight: 6144,
    maxFlightHeight: 500, droneEnumValue: 100, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'limited', exportMode: 'exact',
  },
  {
    id: 'inspire3', name: 'DJI Inspire 3', subtitle: '专业影视 · 全画幅 8K',
    sensorWidth: 36, sensorHeight: 24, focalLength: 35, imageWidth: 8192, imageHeight: 5460,
    maxFlightHeight: 500, droneEnumValue: 89, wpmlDroneEnumValue: 68, wpmlPayloadEnumValue: 68, family: 'consumer', waypoint: 'limited', exportMode: 'exact',
  },
  {
    id: 'mavic3e', name: 'DJI Mavic 3E', subtitle: '行业测绘 · 机械快门',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 66, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'mavic3t', name: 'DJI Mavic 3T', subtitle: '行业巡检 · 热成像',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 67, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'mavic3m', name: 'DJI Mavic 3M', subtitle: '行业多光谱 · 农业巡检',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 67, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice4e', name: 'DJI Matrice 4E', subtitle: '行业测绘 · 三摄广角测绘',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice4t', name: 'DJI Matrice 4T', subtitle: '行业巡检 · 热成像与夜视',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice4d', name: 'DJI Matrice 4D', subtitle: '高性能行业平台 · 测绘',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice4td', name: 'DJI Matrice 4TD', subtitle: '高性能行业平台 · 热成像',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice5t', name: 'DJI Matrice 5T', subtitle: '轻型行业旗舰 · 激光与毫米波雷达',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 100, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice30t', name: 'DJI Matrice 30T', subtitle: '行业旗舰 · 热成像',
    sensorWidth: 6.17, sensorHeight: 4.55, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 63, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice300rtk', name: 'DJI Matrice 300 RTK', subtitle: '行业平台 · RTK',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 60, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice350rtk', name: 'DJI Matrice 350 RTK', subtitle: '行业平台 · RTK',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'matrice400', name: 'DJI Matrice 400', subtitle: '高性能行业平台 · 多载荷',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 100, family: 'enterprise', waypoint: 'native', exportMode: 'exact',
  },
  {
    id: 'custom', name: '通用 DJI 航点', subtitle: '通用 WPML 飞机标识',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 68, family: 'enterprise', waypoint: 'limited', exportMode: 'exact',
  },
]

export const CAMERA_MAP = Object.fromEntries(
  CAMERAS.map((camera) => [camera.id, camera]),
) as Record<DroneId, CameraProfile>

export const DEFAULT_SETTINGS: PlannerSettings = {
  name: '正射大图任务',
  drone: 'air3s',
  cameraDirection: 'nadir',
  altitude: 100,
  speed: 8,
  takeoffSecurityHeight: 30,
  finishAction: 'goHome',
  gimbalPitch: -90,
  headingMode: 'followWayline',
  headingAngle: 0,
  forwardOverlap: 80,
  sideOverlap: 70,
  rotation: 0,
  autoDirection: true,
  turnMode: 'pass',
  obliqueDirections: 3,
  corridorOffset: 35,
  corridorCount: 5,
  spacing: 40,
  pointCount: 7,
  obstacleDistance: 50,
  orbitMode: 'cylinder',
  orbitRadius: 55,
  orbitHeight: 60,
  orbitLaps: 1,
  photosPerPoint: true,
  splitDistance: 600,
  sampleInterval: 20,
  customLineSpacing: false,
  lineSpacing: 30,
}

const EARTH_RADIUS = 6_378_137
const rad = (degrees: number) => (degrees * Math.PI) / 180
const deg = (radians: number) => (radians * 180) / Math.PI
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))
const round = (n: number, digits = 7) => Number(n.toFixed(digits))

// These sample coordinates sit on the Zhengzhou school block in the WGS 84 imagery the map
// now shows. They were re-derived from the original values, which had been placed against
// GCJ-02 tiles; see src/lib/datum.ts.
export const SAMPLE_LINE: LngLat[] = [
  [113.663413, 34.830861],
  [113.663413, 34.829172],
]

export const SAMPLE_POLYGON: LngLat[] = [
  [113.662464, 34.829192],
  [113.664002, 34.829191],
  [113.664192, 34.830591],
  [113.663153, 34.831221],
  [113.662613, 34.830872],
  [113.662464, 34.829192],
]

export const DEFAULT_DRAFT: PlannerDraft = {
  kind: 'grid',
  input: [],
  settings: { ...DEFAULT_SETTINGS },
  selectedIndex: null,
}

export function createDemoDraft(kind: PlannerKind): PlannerDraft {
  const def = PLANNER_DEFS.find((item) => item.kind === kind)
  const common: PlannerDraft = {
    kind,
    input: [],
    settings: { ...DEFAULT_SETTINGS, name: `${def?.shortLabel ?? 'DJI'}规划任务` },
    selectedIndex: null,
  }

  if (kind === 'points') {
    common.input = [
      [113.663523, 34.830651],
      [113.663123, 34.830042],
      [113.662534, 34.830042],
      [113.662514, 34.830612],
    ]
  } else if (kind === 'line') {
    common.input = [
      [113.663413, 34.830861],
      [113.663413, 34.829172],
    ]
  } else if (kind === 'corridor') {
    common.input = SAMPLE_LINE
    common.settings.corridorOffset = 35
    common.settings.corridorCount = 6
  } else if (kind === 'grid' || kind === 'oblique') {
    common.input = SAMPLE_POLYGON
    if (kind === 'oblique') {
      common.settings.gimbalPitch = -45
      common.settings.forwardOverlap = 70
      common.settings.sideOverlap = 70
    }
  } else {
    common.input = [[113.662923, 34.830072]]
    common.settings.orbitRadius = 55
    common.settings.orbitHeight = 60
    common.settings.gimbalPitch = -35
  }

  return common
}
export function isClosed(points: LngLat[]) {
  if (points.length < 4) return false
  const first = points[0]
  const last = points[points.length - 1]
  return distance(first, last) < 0.5
}

export function closeRing(points: LngLat[]): LngLat[] {
  if (points.length < 3 || isClosed(points)) return points
  return [...points, points[0]]
}

export function distance(a: LngLat, b: LngLat) {
  const lat1 = rad(a[1])
  const lat2 = rad(b[1])
  const dLat = lat2 - lat1
  const dLon = rad(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function polylineLength(points: LngLat[]) {
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += distance(points[i - 1], points[i])
  return total
}

export function polygonArea(points: LngLat[]) {
  const ring = closeRing(points)
  if (ring.length < 4) return 0
  const origin = ring[0]
  let sum = 0
  const scaleX = Math.cos(rad(origin[1])) * EARTH_RADIUS
  const scaleY = EARTH_RADIUS
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i]
    const b = ring[i + 1]
    const ax = (a[0] - origin[0]) * rad(1) * scaleX
    const ay = (a[1] - origin[1]) * rad(1) * scaleY
    const bx = (b[0] - origin[0]) * rad(1) * scaleX
    const by = (b[1] - origin[1]) * rad(1) * scaleY
    sum += ax * by - bx * ay
  }
  return Math.abs(sum) / 2
}

export function destination(point: LngLat, bearing: number, meters: number): LngLat {
  const d = meters / EARTH_RADIUS
  const bearingRad = rad(bearing)
  const lat1 = rad(point[1])
  const lon1 = rad(point[0])
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad),
  )
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    )
  return [round(deg(lon2)), round(deg(lat2))]
}

export function bearing(a: LngLat, b: LngLat) {
  const lat1 = rad(a[1])
  const lat2 = rad(b[1])
  const dLon = rad(b[0] - a[0])
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return (deg(Math.atan2(y, x)) + 360) % 360
}

export function projectToLocal(point: LngLat, origin: LngLat): Point2D {
  const scaleX = Math.cos(rad(origin[1])) * rad(1) * EARTH_RADIUS
  const scaleY = rad(1) * EARTH_RADIUS
  return {
    lon: (point[0] - origin[0]) * scaleX,
    lat: (point[1] - origin[1]) * scaleY,
  }
}

export function unprojectFromLocal(point: Point2D, origin: LngLat): LngLat {
  const scaleX = Math.cos(rad(origin[1])) * rad(1) * EARTH_RADIUS
  const scaleY = rad(1) * EARTH_RADIUS
  return [
    round(origin[0] + point.lon / scaleX),
    round(origin[1] + point.lat / scaleY),
  ]
}

export function pointAlong(a: LngLat, b: LngLat, fraction: number) {
  return unprojectFromLocal(
    {
      lon: projectToLocal(a, a).lon +
        (projectToLocal(b, a).lon - projectToLocal(a, a).lon) * fraction,
      lat: projectToLocal(a, a).lat +
        (projectToLocal(b, a).lat - projectToLocal(a, a).lat) * fraction,
    },
    a,
  )
}

export function samplePath(
  points: LngLat[],
  interval: number,
  includeStart = true,
  includeEnd = true,
) {
  if (points.length < 2) return points.slice(0, 1)
  const spacing = Math.max(1, interval)
  const result: LngLat[] = []
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const a = points[segment]
    const b = points[segment + 1]
    const segmentLength = distance(a, b)
    if (segmentLength < 0.01) continue
    // Round rather than ceil: a 383 m lane with a 33.9 m nominal interval divides into
    // 11.3 steps, and rounding to 11 spreads them at 34.8 m instead of forcing a 12th
    // step at 31.9 m. Ceiling always over-samples overlapping coverage the camera already
    // covers, which is what pushed every lane to 13 points instead of 12.
    const count = Math.max(1, Math.round(segmentLength / spacing))
    const start = segment === 0 && includeStart ? 0 : 1
    const end = count
    for (let i = start; i <= end; i += 1) result.push(pointAlong(a, b, i / count))
  }
  if (!includeEnd && result.length > 1) result.pop()
  return dedupePoints(result)
}

export function dedupePoints(points: LngLat[], tolerance = 0.02) {
  const result: LngLat[] = []
  for (const pt of points) {
    if (!result.length || distance(result[result.length - 1], pt) > tolerance) result.push(pt)
  }
  return result
}

function pointInPolygon(point: LngLat, polygon: LngLat[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]
    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

// Intersections of the (unbounded) scan line a-b with the polygon boundary, plus a bounded
// fallback for the numerically awkward rows. The caller passes a line that is deliberately
// 200 km long so it always spans the polygon, so every result MUST be clamped: a missed
// intersection used to fall through to "return both endpoints", which produced a 200 km
// cruise lane straight across the map. That happened whenever the row was exactly tangent to
// a vertex or nearly parallel to an edge, and it is not rare - a fuzz run over 16 000
// polygon/spacing/angle combinations hit it 276 times.
function lineIntersections(
  a: LngLat,
  b: LngLat,
  polygon: LngLat[],
) {
  const origin = polygon[0]
  const pa = projectToLocal(a, origin)
  const pb = projectToLocal(b, origin)
  const pPoly = polygon.map((point) => projectToLocal(point, origin))
  const dx = pb.lon - pa.lon
  const dy = pb.lat - pa.lat
  if (dx * dx + dy * dy < 1e-12) return []
  const intersections: { point: LngLat; t: number }[] = []
  for (let i = 0; i < pPoly.length; i += 1) {
    const j = (i + 1) % pPoly.length
    const c = pPoly[i]
    const d = pPoly[j]
    const cx = d.lon - c.lon
    const cy = d.lat - c.lat
    const denom = dx * cy - dy * cx
    // Parallel (including collinear) edges carry no crossing information; a row that runs
    // along an edge is handled by the bbox clamp below.
    if (Math.abs(denom) < 1e-12) continue
    const t = ((c.lon - pa.lon) * cy - (c.lat - pa.lat) * cx) / denom
    const u = ((c.lon - pa.lon) * dy - (c.lat - pa.lat) * dx) / denom
    if (t >= -1e-9 && t <= 1 + 1e-9 && u >= -1e-9 && u <= 1 + 1e-9) {
      const tc = Math.min(1, Math.max(0, t))
      intersections.push({
        point: unprojectFromLocal({ lon: pa.lon + dx * tc, lat: pa.lat + dy * tc }, origin),
        t: tc,
      })
    }
  }
  if (intersections.length >= 2) return intersections

  // Fallback: clip the line to the polygon's bounding box. The result can never be longer
  // than the polygon diagonal, so a numerical miss degrades to a slightly wrong short lane
  // instead of a 200 km one.
  const minX = Math.min(...pPoly.map((p) => p.lon))
  const maxX = Math.max(...pPoly.map((p) => p.lon))
  const minY = Math.min(...pPoly.map((p) => p.lat))
  const maxY = Math.max(...pPoly.map((p) => p.lat))
  let t0 = 0
  let t1 = 1
  const clip = (p: number, q: number) => {
    if (Math.abs(q) < 1e-12) return p >= 0
    const r = p / q
    if (q > 0) {
      if (r < t1) t1 = r
      return true
    }
    if (r > t0) t0 = r
    return true
  }
  const inside = clip(-(pa.lon - minX), dx) && clip(pa.lon - maxX, -dx)
    && clip(-(pa.lat - minY), dy) && clip(pa.lat - maxY, -dy)
  if (!inside || t1 - t0 < 1e-9) return intersections
  const start = { point: unprojectFromLocal({ lon: pa.lon + dx * t0, lat: pa.lat + dy * t0 }, origin), t: t0 }
  const end = { point: unprojectFromLocal({ lon: pa.lon + dx * t1, lat: pa.lat + dy * t1 }, origin), t: t1 }
  if (intersections.length === 1) {
    // One crossing means the row only grazes the outline; keep just that point unless the
    // midpoint really is inside the polygon, in which case the clipped span is the lane.
    const midpoint = pointAlong(a, b, 0.5)
    if (!pointInPolygon(midpoint, polygon)) return intersections
  }
  return [start, end]
}

export function polygonsToRings(points: LngLat[]) {
  return closeRing(points).slice(0, -1)
}

// Scan direction for the drawn area.
//
// The rule is shortest flight, which is what DJI Terra and XiaoQu Route Planner do: for each
// edge direction we cost the lawnmower that would actually fly (lanes x laneLength + turns,
// with lane count from ceil(span / spacing)) and keep the cheapest. On the field-verified
// reference block that reproduces XiaoQu's orientation and its exact waypoint count.
//
// Near-square blocks need a tie-break, because two orientations can differ by under a percent
// and then a one-pixel change of a corner flips the whole mission. Within STABILITY_BAND of
// the best path we prefer the orientation whose lanes run along the longer side of the block,
// which is the more natural-looking mission and no worse to fly.
//
// Returns a rotation in the planner's [0,180) axis convention, 0 meaning lanes run east-west.
const STABILITY_BAND = 0.03
export function autoScanRotation(points: LngLat[], spacing: number): number {
  const polygon = polygonsToRings(points)
  if (polygon.length < 3) return 0
  const origin = polygon[0]
  const local = polygon.map((point) => projectToLocal(point, origin))
  const laneSpacing = Math.max(2, spacing)

  type Candidate = { rotation: number; path: number; alongness: number }
  const candidates: Candidate[] = []
  for (let i = 0; i < local.length; i += 1) {
    const a = local[i]
    const b = local[(i + 1) % local.length]
    const dx = b.lon - a.lon
    const dy = b.lat - a.lat
    const length = Math.hypot(dx, dy)
    if (length < 1) continue
    const ux = dx / length
    const uy = dy / length
    let minAcross = Number.POSITIVE_INFINITY
    let maxAcross = Number.NEGATIVE_INFINITY
    let minAlong = Number.POSITIVE_INFINITY
    let maxAlong = Number.NEGATIVE_INFINITY
    for (const p of local) {
      const across = -(p.lon - a.lon) * uy + (p.lat - a.lat) * ux
      const along = (p.lon - a.lon) * ux + (p.lat - a.lat) * uy
      if (across < minAcross) minAcross = across
      if (across > maxAcross) maxAcross = across
      if (along < minAlong) minAlong = along
      if (along > maxAlong) maxAlong = along
    }
    const spanAcross = maxAcross - minAcross
    const laneLength = maxAlong - minAlong
    if (spanAcross < laneSpacing || laneLength < 1) continue
    const intervals = Math.max(1, Math.ceil(spanAcross / laneSpacing))
    const lanes = intervals + 1
    const path = lanes * laneLength + intervals * (spanAcross / intervals)
    const degrees = (deg(Math.atan2(uy, ux)) % 180 + 180) % 180
    // >1 when this lane direction runs along the longer dimension of the block.
    candidates.push({ rotation: degrees, path, alongness: laneLength / Math.max(1e-6, spanAcross) })
  }
  if (!candidates.length) return 0

  const bestPath = Math.min(...candidates.map((c) => c.path))
  const nearTies = candidates.filter((c) => c.path <= bestPath * (1 + STABILITY_BAND))
  nearTies.sort((p, q) => q.alongness - p.alongness || p.path - q.path)
  return nearTies[0].rotation
}

export function buildLawnmowerRings(
  polygonInput: LngLat[],
  spacing: number,
  rotation: number,
): FlightLeg[] {
  const polygon = polygonsToRings(polygonInput)
  if (polygon.length < 3) return []
  const origin = polygon[0]
  const local = polygon.map((point) => projectToLocal(point, origin))
  // Hard ceiling for any single lane: nothing inside the area can be longer than its
  // diagonal. Clipping mistakes are clamped here rather than flown.
  let diagonal = 0
  for (let i = 0; i < local.length; i += 1) {
    for (let j = i + 1; j < local.length; j += 1) {
      diagonal = Math.max(diagonal, Math.hypot(local[j].lon - local[i].lon, local[j].lat - local[i].lat))
    }
  }
  const maxLane = Math.max(1, diagonal)
  const overshoot = Math.min(100000, maxLane * 2 + 100)
  const theta = rad(rotation)
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const across = local.map((p) => -p.lon * s + p.lat * c)
  const minAcross = Math.min(...across)
  const maxAcross = Math.max(...across)
  const rows = Math.max(1, Math.ceil((maxAcross - minAcross) / Math.max(2, spacing)))
  const legs: FlightLeg[] = []
  for (let row = 0; row <= rows; row += 1) {
    const axis = minAcross + ((maxAcross - minAcross) * row) / rows
    const a = unprojectFromLocal(
      { lon: -overshoot * c + axis * -s, lat: -overshoot * s + axis * c },
      origin,
    )
    const b = unprojectFromLocal(
      { lon: overshoot * c + axis * -s, lat: overshoot * s + axis * c },
      origin,
    )
    const hits = lineIntersections(a, b, polygon)
      .sort((h1, h2) => h1.t - h2.t)
      .map((hit) => hit.point)
    if (hits.length < 2) continue
    const start = hits[0]
    const end = hits[hits.length - 1]
    const laneLength = distance(start, end)
    // Reject clipping artefacts: nothing longer than the diagonal can be inside the area,
    // and a lane shorter than the spacing is a vertex graze, not a line worth flying -
    // keeping those would add a turn and a photo for a few centimetres of coverage.
    if (laneLength > maxLane * 1.01) continue
    if (laneLength < Math.max(2, Math.min(spacing * 0.5, 10))) continue
    const ordered: LngLat[] = row % 2 === 0 ? [start, end] : [end, start]
    legs.push({
      id: `capture-${row}`,
      points: ordered,
      kind: 'capture',
    })
  }
  return legs.map((leg, index) => ({ ...leg, id: `capture-${index}` }))
}

export function buildOffsetLegs(
  centerline: LngLat[],
  count: number,
  spacing: number,
  rotation = 0,
): FlightLeg[] {
  if (centerline.length < 2) return []
  const safeCount = Math.max(1, Math.floor(count))
  const result: FlightLeg[] = []
  const base = rotation
  for (let i = 0; i < safeCount; i += 1) {
    const offset = (i - (safeCount - 1) / 2) * spacing
    const offsetLeg = centerline.map((point) => {
      const sourceBearing = bearing(centerline[0], centerline[centerline.length - 1])
      return destination(point, sourceBearing + 90 + base, offset)
    })
    result.push({
      id: `corridor-${i}`,
      points: i % 2 === 0 ? offsetLeg : [...offsetLeg].reverse(),
      kind: 'capture',
    })
  }
  return result
}

// `width` is the ground coverage along the sensor's long edge and `height` along its short
// edge. DJI airframes mount the camera with the long edge across the flight direction, so
// `width` is the cross-track span that sets the line spacing and `height` is the along-track
// span that sets the photo interval. Swapping them inflates the number of scan lines by the
// sensor aspect ratio (17.3/13 = 33% more lines on a Mavic 3) for the same overlap settings.
export function cameraFootprint(camera: CameraProfile, altitude: number) {
  const actualFocalLength = camera.activeFocalLength ?? camera.focalLength
  const width = (camera.sensorWidth / actualFocalLength) * altitude
  const height = (camera.sensorHeight / actualFocalLength) * altitude
  return { width, height }
}

export function gsdFor(camera: CameraProfile, altitude: number) {
  const actualFocalLength = camera.activeFocalLength ?? camera.focalLength
  return (camera.sensorWidth * altitude * 100) / (actualFocalLength * camera.imageWidth)
}

export function buildPoints(
  points: LngLat[],
  _settings: PlannerSettings,
): FlightLeg[] {
  const legs: FlightLeg[] = []
  points.forEach((point, index) => {
    if (index > 0) {
      legs.push({
        id: `point-transit-${index}`,
        points: [points[index - 1], point],
        kind: 'transit',
      })
    }
    legs.push({
      id: `point-${index}`,
      points: [point],
      kind: 'capture',
    })
  })
  return legs
}

export function mergeLegs(legs: FlightLeg[]): FlightLeg[] {
  const result: FlightLeg[] = []
  for (const leg of legs) {
    if (!leg.points.length) continue
    const previous = result[result.length - 1]
    if (previous && previous.kind === 'capture' && leg.kind === 'capture' && previous.points.length === 2) {
      const prevEnd = previous.points[previous.points.length - 1]
      const nextStart = leg.points[0]
      const sameAltitude = previous.pitch === leg.pitch
      if (sameAltitude && distance(prevEnd, nextStart) > 0.01) {
        result.push({
          id: `transit-${result.length}`,
          points: [prevEnd, nextStart],
          kind: 'transit',
          pitch: leg.pitch,
        })
      }
    }
    result.push(leg)
  }
  return result
}

export function makeWaypoints(legs: FlightLeg[], settings: PlannerSettings, _camera: CameraProfile): Waypoint[] {
  const result: Waypoint[] = []
  for (const leg of legs) {
    if (!leg.points.length) continue
    const samples = leg.kind === 'capture'
      ? leg.points
      : leg.points.length === 2
        ? [leg.points[0], leg.points[1]]
        : leg.points
    for (let index = 0; index < samples.length; index += 1) {
      const point = samples[index]
      const next = samples[index + 1] ?? point
      const yaw = settings.headingMode === 'fixed'
        ? settings.headingAngle
        : settings.headingMode === 'manual'
          ? previousYaw(result, settings.headingAngle)
          : bearing(point, next)
      result.push({
        lon: point[0],
        lat: point[1],
        height: settings.altitude,
        speed: settings.speed,
        pitch: leg.pitch ?? settings.gimbalPitch,
        yaw,
        takePhoto: settings.photosPerPoint && leg.kind === 'capture',
        actions: leg.kind === 'capture' ? (settings.photosPerPoint ? ['takePhoto', 'gimbalRotate'] : ['gimbalRotate']) : ['gimbalRotate']
      })
    }
  }
  return dedupeWaypoints(result)
}


function previousYaw(result: Waypoint[], fallback: number) {
  return result.length ? result[result.length - 1].yaw : fallback
}

function dedupeWaypoints(points: Waypoint[]) {
  const result: Waypoint[] = []
  for (const point of points) {
    const last = result[result.length - 1]
    if (last && distance([last.lon, last.lat], [point.lon, point.lat]) < 0.01 && Math.abs(last.height - point.height) < 0.1) {
      if (point.takePhoto && !last.takePhoto) Object.assign(last, point)
      continue
    }
    result.push(point)
  }
  return result
}

function resultBase(
  legs: FlightLeg[],
  settings: PlannerSettings,
  camera: CameraProfile,
): PlannerResult {
  const combined = mergeLegs(legs)
  const waypoints = makeWaypoints(combined, settings, camera)
  const footprint = cameraFootprint(camera, settings.altitude)
  const gsd = gsdFor(camera, settings.altitude)
  const lineSpacing = settings.customLineSpacing
    ? Math.max(2, settings.lineSpacing)
    : Math.max(2, footprint.width * (1 - settings.sideOverlap / 100))
  const photoInterval = Math.max(1, footprint.height * (1 - settings.forwardOverlap / 100))
  const pathLength = combined.reduce((total, leg) => total + polylineLength(leg.points), 0)
  const captureCount = waypoints.filter((waypoint) => waypoint.takePhoto).length
  const captureMeters = combined.filter((leg) => leg.kind === 'capture').reduce((total, leg) => total + polylineLength(leg.points), 0)
  const photoCount = Math.max(1, Math.ceil(captureMeters / Math.max(1, photoInterval)))
  // Mission time follows the model DJI Terra and XiaoQu use rather than pure distance:
  // cruise time plus a shutter settle per photo plus a turn penalty per waypoint, with
  // stopping turns costing roughly twice as much as flying through.
  const turnPenalty = settings.turnMode === 'stop' ? 1.1 : 0.45
  const estimatedSeconds = pathLength / Math.max(1, settings.speed)
    + captureCount * 0.8
    + waypoints.length * turnPenalty
  const estimatedBattery = Math.max(1, Math.ceil(estimatedSeconds / 60))
  return {
    legs: combined,
    waypoints,
    source: [],
    area: 0,
    pathLength,
    captureLength: combined.filter((leg) => leg.kind === 'capture').reduce((total, leg) => total + polylineLength(leg.points), 0),
    gsd,
    footprint,
    lineSpacing,
    photoInterval,
    recommendedLineSpacing: lineSpacing,
    captureLineSpacing: lineSpacing,
    estimatedBattery,
    estimatedSeconds,
    captureCount,
    mainLineCount: combined.filter((leg) => leg.kind === 'capture').length,
    photoCount,
    completed: false,
    warnings: [],
  }
}


export function calculatePlan(draft: PlannerDraft): PlannerResult {
  const input = draft.input
  const selectedKind = 'grid' as PlannerKind
  let settings = sanitizeSettings(draft.settings)
  const camera = CAMERA_MAP[settings.drone] ?? CAMERA_MAP.custom
  const footprint = cameraFootprint(camera, settings.altitude)
  const lineSpacing = settings.customLineSpacing
    ? Math.max(2, settings.lineSpacing)
    : Math.max(2, footprint.width * (1 - settings.sideOverlap / 100))
  const photoInterval = Math.max(1, footprint.height * (1 - settings.forwardOverlap / 100))
  const waypointInterval = Math.max(1, Math.min(photoInterval, settings.splitDistance))
  if (draft.importedWaypoints?.length) {
    const imported = draft.importedWaypoints
    const source = imported.map((point) => [point.lon, point.lat] as LngLat)
    const legs: FlightLeg[] = [{ id: 'imported', points: source, kind: 'capture', pitch: imported[0]?.pitch }]
    const footprint = cameraFootprint(camera, settings.altitude)
    const pathLength = polylineLength(source)
    const captureCount = imported.filter((point) => point.takePhoto).length
    return {
      legs,
      waypoints: imported,
      source,
      area: polygonArea(source),
      pathLength,
      captureLength: pathLength,
      gsd: gsdFor(camera, settings.altitude),
      footprint,
      lineSpacing: footprint.width * (1 - settings.sideOverlap / 100),
      photoInterval: footprint.height * (1 - settings.forwardOverlap / 100),
      recommendedLineSpacing: footprint.width * (1 - settings.sideOverlap / 100),
      captureLineSpacing: footprint.width * (1 - settings.sideOverlap / 100),
      estimatedBattery: Math.max(1, Math.ceil(pathLength / Math.max(5, settings.speed) / 60)),
      captureCount,
      mainLineCount: 1,
      photoCount: imported.filter((point) => point.takePhoto).length,
      completed: true,
      warnings: ['此任务按导入航点原序保存；修改规划参数会按当前航线类型重新计算。'],
    }
  }
  let legs: FlightLeg[] = []
  let area = 0
  let completed = false
  const warnings: string[] = []
  const source = [...input]

  if (selectedKind === 'points') {
    legs = buildPoints(input, settings)
    completed = input.length > 0
  } else if (selectedKind === 'line') {
    legs = [{ id: 'line-0', points: samplePath(input, waypointInterval), kind: 'capture' }]
    completed = input.length >= 2
  } else if (selectedKind === 'corridor') {
    legs = buildOffsetLegs(input, settings.corridorCount, settings.corridorOffset, settings.rotation).map((leg) => ({
      ...leg,
      points: samplePath(leg.points, waypointInterval),
    }))
    completed = input.length >= 2
  } else if (selectedKind === 'grid' || selectedKind === 'oblique') {
    // With automatic direction the lanes follow the longest edge of the area, which is the
    // fewest-lanes axis; the manual dial then only overrides when the switch is off.
    const rotation = settings.autoDirection && input.length >= 3
      ? autoScanRotation(input, lineSpacing)
      : settings.rotation
    settings = { ...settings, rotation }
    const baseLegs = buildLawnmowerRings(input, lineSpacing, rotation)
    legs = baseLegs.map((leg) => ({ ...leg, points: samplePath(leg.points, waypointInterval) }))
    if (selectedKind === 'oblique') {
      const directions = settings.obliqueDirections
      const horizontalOffset = Math.min(55, settings.altitude * 0.32)
      const obliqueLegs: FlightLeg[] = []
      for (let direction = 0; direction < directions; direction += 1) {
        const offsetBearing = (360 / directions) * direction
        for (const [index, leg] of legs.entries()) {
          const points = leg.points.map((point) =>
            destination(point, offsetBearing, horizontalOffset * 0.08),
          )
          obliqueLegs.push({
            ...leg,
            id: `oblique-${direction}-${index}`,
            points,
            pitch: settings.gimbalPitch,
          })
        }
      }
      legs = obliqueLegs
    }
    area = polygonArea(input)
    completed = input.length >= 3 && legs.length > 0
  } else {
    const center = input[0]
    if (center) {
      settings = sanitizeSettings({ ...settings, altitude: settings.orbitHeight })
      const radius = Math.max(5, settings.orbitRadius)
      const count = Math.max(8, Math.round((Math.PI * 2 * radius) / Math.max(2, settings.spacing)))
      const spiralCount = settings.orbitMode === 'helix' ? Math.max(1, settings.orbitLaps) : 1
      for (let lap = 0; lap < spiralCount; lap += 1) {
        const points: LngLat[] = []
        for (let i = 0; i <= count; i += 1) {
          const angle = (i / count) * 360
          const pt = destination(center, angle, radius)
          points.push(pt)
        }
        if (lap % 2 === 1) points.reverse()
        legs.push({
          id: `orbit-${lap}`,
          points,
          kind: 'capture',
          pitch: settings.gimbalPitch,
        })
        if (settings.orbitMode === 'ring') {
          const innerRadius = radius * 0.72
          const inner: LngLat[] = []
          for (let i = 0; i <= count; i += 1) inner.push(destination(center, (i / count) * 360 + 12, innerRadius))
          legs.push({ id: `orbit-inner-${lap}`, points: inner, kind: 'capture', pitch: settings.gimbalPitch })
        }
      }
      area = Math.PI * radius * radius
      completed = true
    } else {
      completed = false
    }
  }

  if (settings.forwardOverlap < 50) warnings.push('航向重叠率偏低，拼接可能失败')
  if (settings.sideOverlap < 45) warnings.push('旁向重叠率偏低，建议至少 60%')
  if (settings.altitude > camera.maxFlightHeight) warnings.push('飞行高度超过机型建议上限')
  const result = resultBase(legs, settings, camera)
  return {
    ...result,
    source,
    area,
    completed,
    warnings,
    footprint,
    lineSpacing,
    photoInterval,
    recommendedLineSpacing: lineSpacing,
    captureLineSpacing: lineSpacing,
    usedRotation: settings.rotation,
  }
}

// Fold an angle into its legal range. Dials wrap past their maximum, so 190 degrees of
// line rotation is the same axis as 10 degrees rather than an out-of-bounds value.
function normalizeDegrees(value: number, range: number) {
  if (!Number.isFinite(value)) return 0
  return ((Math.round(value) % range) + range) % range
}

export function sanitizeSettings(settings: PlannerSettings): PlannerSettings {
  return {
    ...settings,
    altitude: clamp(Number(settings.altitude) || 100, 2, 500),
    speed: clamp(Number(settings.speed) || 8, 0.1, 15),
    forwardOverlap: clamp(Number(settings.forwardOverlap) || 80, 0, 98),
    sideOverlap: clamp(Number(settings.sideOverlap) || 70, 0, 98),
    corridorCount: clamp(Math.round(Number(settings.corridorCount) || 5), 1, 30),
    corridorOffset: clamp(Number(settings.corridorOffset) || 35, 2, 500),
    orbitRadius: clamp(Number(settings.orbitRadius) || 55, 5, 500),
    orbitHeight: clamp(Number(settings.orbitHeight) || 60, 2, 500),
    orbitLaps: clamp(Math.round(Number(settings.orbitLaps) || 1), 1, 10),
    spacing: clamp(Number(settings.spacing) || 40, 2, 500),
    sampleInterval: clamp(Number(settings.sampleInterval) || 20, 2, 300),
    lineSpacing: clamp(Number(settings.lineSpacing) || 30, 2, 500),
    takeoffSecurityHeight: clamp(Number(settings.takeoffSecurityHeight) || 30, 2, 500),
    autoDirection: settings.autoDirection !== false,
    turnMode: settings.turnMode === 'stop' ? 'stop' : 'pass',
    // 0 is a valid gimbal pitch, so this cannot use the `|| default` shortcut above.
    gimbalPitch: Number.isFinite(Number(settings.gimbalPitch))
      ? clamp(Number(settings.gimbalPitch), -90, 0)
      : -90,
    rotation: normalizeDegrees(Number(settings.rotation), 180),
    headingAngle: normalizeDegrees(Number(settings.headingAngle), 360),
  }
}

export function altitudeForOrbit(settings: PlannerSettings) {
  return settings.orbitHeight
}

export function planSummary(result: PlannerResult) {
  return `${result.waypoints.length} 航点 · ${(result.pathLength / 1000).toFixed(2)} km`
}
