import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { bearing, CAMERA_MAP } from './planners'
import type {
  LngLat,
  PlannerDraft,
  PlannerResult,
  PlannerSettings,
  Waypoint,
} from './types'

const KML_NS = 'http://www.opengis.net/kml/2.2'
const WPML_NS = 'http://www.dji.com/wpmz/1.0.2'

function parseXml(text: string): XMLDocument {
  const document = new DOMParser().parseFromString(text, 'application/xml')
  const failure = document.querySelector('parsererror')
  if (failure) throw new Error('文件中的 XML 无法解析')
  return document
}

function allByLocalName(root: ParentNode, name: string): Element[] {
  return Array.from(root.querySelectorAll('*')).filter(
    (node) => node.localName === name,
  )
}

export function readWaypointDirectives(placemark: Element): string[] {
  return allByLocalName(placemark, 'actionActuatorFunc').map((node) => node.textContent?.trim() ?? '')
}

function textByLocalName(root: ParentNode, name: string) {
  return allByLocalName(root, name)[0]?.textContent?.trim() ?? ''
}

export type ImportedMission = {
  draft: PlannerDraft
  warnings: string[]
}

function parseCoordinate(text: string): LngLat | null {
  const chunks = text.trim().split(/\s+/)
  for (const chunk of chunks) {
    const values = chunk.split(',').map(Number)
    if (values.length >= 2 && Number.isFinite(values[0]) && Number.isFinite(values[1])) {
      return [values[0], values[1]]
    }
  }
  return null
}

function missionKind(pointCount: number): 'points' | 'grid' {
  return pointCount >= 10 ? 'grid' : 'points'
}

export function importMissionBuffer(
  buffer: ArrayBuffer,
  filename: string,
): ImportedMission {
  const bytes = new Uint8Array(buffer)
  let text = ''
  const warnings: string[] = []
  try {
    const entries = unzipSync(bytes)
    const waylines = Object.entries(entries).find(([name]) => /waylines?\.wpml$/i.test(name))
    const template = Object.entries(entries).find(([name]) => /template\.kml$/i.test(name))
    if (!waylines) throw new Error('KMZ 中未找到 wpmz/waylines.wpml')
    text = strFromU8(waylines[1])
    if (template) {
      const templateXml = strFromU8(template[1])
      if (/wpmz\/1\.0\.\d/i.test(templateXml)) warnings.push('已读取任务模板并保留 WPML 兼容信息')
    }
  } catch (error) {
    if (error instanceof Error && error.message) {
      if (!filename.toLowerCase().endsWith('.kml')) {
        throw error
      }
    }
    text = new TextDecoder('utf-8').decode(bytes)
  }

  const document = parseXml(text)
  const placemarks = allByLocalName(document, 'Placemark')
  if (!placemarks.length) throw new Error('文件中没有可用的航点')
  const waypoints: Waypoint[] = placemarks.map((placemark, index) => {
    const coordinate = parseCoordinate(textByLocalName(placemark, 'coordinates'))
    if (!coordinate) throw new Error(`第 ${index + 1} 个航点缺少坐标`)
    return {
      lon: coordinate[0],
      lat: coordinate[1],
      height: Number(textByLocalName(placemark, 'executeHeight')) || 100,
      speed: Number(textByLocalName(placemark, 'waypointSpeed')) || 8,
      pitch: Number(textByLocalName(placemark, 'gimbalPitchRotateAngle')) || -90,
      yaw: Number(textByLocalName(placemark, 'waypointHeadingAngle')) || 0,
      takePhoto: readWaypointDirectives(placemark).includes('takePhoto'),
      actions: readWaypointDirectives(placemark),
    }
  })
  const points = waypoints.map((waypoint) => [waypoint.lon, waypoint.lat] as LngLat)
  const first = waypoints[0]
  const kind = missionKind(waypoints.length)
  const settings: PlannerSettings = {
    name: filename.replace(/\.(kmz|kml)$/i, ''),
    drone: 'custom',
    cameraDirection: first.pitch <= -80 ? 'nadir' : 'custom',
    altitude: Math.round(first.height),
    speed: first.speed,
    takeoffSecurityHeight:
      Number(textByLocalName(document, 'takeOffSecurityHeight')) || 30,
    finishAction: 'goHome',
    gimbalPitch: first.pitch,
    headingMode: 'followWayline',
    headingAngle: first.yaw,
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
    photosPerPoint: waypoints.some((point) => point.takePhoto),
    splitDistance: 600,
    sampleInterval: 20,
    customLineSpacing: false,
    lineSpacing: 30,
  }
  return {
    draft: {
      kind,
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

function actionXml(
  actionId: number,
  waypoint: Waypoint,
  _settings: PlannerSettings,
  payloadIndex: number,
) {
  const actions: string[] = []
  if (waypoint.takePhoto) {
    actions.push(`
                    <wpml:action>
                        <wpml:actionId>${actionId}</wpml:actionId>
                        <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>
                        <wpml:actionActuatorFuncParam>
                            <wpml:payloadPositionIndex>${payloadIndex}</wpml:payloadPositionIndex>
                            <wpml:fileSuffix>wayline</wpml:fileSuffix>
                        </wpml:actionActuatorFuncParam>
                    </wpml:action>`)
  }
  actions.push(`
                    <wpml:action>
                        <wpml:actionId>${actionId + (waypoint.takePhoto ? 1 : 0)}</wpml:actionId>
                        <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>
                        <wpml:actionActuatorFuncParam>
                            <wpml:gimbalHeadingYawBase>aircraft</wpml:gimbalHeadingYawBase>
                            <wpml:gimbalRotateMode>absoluteAngle</wpml:gimbalRotateMode>
                            <wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable>
                            <wpml:gimbalPitchRotateAngle>${xmlEscape(waypoint.pitch)}</wpml:gimbalPitchRotateAngle>
                            <wpml:gimbalRollRotateEnable>0</wpml:gimbalRollRotateEnable>
                            <wpml:gimbalRollRotateAngle>0</wpml:gimbalRollRotateAngle>
                            <wpml:gimbalYawRotateEnable>0</wpml:gimbalYawRotateEnable>
                            <wpml:gimbalYawRotateAngle>0</wpml:gimbalYawRotateAngle>
                            <wpml:gimbalRotateTimeEnable>0</wpml:gimbalRotateTimeEnable>
                            <wpml:gimbalRotateTime>0</wpml:gimbalRotateTime>
                            <wpml:payloadPositionIndex>${payloadIndex}</wpml:payloadPositionIndex>
                        </wpml:actionActuatorFuncParam>
                    </wpml:action>`)
  return actions.join('')
}

export function buildWaylinesXml(
  result: PlannerResult,
  settings: PlannerSettings,
  name: string,
) {
  const camera = CAMERA_MAP[settings.drone] ?? CAMERA_MAP.custom
  const waypoints = result.waypoints
  const speed = Math.max(1, settings.speed)
  const placemarks = waypoints
    .map((waypoint, index) => {
      const next = waypoints[index + 1]
      const yaw = settings.headingMode === 'fixed'
        ? settings.headingAngle
        : next
          ? bearing([waypoint.lon, waypoint.lat], [next.lon, next.lat])
          : waypoint.yaw
      return `
            <Placemark>
                <name>${xmlEscape(`Waypoint ${index + 1}`)}</name>
                <Point>
                    <coordinates>${waypoint.lon.toFixed(10)},${waypoint.lat.toFixed(10)}</coordinates>
                </Point>
                <wpml:index>${index}</wpml:index>
                <wpml:executeHeight>${normalizeHeight(waypoint.height)}</wpml:executeHeight>
                <wpml:waypointSpeed>${speed.toFixed(1)}</wpml:waypointSpeed>
                <wpml:waypointHeadingParam>
                    <wpml:waypointHeadingMode>${settings.headingMode === 'followWayline' ? 'followWayline' : 'smoothTransition'}</wpml:waypointHeadingMode>
                    <wpml:waypointHeadingAngle>${yaw.toFixed(1)}</wpml:waypointHeadingAngle>
                    <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
                </wpml:waypointHeadingParam>
                <wpml:waypointTurnParam>
                    <wpml:waypointTurnMode>toPointAndStopWithContinuityCurvature</wpml:waypointTurnMode>
                    <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
                </wpml:waypointTurnParam>
                <wpml:useStraightLine>0</wpml:useStraightLine>
                <wpml:actionGroup>
                    <wpml:actionGroupId>${index}</wpml:actionGroupId>
                    <wpml:actionGroupStartIndex>${index}</wpml:actionGroupStartIndex>
                    <wpml:actionGroupEndIndex>${index}</wpml:actionGroupEndIndex>
                    <wpml:actionGroupMode>sequence</wpml:actionGroupMode>
                    <wpml:actionTrigger>
                        <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
                        <wpml:actionTriggerParam>-90</wpml:actionTriggerParam>
                    </wpml:actionTrigger>${actionXml(0, waypoint, settings, 0)}
                </wpml:actionGroup>
            </Placemark>`
    })
    .join('\n')
  const timestamp = Date.now() / 1000
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}" xmlns:wpml="${WPML_NS}">
    <Document>
        <name>${xmlEscape(name)}</name>
        <wpml:author>Route Studio</wpml:author>
        <wpml:createTime>${timestamp}</wpml:createTime>
        <wpml:updateTime>${timestamp}</wpml:updateTime>
        <wpml:missionConfig>
            <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
            <wpml:finishAction>${xmlEscape(settings.finishAction)}</wpml:finishAction>
            <wpml:exitOnRCLost>goContinue</wpml:exitOnRCLost>
            <wpml:executeRCLostAction>goContinue</wpml:executeRCLostAction>
            <wpml:takeOffSecurityHeight>${normalizeHeight(settings.takeoffSecurityHeight)}</wpml:takeOffSecurityHeight>
            <wpml:globalTransitionalSpeed>${settings.speed.toFixed(1)}</wpml:globalTransitionalSpeed>
            <wpml:droneInfo>
                <wpml:droneEnumValue>${camera.droneEnumValue}</wpml:droneEnumValue>
                <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
            </wpml:droneInfo>
            <wpml:payloadInfo>
                <wpml:payloadEnumValue>${camera.droneEnumValue}</wpml:payloadEnumValue>
                <wpml:payloadSubEnumValue>0</wpml:payloadSubEnumValue>
                <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
            </wpml:payloadInfo>
            <wpml:waylineCoordinateSysParam>
                <wpml:coordinateMode>WGS84</wpml:coordinateMode>
                <wpml:heightMode>relativeToStartPoint</wpml:heightMode>
                <wpml:globalHeight>${normalizeHeight(settings.altitude)}</wpml:globalHeight>
                <wpml:gpsTimeSource>GPS_MODULE</wpml:gpsTimeSource>
            </wpml:waylineCoordinateSysParam>
        </wpml:missionConfig>
        <Folder>
            <wpml:templateId>0</wpml:templateId>
            <wpml:waylineId>0</wpml:waylineId>
            <wpml:autoFlightSpeed>${speed.toFixed(1)}</wpml:autoFlightSpeed>
            <wpml:executeHeightMode>relativeToStartPoint</wpml:executeHeightMode>
            <wpml:payloadParam>
                <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
                <wpml:imageFormat>wide</wpml:imageFormat>
            </wpml:payloadParam>${placemarks}
        </Folder>
    </Document>
</kml>
`
}

export function buildTemplateXml(settings: PlannerSettings) {
  const camera = CAMERA_MAP[settings.drone] ?? CAMERA_MAP.custom
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}" xmlns:wpml="${WPML_NS}">
    <Document>
        <wpml:author>Route Studio</wpml:author>
        <wpml:createTime>${Date.now() / 1000}</wpml:createTime>
        <wpml:updateTime>${Date.now() / 1000}</wpml:updateTime>
        <wpml:missionConfig>
            <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
            <wpml:finishAction>${xmlEscape(settings.finishAction)}</wpml:finishAction>
            <wpml:exitOnRCLost>goContinue</wpml:exitOnRCLost>
            <wpml:globalTransitionalSpeed>${settings.speed.toFixed(1)}</wpml:globalTransitionalSpeed>
            <wpml:droneInfo>
                <wpml:droneEnumValue>${camera.droneEnumValue}</wpml:droneEnumValue>
                <wpml:droneSubEnumValue>0</wpml:droneSubEnumValue>
            </wpml:droneInfo>
        </wpml:missionConfig>
    </Document>
</kml>
`
}

export function buildKmz(result: PlannerResult, settings: PlannerSettings, name: string) {
  return zipSync(
    {
      'wpmz/template.kml': strToU8(buildTemplateXml(settings)),
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

