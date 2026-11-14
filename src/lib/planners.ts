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
    kind: 'points',
    label: '自定义航点',
    shortLabel: '航点',
    desc: '逐点布置并单独设置高度与相机动作',
    hint: '在地图上连续点击，添加需要定点拍摄的位置',
    color: '#577f2d',
    tint: '#eff5e9',
    icon: '/assets/hangdian.png',
  },
  {
    kind: 'line',
    label: '单条航线',
    shortLabel: '等距航点',
    desc: '沿一条路径按间距生成连续航点',
    hint: '依次点击起点、路径节点和终点，双击完成',
    color: '#3845df',
    tint: '#eef0ff',
    icon: '/assets/hangdian.png',
  },
  {
    kind: 'corridor',
    label: '航带航线',
    shortLabel: '多条航线',
    desc: '沿中心线生成左右多条采集平行航线',
    hint: '沿道路、河道或带状区域点击中心线',
    color: '#315994',
    tint: '#edf3fa',
    icon: '/assets/hangdai.png',
  },
  {
    kind: 'grid',
    label: '面状航线',
    shortLabel: '正射大图',
    desc: '框选区域生成正射摄影纵横扫掠航线',
    hint: '点击边界节点，至少三个点；双击完成区域',
    color: '#369ad9',
    tint: '#eaf7fd',
    icon: '/assets/zhengshe.png',
  },
  {
    kind: 'oblique',
    label: '倾斜航线',
    shortLabel: '三维建模',
    desc: '多方向倾斜拍摄，服务建筑与三维重建',
    hint: '先绘制区域，系统将自动生成多方向航线',
    color: '#7165e8',
    tint: '#f0edff',
    icon: '/assets/qingxie.png',
  },
  {
    kind: 'orbit',
    label: '环绕航线',
    shortLabel: '独栋建模',
    desc: '围绕目标生成圆形或螺旋环绕航点',
    hint: '点击目标中心，再调整半径、圈数与拍摄方向',
    color: '#118c85',
    tint: '#e7f7f5',
    icon: '/assets/huanrao.png',
  },
]

export const CAMERAS: CameraProfile[] = [
  // focalLength is kept as an equivalent focal length for labels; activeFocalLength is
  // the physical lens value used in footprint calculations when known.

  {
    id: 'mavic4pro', name: 'DJI Mavic 4 Pro', subtitle: '三摄旗舰 · 1 亿像素主摄',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 10000, imageHeight: 7500,
    maxFlightHeight: 500, droneEnumValue: 100, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'mavic3pro', name: 'DJI Mavic 3 Pro', subtitle: '三摄航拍 · 4/3 CMOS',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 77, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'mavic3classic', name: 'DJI Mavic 3 Classic', subtitle: '经典航拍 · 4/3 CMOS',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 77, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'mini5pro', name: 'DJI Mini 5 Pro', subtitle: '轻量航拍 · 1 英寸传感器',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, activeFocalLength: 8.8, imageWidth: 8192, imageHeight: 6144,
    maxFlightHeight: 500, droneEnumValue: 100, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'mini4pro', name: 'DJI Mini 4 Pro', subtitle: '轻量航拍 · 1/1.3 英寸传感器',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'mini4k', name: 'DJI Mini 4K', subtitle: '入门航拍 · 1/2.3 英寸传感器',
    sensorWidth: 6.17, sensorHeight: 4.55, focalLength: 24, activeFocalLength: 4.5, imageWidth: 3840, imageHeight: 2160,
    maxFlightHeight: 500, droneEnumValue: 68, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'air3s', name: 'DJI Air 3S', subtitle: '双摄航测 · 1 英寸主摄',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, activeFocalLength: 8.8, imageWidth: 8192, imageHeight: 6144,
    maxFlightHeight: 500, droneEnumValue: 77, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'air3', name: 'DJI Air 3', subtitle: '双摄航拍 · 1/1.3 英寸主摄',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 77, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'phantom4pro', name: 'DJI Phantom 4 Pro', subtitle: '经典航点平台 · 1 英寸传感器',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, imageWidth: 5472, imageHeight: 3648,
    maxFlightHeight: 500, droneEnumValue: 60, family: 'consumer', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'phantom4rtk', name: 'DJI Phantom 4 RTK', subtitle: '经典测绘平台 · RTK',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, imageWidth: 5472, imageHeight: 3648,
    maxFlightHeight: 500, droneEnumValue: 60, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'zeppelin', name: 'DJI Zeppelin', subtitle: '系留航拍平台 · 广角主摄',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, activeFocalLength: 8.8, imageWidth: 8192, imageHeight: 6144,
    maxFlightHeight: 500, droneEnumValue: 100, family: 'consumer', waypoint: 'limited', exportMode: 'generic',
  },
  {
    id: 'inspire3', name: 'DJI Inspire 3', subtitle: '专业影视 · 全画幅 8K',
    sensorWidth: 36, sensorHeight: 24, focalLength: 35, imageWidth: 8192, imageHeight: 5460,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'consumer', waypoint: 'limited', exportMode: 'generic',
  },
  {
    id: 'mavic3e', name: 'DJI Mavic 3E', subtitle: '行业测绘 · 机械快门',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 66, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'mavic3t', name: 'DJI Mavic 3T', subtitle: '行业巡检 · 热成像',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 67, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'mavic3m', name: 'DJI Mavic 3M', subtitle: '行业多光谱 · 农业巡检',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 67, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice4e', name: 'DJI Matrice 4E', subtitle: '行业测绘 · 三摄广角测绘',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice4t', name: 'DJI Matrice 4T', subtitle: '行业巡检 · 热成像与夜视',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice4d', name: 'DJI Matrice 4D', subtitle: '高性能行业平台 · 测绘',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, activeFocalLength: 12.29, imageWidth: 5280, imageHeight: 3956,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice4td', name: 'DJI Matrice 4TD', subtitle: '高性能行业平台 · 热成像',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice5t', name: 'DJI Matrice 5T', subtitle: '轻型行业旗舰 · 激光与毫米波雷达',
    sensorWidth: 9.6, sensorHeight: 7.2, focalLength: 24, activeFocalLength: 6.72, imageWidth: 8064, imageHeight: 6048,
    maxFlightHeight: 500, droneEnumValue: 100, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice30t', name: 'DJI Matrice 30T', subtitle: '行业旗舰 · 热成像',
    sensorWidth: 6.17, sensorHeight: 4.55, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 63, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice300rtk', name: 'DJI Matrice 300 RTK', subtitle: '行业平台 · RTK',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 60, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice350rtk', name: 'DJI Matrice 350 RTK', subtitle: '行业平台 · RTK',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 89, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'matrice400', name: 'DJI Matrice 400', subtitle: '高性能行业平台 · 多载荷',
    sensorWidth: 17.3, sensorHeight: 13, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 100, family: 'enterprise', waypoint: 'native', exportMode: 'generic',
  },
  {
    id: 'custom', name: '通用 DJI 航点', subtitle: '通用 WPML 飞机标识',
    sensorWidth: 13.2, sensorHeight: 8.8, focalLength: 24, imageWidth: 4000, imageHeight: 3000,
    maxFlightHeight: 500, droneEnumValue: 68, family: 'enterprise', waypoint: 'limited', exportMode: 'generic',
  },
]

CAMERAS.forEach((camera) => {
  // The supplied WPML sample establishes the Mavic 3E mapping. Other aircraft use a
  // generic WPML marker until their internal enum is verified against a real export.
  if (camera.id === 'mavic3e') camera.exportMode = 'exact'
})

export const CAMERA_MAP = Object.fromEntries(
  CAMERAS.map((camera) => [camera.id, camera]),
) as Record<DroneId, CameraProfile>

export const DEFAULT_SETTINGS: PlannerSettings = {
  name: '妙应寺航测任务',
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

export const SAMPLE_LINE: LngLat[] = [
  [113.66474, 34.83059],
  [113.66474, 34.8289],
]

export const SAMPLE_POLYGON: LngLat[] = [
  [113.66379, 34.82892],
  [113.66533, 34.82892],
  [113.66552, 34.83032],
  [113.66448, 34.83095],
  [113.66394, 34.8306],
  [113.66379, 34.82892],
]

export const DEFAULT_DRAFT: PlannerDraft = {
  kind: 'points',
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
      [113.66485, 34.83038],
      [113.66445, 34.82977],
      [113.66386, 34.82977],
      [113.66384, 34.83034],
    ]
  } else if (kind === 'line') {
    common.input = [
      [113.66474, 34.83059],
      [113.66474, 34.8289],
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
    common.input = [[113.66425, 34.8298]]
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
    const count = Math.max(1, Math.ceil(segmentLength / spacing))
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

function lineIntersections(
  a: LngLat,
  b: LngLat,
  polygon: LngLat[],
) {
  const intersections: { point: LngLat; t: number }[] = []
  const pa = projectToLocal(a, polygon[0])
  const pb = projectToLocal(b, polygon[0])
  const pPoly = polygon.map((point) => projectToLocal(point, polygon[0]))
  const dx = pb.lon - pa.lon
  const dy = pb.lat - pa.lat
  for (let i = 0; i < pPoly.length; i += 1) {
    const j = (i + 1) % pPoly.length
    const c = pPoly[i]
    const d = pPoly[j]
    const cx = d.lon - c.lon
    const cy = d.lat - c.lat
    const denom = dx * cy - dy * cx
    if (Math.abs(denom) < 1e-9) continue
    const t = ((c.lon - pa.lon) * cy - (c.lat - pa.lat) * cx) / denom
    const u = ((c.lon - pa.lon) * dy - (c.lat - pa.lat) * dx) / denom
    if (t >= -1e-7 && t <= 1 + 1e-7 && u >= -1e-7 && u <= 1 + 1e-7) {
      intersections.push({ point: unprojectFromLocal({ lon: pa.lon + dx * t, lat: pa.lat + dy * t }, polygon[0]), t })
    }
  }
  if (!intersections.length) {
    const midpoint = pointAlong(a, b, 0.5)
    if (pointInPolygon(midpoint, polygon)) return [{ point: a, t: 0 }, { point: b, t: 1 }]
  }
  return intersections
}

export function polygonsToRings(points: LngLat[]) {
  return closeRing(points).slice(0, -1)
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
      { lon: -100000 * c + axis * -s, lat: -100000 * s + axis * c },
      origin,
    )
    const b = unprojectFromLocal(
      { lon: 100000 * c + axis * -s, lat: 100000 * s + axis * c },
      origin,
    )
    const hits = lineIntersections(a, b, polygon)
      .sort((h1, h2) => h1.t - h2.t)
      .map((hit) => hit.point)
    if (hits.length < 2) continue
    const start = hits[0]
    const end = hits[hits.length - 1]
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
    : Math.max(2, footprint.height * (1 - settings.sideOverlap / 100))
  const photoInterval = Math.max(1, footprint.width * (1 - settings.forwardOverlap / 100))
  const pathLength = combined.reduce((total, leg) => total + polylineLength(leg.points), 0)
  const captureCount = waypoints.filter((waypoint) => waypoint.takePhoto).length
  const captureMeters = combined.filter((leg) => leg.kind === 'capture').reduce((total, leg) => total + polylineLength(leg.points), 0)
  const photoCount = Math.max(1, Math.ceil(captureMeters / Math.max(1, photoInterval)))
  const estimatedBattery = Math.max(1, Math.ceil((pathLength + waypoints.length * 2) / Math.max(5, settings.speed) / 60))
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
    captureCount,
    mainLineCount: combined.filter((leg) => leg.kind === 'capture').length,
    photoCount,
    completed: false,
    warnings: [],
  }
}


export function calculatePlan(draft: PlannerDraft): PlannerResult {
  const input = draft.input
  let settings = sanitizeSettings(draft.settings)
  const camera = CAMERA_MAP[settings.drone] ?? CAMERA_MAP.air3s
  const footprint = cameraFootprint(camera, settings.altitude)
  const lineSpacing = settings.customLineSpacing
    ? Math.max(2, settings.lineSpacing)
    : Math.max(2, footprint.height * (1 - settings.sideOverlap / 100))
  const photoInterval = Math.max(1, footprint.width * (1 - settings.forwardOverlap / 100))
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
      area: draft.kind === 'grid' || draft.kind === 'oblique' ? polygonArea(source) : 0,
      pathLength,
      captureLength: pathLength,
      gsd: gsdFor(camera, settings.altitude),
      footprint,
      lineSpacing: footprint.height * (1 - settings.sideOverlap / 100),
      photoInterval: footprint.width * (1 - settings.forwardOverlap / 100),
      recommendedLineSpacing: footprint.height * (1 - settings.sideOverlap / 100),
      captureLineSpacing: footprint.height * (1 - settings.sideOverlap / 100),
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

  if (draft.kind === 'points') {
    legs = buildPoints(input, settings)
    completed = input.length > 0
  } else if (draft.kind === 'line') {
    legs = [{ id: 'line-0', points: samplePath(input, waypointInterval), kind: 'capture' }]
    completed = input.length >= 2
  } else if (draft.kind === 'corridor') {
    legs = buildOffsetLegs(input, settings.corridorCount, settings.corridorOffset, settings.rotation).map((leg) => ({
      ...leg,
      points: samplePath(leg.points, waypointInterval),
    }))
    completed = input.length >= 2
  } else if (draft.kind === 'grid' || draft.kind === 'oblique') {
    const baseLegs = buildLawnmowerRings(input, lineSpacing, settings.rotation)
    legs = baseLegs.map((leg) => ({ ...leg, points: samplePath(leg.points, waypointInterval) }))
    if (draft.kind === 'oblique') {
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
  }
}

export function sanitizeSettings(settings: PlannerSettings): PlannerSettings {
  return {
    ...settings,
    altitude: clamp(Number(settings.altitude) || 100, 2, 500),
    speed: clamp(Number(settings.speed) || 8, 1, 25),
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
  }
}

export function altitudeForOrbit(settings: PlannerSettings) {
  return settings.orbitHeight
}

export function planSummary(result: PlannerResult) {
  return `${result.waypoints.length} 航点 · ${(result.pathLength / 1000).toFixed(2)} km`
}
