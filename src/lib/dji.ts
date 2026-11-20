import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { bearing } from './planners'
import type {
  LngLat,
  PlannerDraft,
  PlannerResult,
  PlannerSettings,
  Waypoint,
} from './types'

const KML_NS = 'http://www.opengis.net/kml/2.2'
// DJI WPML 1.0.2 namespace. Sample files from DJI Mavic 3 missions and from XiaoQu Route
// Planner both declare http://www.dji.com/wpmz/1.0.2; DJI Fly keys off this URI.
const WPML_NS = 'http://www.dji.com/wpmz/1.0.2'

function parseXml(text: string): XMLDocument {
  const document = new DOMParser().parseFromString(text, 'application/xml')
  if (document.querySelector('parsererror')) throw new Error('文件中的 XML 无法解析')
  return document
}

function allByLocalName(root: ParentNode, name: string): Element[] {
  return Array.from(root.querySelectorAll('*')).filter((node) => node.localName === name)
}

export function readWaypointDirectives(placemark: Element): string[] {
  return allByLocalName(placemark, 'actionActuatorFunc').map((node) => node.textContent?.trim() ?? '')
}

function textByLocalName(root: ParentNode, name: string) {
  return allByLocalName(root, name)[0]?.textContent?.trim() ?? ''
}

// WPML fields can be absent or blank, and 0 is a legal angle, so callers need the first
// value that parses rather than the first truthy one.
function firstNumber(...values: string[]) {
  for (const value of values) {
    const parsed = Number(value)
    if (value.trim() !== '' && Number.isFinite(parsed)) return parsed
  }
  return null
}

function parseCoordinate(text: string): LngLat | null {
  for (const chunk of text.trim().split(/\s+/)) {
    const values = chunk.split(',').map(Number)
    if (values.length >= 2 && Number.isFinite(values[0]) && Number.isFinite(values[1])) {
      return [values[0], values[1]]
    }
  }
  return null
}

export type ImportedMission = {
  draft: PlannerDraft
  warnings: string[]
}

export function importMissionBuffer(buffer: ArrayBuffer, filename: string): ImportedMission {
  const bytes = new Uint8Array(buffer)
  let text = ''
  let templateXml = ''
  const warnings: string[] = []
  try {
    const entries = unzipSync(bytes)
    const waylines = Object.entries(entries).find(([name]) => /waylines?\.wpml$/i.test(name))
    const template = Object.entries(entries).find(([name]) => /template\.kml$/i.test(name))
    if (!waylines) throw new Error('KMZ 中未找到 wpmz/waylines.wpml')
    text = strFromU8(waylines[1])
    if (template) {
      templateXml = strFromU8(template[1])
      if (/wpmz\/1\.0\.\d/i.test(templateXml)) warnings.push('已读取任务模板并保留 WPML 兼容信息')
    }
  } catch (error) {
    if (!filename.toLowerCase().endsWith('.kml')) {
      if (error instanceof Error) throw error
      throw new Error('KMZ 文件读取失败')
    }
    text = new TextDecoder('utf-8').decode(bytes)
  }

  const document = parseXml(text)
  const placemarks = allByLocalName(document, 'Placemark')
  if (!placemarks.length) throw new Error('文件中没有可用的航点')
  const waypoints: Waypoint[] = placemarks.map((placemark, index) => {
    const coordinate = parseCoordinate(textByLocalName(placemark, 'coordinates'))
    if (!coordinate) throw new Error(`第 ${index + 1} 个航点缺少坐标`)
    const directives = readWaypointDirectives(placemark)
    return {
      lon: coordinate[0],
      lat: coordinate[1],
      height: Number(textByLocalName(placemark, 'executeHeight')) || 100,
      speed: Number(textByLocalName(placemark, 'waypointSpeed')) || 2.5,
      pitch: firstNumber(
        textByLocalName(placemark, 'gimbalPitchRotateAngle'),
        textByLocalName(placemark, 'waypointGimbalPitchAngle'),
      ) ?? -90,
      yaw: firstNumber(textByLocalName(placemark, 'waypointHeadingAngle')) ?? 0,
      takePhoto: directives.includes('takePhoto'),
      actions: directives,
    }
  })
  const points = waypoints.map((point) => [point.lon, point.lat] as LngLat)
  const first = waypoints[0]
  const importedMode = textByLocalName(placemarks[0], 'waypointHeadingMode').trim()
  const headingMode = HEADING_MODE_IMPORTS[importedMode] ?? 'followWayline'
  if (importedMode === 'smoothTransition') {
    warnings.push('机头朝向 smoothTransition 已按跟随航线导入')
  } else if (importedMode && headingMode === 'followWayline' && importedMode !== 'followWayline') {
    warnings.push(`暂不支持 ${importedMode} 机头朝向，已按跟随航线导入`)
  }
  // Turn mode and the take-off security height round-trip from the file so a re-export
  // keeps the behaviour of the mission as flown rather than silently resetting it.
  const importedTurn = textByLocalName(placemarks[0], 'waypointTurnMode').trim()
  const turnMode = TURN_MODE_IMPORTS[importedTurn] ?? 'pass'
  let takeoffSecurityHeight = 30
  let importedFinishAction: PlannerSettings['finishAction'] = 'goHome'
  if (templateXml) {
    try {
      const templateDocument = parseXml(templateXml)
      const security = firstNumber(textByLocalName(templateDocument, 'takeOffSecurityHeight'))
      if (security !== null) takeoffSecurityHeight = security
      const action = textByLocalName(templateDocument, 'finishAction').trim()
      if (action === 'autoLand' || action === 'noAction' || action === 'goHome') importedFinishAction = action
    } catch {
      // A malformed template must not block importing the waypoints themselves.
    }
  }
  const settings: PlannerSettings = {
    name: filename.replace(/\.(kmz|kml)$/i, ''),
    drone: 'custom',
    cameraDirection: first.pitch <= -80 ? 'nadir' : 'custom',
    altitude: Math.round(first.height),
    speed: Math.min(15, Math.max(0.1, first.speed)),
    takeoffSecurityHeight,
    finishAction: importedFinishAction,
    gimbalPitch: first.pitch,
    headingMode,
    headingAngle: first.yaw,
    forwardOverlap: 80,
    sideOverlap: 70,
    rotation: 0,
    autoDirection: false,
    turnMode,
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
    photosPerPoint: waypoints.some((point) => point.takePhoto),
    splitDistance: 600,
    sampleInterval: 20,
    customLineSpacing: false,
    lineSpacing: 30,
  }
  return {
    draft: {
      kind: 'grid',
      input: points,
      settings,
      selectedIndex: null,
      importedName: filename,
      importedWaypoints: waypoints,
    },
    warnings,
  }
}

function xmlEscape(value: string | number) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function normalizeHeight(height: number) {
  return Math.max(1, Math.round(height * 10) / 10)
}

function normalizeSpeed(speed: number) {
  return Math.min(15, Math.max(0.1, Number(speed) || 2.5))
}

function normalizeYaw(yaw: number) {
  const normalized = Number.isFinite(yaw) ? ((yaw % 360) + 360) % 360 : 0
  return normalized > 180 ? normalized - 360 : normalized
}

export type WpmlIssue = { level: 'error' | 'warning'; field: string; message: string }

export function validateWpmlMission(result: PlannerResult, settings: PlannerSettings): WpmlIssue[] {
  const issues: WpmlIssue[] = []
  if (!result.waypoints.length) issues.push({ level: 'error', field: 'waypoints', message: '没有可导出的航点' })
  if (settings.speed < 0.1 || settings.speed > 15) issues.push({ level: 'error', field: 'waypointSpeed', message: '航点速度必须在 0.1 至 15 m/s 之间' })
  if (!['goHome', 'noAction', 'autoLand'].includes(settings.finishAction)) issues.push({ level: 'error', field: 'finishAction', message: '任务结束动作不是可接受的 WPML 枚举值' })
  const duplicate = result.waypoints.some((point, index) => index > 0 && distanceForValidation(point, result.waypoints[index - 1]) < 0.01)
  if (duplicate) issues.push({ level: 'warning', field: 'coordinates', message: '存在重复或过近的航点' })
  return issues
}

function distanceForValidation(a: Waypoint, b: Waypoint) {
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const dLat = lat2 - lat1
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * 6378137 * Math.asin(Math.min(1, Math.sqrt(h)))
}

// The planner already resolves the aircraft yaw per heading mode, but WPML needs the
// matching mode name too. Field-verified exports (DJI Fly, XiaoQu Route Planner v1.7) use
// `smoothTransition` for the follow-the-flight-direction case and `fixed` when the craft
// holds one compass heading; `manually` lets DJI Fly reuse whatever the operator last set.
const HEADING_MODE_MAP: Record<PlannerSettings['headingMode'], string> = {
  followWayline: 'smoothTransition',
  fixed: 'fixed',
  manual: 'manually',
}

const HEADING_MODE_IMPORTS: Record<string, PlannerSettings['headingMode']> = {
  followWayline: 'followWayline',
  smoothTransition: 'followWayline',
  fixed: 'fixed',
  manually: 'manual',
}

// WPML turn modes. `pass` keeps the aircraft moving through the point with a curvature
// blend (the fast fly-over/shoot mode XiaoQu exports by default); `stop` halts at the
// point so the shutter fires from a standstill, which is what DJI recommends when the
// forward overlap is high or the scene has moving subjects.
const TURN_MODE_MAP: Record<PlannerSettings['turnMode'], string> = {
  pass: 'toPointAndPassWithContinuityCurvature',
  stop: 'toPointAndStopWithDiscontinuityCurvature',
}

const TURN_MODE_IMPORTS: Record<string, PlannerSettings['turnMode']> = {
  toPointAndPassWithContinuityCurvature: 'pass',
  toPointAndStopWithContinuityCurvature: 'stop',
  toPointAndStopWithDiscontinuityCurvature: 'stop',
  toPointAndFlyOverWithoutStopping: 'pass',
}

function finishAction(settings: PlannerSettings) {
  return settings.finishAction === 'autoLand' || settings.finishAction === 'noAction'
    ? settings.finishAction
    : 'goHome'
}

function gimbalRotateAction(actionId: number, pitch: number, yaw: number) {
  return `<wpml:action>
            <wpml:actionId>${actionId}</wpml:actionId>
            <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>
            <wpml:actionActuatorFuncParam>
              <wpml:gimbalHeadingYawBase>aircraft</wpml:gimbalHeadingYawBase>
              <wpml:gimbalRotateMode>absoluteAngle</wpml:gimbalRotateMode>
              <wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable>
              <wpml:gimbalPitchRotateAngle>${pitch.toFixed(1)}</wpml:gimbalPitchRotateAngle>
              <wpml:gimbalRollRotateEnable>0</wpml:gimbalRollRotateEnable>
              <wpml:gimbalRollRotateAngle>0</wpml:gimbalRollRotateAngle>
              <wpml:gimbalYawRotateEnable>1</wpml:gimbalYawRotateEnable>
              <wpml:gimbalYawRotateAngle>${normalizeYaw(yaw).toFixed(1)}</wpml:gimbalYawRotateAngle>
              <wpml:gimbalRotateTimeEnable>0</wpml:gimbalRotateTimeEnable>
              <wpml:gimbalRotateTime>0</wpml:gimbalRotateTime>
              <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
            </wpml:actionActuatorFuncParam>
          </wpml:action>`
}

function takePhotoAction(actionId: number, suffix: string) {
  return `<wpml:action>
            <wpml:actionId>${actionId}</wpml:actionId>
            <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>
            <wpml:actionActuatorFuncParam>
              <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
              <wpml:useGlobalPayloadLensIndex>0</wpml:useGlobalPayloadLensIndex>
              <wpml:fileSuffix>${xmlEscape(suffix)}</wpml:fileSuffix>
            </wpml:actionActuatorFuncParam>
          </wpml:action>`
}

export function buildWaylinesXml(
  result: PlannerResult,
  settings: PlannerSettings,
  _name: string,
) {
  const waypoints = result.waypoints
  const speed = normalizeSpeed(settings.speed)
  const suffix = 'route'
  const turnMode = TURN_MODE_MAP[settings.turnMode] ?? TURN_MODE_MAP.pass
  let nextActionId = 0
  const placemarks = waypoints.map((waypoint, index) => {
    const next = waypoints[index + 1]
    const courseYaw = next ? bearing([waypoint.lon, waypoint.lat], [next.lon, next.lat]) : waypoint.yaw
    const headingMode = HEADING_MODE_MAP[settings.headingMode] ?? 'followWayline'
    const yaw = headingMode === 'followWayline' ? courseYaw : waypoint.yaw
    const pitch = Math.max(-90, Math.min(0, Number.isFinite(waypoint.pitch) ? waypoint.pitch : -90))
    const groupId = index * 2 + 1
    const gimbalActionId = nextActionId++
    const photoActionId = waypoint.takePhoto ? nextActionId++ : -1
    const segmentActionId = next ? nextActionId++ : -1
    const gimbalAndPhoto = `<wpml:actionGroup>
          <wpml:actionGroupId>${groupId}</wpml:actionGroupId>
          <wpml:actionGroupStartIndex>${index}</wpml:actionGroupStartIndex>
          <wpml:actionGroupEndIndex>${index}</wpml:actionGroupEndIndex>
          <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
          <wpml:actionTrigger><wpml:actionTriggerType>reachPoint</wpml:actionTriggerType></wpml:actionTrigger>
          ${gimbalRotateAction(gimbalActionId, pitch, yaw)}
          ${waypoint.takePhoto ? takePhotoAction(photoActionId, suffix) : ''}
        </wpml:actionGroup>`
    const evenGimbal = next ? `<wpml:actionGroup>
          <wpml:actionGroupId>${groupId + 1}</wpml:actionGroupId>
          <wpml:actionGroupStartIndex>${index}</wpml:actionGroupStartIndex>
          <wpml:actionGroupEndIndex>${index + 1}</wpml:actionGroupEndIndex>
          <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
          <wpml:actionTrigger><wpml:actionTriggerType>reachPoint</wpml:actionTriggerType></wpml:actionTrigger>
          <wpml:action>
            <wpml:actionId>${segmentActionId}</wpml:actionId>
            <wpml:actionActuatorFunc>gimbalEvenlyRotate</wpml:actionActuatorFunc>
            <wpml:actionActuatorFuncParam>
              <wpml:gimbalPitchRotateAngle>${pitch.toFixed(1)}</wpml:gimbalPitchRotateAngle>
              <wpml:gimbalRollRotateAngle>0</wpml:gimbalRollRotateAngle>
              <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
            </wpml:actionActuatorFuncParam>
          </wpml:action>
        </wpml:actionGroup>` : ''
    return `
      <Placemark>
        <Point><coordinates>${waypoint.lon.toFixed(12)},${waypoint.lat.toFixed(12)}</coordinates></Point>
        <wpml:index>${index}</wpml:index>
        <wpml:executeHeight>${normalizeHeight(waypoint.height)}</wpml:executeHeight>
        <wpml:waypointSpeed>${speed.toFixed(1)}</wpml:waypointSpeed>
        <wpml:waypointHeadingParam>
          <wpml:waypointHeadingMode>${headingMode}</wpml:waypointHeadingMode>
          <wpml:waypointHeadingAngle>${normalizeYaw(yaw).toFixed(1)}</wpml:waypointHeadingAngle>
          <wpml:waypointPoiPoint>0.000000,0.000000,0.000000</wpml:waypointPoiPoint>
          <wpml:waypointHeadingAngleEnable>1</wpml:waypointHeadingAngleEnable>
          <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
          <wpml:waypointHeadingPoiIndex>0</wpml:waypointHeadingPoiIndex>
        </wpml:waypointHeadingParam>
        <wpml:waypointTurnParam>
          <wpml:waypointTurnMode>${turnMode}</wpml:waypointTurnMode>
          <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
        </wpml:waypointTurnParam>
        <wpml:useStraightLine>0</wpml:useStraightLine>
        ${gimbalAndPhoto}
        ${evenGimbal}
        <wpml:waypointGimbalHeadingParam>
          <wpml:waypointGimbalPitchAngle>${pitch.toFixed(1)}</wpml:waypointGimbalPitchAngle>
          <wpml:waypointGimbalYawAngle>${normalizeYaw(yaw).toFixed(1)}</wpml:waypointGimbalYawAngle>
        </wpml:waypointGimbalHeadingParam>
      </Placemark>`
  }).join('\n')

  // waylines.wpml carries the real mission distance and duration so DJI Fly's mission
  // list shows honest numbers instead of zeros.
  const distance = Math.round(result.pathLength)
  const duration = Math.round(result.estimatedSeconds ?? result.pathLength / Math.max(1, speed))

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}" xmlns:wpml="${WPML_NS}">
  <Document>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>${finishAction(settings)}</wpml:finishAction>
      <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>goBack</wpml:executeRCLostAction>
      <wpml:takeOffSecurityHeight>${normalizeHeight(settings.takeoffSecurityHeight)}</wpml:takeOffSecurityHeight>
      <wpml:globalTransitionalSpeed>${speed.toFixed(1)}</wpml:globalTransitionalSpeed>
      <wpml:droneInfo>
        <wpml:droneEnumValue>68</wpml:droneEnumValue>
        <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
      </wpml:droneInfo>
    </wpml:missionConfig>
    <Folder>
      <wpml:templateId>0</wpml:templateId>
      <wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode>
      <wpml:waylineId>0</wpml:waylineId>
      <wpml:distance>${distance}</wpml:distance>
      <wpml:duration>${duration}</wpml:duration>
      <wpml:autoFlightSpeed>${speed.toFixed(1)}</wpml:autoFlightSpeed>${placemarks}
    </Folder>
  </Document>
</kml>
`
}

// The template mirrors the structure of a DJI Fly field-verified export (XiaoQu Route
// Planner v1.7): missionConfig with a take-off security height, then one Folder holding
// the coordinate system, payload, and global heading parameters followed by a full copy of
// every waypoint. DJI Fly executes from waylines.wpml and reads template.kml for the
// mission profile, so both files must agree.
export function buildTemplateXml(result: PlannerResult, settings: PlannerSettings) {
  const timestamp = Date.now()
  const speed = normalizeSpeed(settings.speed)
  const height = normalizeHeight(settings.altitude)
  // DJI writes mission heights with two decimals in template.kml; match it exactly.
  const heightStr = height.toFixed(2)
  const headingMode = HEADING_MODE_MAP[settings.headingMode] ?? 'followWayline'
  const turnMode = TURN_MODE_MAP[settings.turnMode] ?? TURN_MODE_MAP.pass
  const waypoints = result.waypoints
  let nextActionId = 0
  const placemarks = waypoints.map((waypoint, index) => {
    const pitch = Math.max(-90, Math.min(0, Number.isFinite(waypoint.pitch) ? waypoint.pitch : -90))
    const yaw = normalizeYaw(waypoint.yaw)
    const groupId = index * 2 + 1
    const photoActionId = waypoint.takePhoto ? nextActionId++ : -1
    const gimbalActionId = nextActionId++
    return `
      <Placemark>
        <Point><coordinates>${waypoint.lon.toFixed(12)},${waypoint.lat.toFixed(12)}</coordinates></Point>
        <wpml:index>${index}</wpml:index>
        <wpml:useGlobalHeight>0</wpml:useGlobalHeight>
        <wpml:height>${heightStr}</wpml:height>
        <wpml:useGlobalSpeed>1</wpml:useGlobalSpeed>
        <wpml:useGlobalTurnParam>0</wpml:useGlobalTurnParam>
        <wpml:waypointTurnParam>
          <wpml:waypointTurnMode>${turnMode}</wpml:waypointTurnMode>
          <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
        </wpml:waypointTurnParam>
        <wpml:useStraightLine>0</wpml:useStraightLine>
        <wpml:useGlobalHeadingParam>0</wpml:useGlobalHeadingParam>
        <wpml:waypointHeadingParam>
          <wpml:waypointHeadingMode>${headingMode}</wpml:waypointHeadingMode>
          <wpml:waypointHeadingAngle>${yaw.toFixed(6)}</wpml:waypointHeadingAngle>
          <wpml:waypointHeadingAngleEnable>1</wpml:waypointHeadingAngleEnable>
          <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
        </wpml:waypointHeadingParam>
        <wpml:gimbalPitchAngle>${pitch.toFixed(1)}</wpml:gimbalPitchAngle>
        <wpml:actionGroup>
          <wpml:actionGroupId>${groupId}</wpml:actionGroupId>
          <wpml:actionGroupStartIndex>${index}</wpml:actionGroupStartIndex>
          <wpml:actionGroupEndIndex>${index}</wpml:actionGroupEndIndex>
          <wpml:actionGroupMode>parallel</wpml:actionGroupMode>
          <wpml:actionTrigger><wpml:actionTriggerType>reachPoint</wpml:actionTriggerType></wpml:actionTrigger>
          ${waypoint.takePhoto ? `<wpml:action>
            <wpml:actionId>${photoActionId}</wpml:actionId>
            <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>
            <wpml:actionActuatorFuncParam><wpml:payloadPositionIndex>0</wpml:payloadPositionIndex></wpml:actionActuatorFuncParam>
          </wpml:action>` : ''}
          <wpml:action>
            <wpml:actionId>${gimbalActionId}</wpml:actionId>
            <wpml:actionActuatorFunc>gimbalEvenlyRotate</wpml:actionActuatorFunc>
            <wpml:actionActuatorFuncParam>
              <wpml:gimbalPitchRotateAngle>${pitch.toFixed(1)}</wpml:gimbalPitchRotateAngle>
              <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
            </wpml:actionActuatorFuncParam>
          </wpml:action>
        </wpml:actionGroup>
      </Placemark>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}" xmlns:wpml="${WPML_NS}">
  <Document>
    <wpml:author>RouteStudio</wpml:author>
    <wpml:createTime>${timestamp}</wpml:createTime>
    <wpml:updateTime>${timestamp}</wpml:updateTime>
    <wpml:missionConfig>
      <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
      <wpml:finishAction>${finishAction(settings)}</wpml:finishAction>
      <wpml:exitOnRCLost>executeLostAction</wpml:exitOnRCLost>
      <wpml:executeRCLostAction>goBack</wpml:executeRCLostAction>
      <wpml:takeOffSecurityHeight>${normalizeHeight(settings.takeoffSecurityHeight)}</wpml:takeOffSecurityHeight>
      <wpml:globalTransitionalSpeed>${speed.toFixed(1)}</wpml:globalTransitionalSpeed>
      <wpml:droneInfo>
        <wpml:droneEnumValue>68</wpml:droneEnumValue>
        <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
      </wpml:droneInfo>
    </wpml:missionConfig>
    <Folder>
      <wpml:templateId>0</wpml:templateId>
      <wpml:waylineCoordinateSysParam>
        <wpml:coordinateMode>WGS84</wpml:coordinateMode>
        <wpml:heightMode>relativeToStartPoint</wpml:heightMode>
      </wpml:waylineCoordinateSysParam>
      <wpml:payloadParam>
        <wpml:autoFlightSpeed>${speed.toFixed(1)}</wpml:autoFlightSpeed>
        <wpml:globalWaypointTurnMode>${turnMode}</wpml:globalWaypointTurnMode>
        <wpml:globalUseStraightLine>0</wpml:globalUseStraightLine>
        <wpml:gimbalPitchMode>usePointSetting</wpml:gimbalPitchMode>
        <wpml:height>${heightStr}</wpml:height>
      </wpml:payloadParam>
      <wpml:globalWaypointHeadingParam>
        <wpml:waypointHeadingMode>${headingMode}</wpml:waypointHeadingMode>
        <wpml:waypointHeadingAngle>${normalizeYaw(settings.headingAngle).toFixed(6)}</wpml:waypointHeadingAngle>
        <wpml:waypointHeadingAngleEnable>1</wpml:waypointHeadingAngleEnable>
        <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
      </wpml:globalWaypointHeadingParam>${placemarks}
    </Folder>
  </Document>
</kml>
`
}

export function buildKmz(result: PlannerResult, settings: PlannerSettings, name: string) {
  return zipSync(
    {
      'wpmz/template.kml': strToU8(buildTemplateXml(result, settings)),
      'wpmz/waylines.wpml': strToU8(buildWaylinesXml(result, settings, name)),
    },
    { level: 6 },
  )
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime = 'application/octet-stream') {
  const blob = new Blob([bytes as unknown as BlobPart], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
