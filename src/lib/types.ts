export type PlannerKind =
  | 'points'
  | 'line'
  | 'corridor'
  | 'grid'
  | 'oblique'
  | 'orbit'

export type Point2D = { lon: number; lat: number }

export type LngLat = [number, number]

export type DroneId = string

export type CameraProfile = {
  id: DroneId
  name: string
  sensorWidth: number
  sensorHeight: number
  focalLength: number
  activeFocalLength?: number
  imageWidth: number
  imageHeight: number
  maxFlightHeight: number
  droneEnumValue: number
  subtitle: string
  family: 'consumer' | 'enterprise'
  waypoint: 'native' | 'limited'
  exportMode: 'exact' | 'generic'
  supportNote?: string
}

export type Waypoint = Point2D & {
  height: number
  speed: number
  pitch: number
  yaw: number
  takePhoto: boolean
  actions?: string[]
}

export type FlightLeg = {
  id: string
  points: LngLat[]
  kind: 'transit' | 'capture'
  pitch?: number
}

export type PlannerSettings = {
  name: string
  drone: DroneId
  cameraDirection: 'nadir' | 'forward' | 'custom'
  altitude: number
  speed: number
  takeoffSecurityHeight: number
  finishAction: 'goHome' | 'hover' | 'land'
  gimbalPitch: number
  headingMode: 'followWayline' | 'fixed' | 'manual'
  headingAngle: number
  forwardOverlap: number
  sideOverlap: number
  rotation: number
  obliqueDirections: 2 | 3 | 5
  corridorOffset: number
  corridorCount: number
  spacing: number
  pointCount: number
  obstacleDistance: number
  orbitMode: 'cylinder' | 'helix' | 'ring'
  orbitRadius: number
  orbitHeight: number
  orbitLaps: number
  photosPerPoint: boolean
  splitDistance: number
  sampleInterval: number
  customLineSpacing: boolean
  lineSpacing: number
}

export type PlannerDraft = {
  kind: PlannerKind
  input: LngLat[]
  settings: PlannerSettings
  selectedIndex: number | null
  importedName?: string
  importedWaypoints?: Waypoint[]
}

export type PlannerResult = {
  legs: FlightLeg[]
  waypoints: Waypoint[]
  source: LngLat[]
  area: number
  pathLength: number
  captureLength: number
  gsd: number
  footprint: { width: number; height: number }
  lineSpacing: number
  photoInterval: number
  recommendedLineSpacing: number
  captureLineSpacing: number
  estimatedBattery: number
  captureCount: number
  mainLineCount: number
  photoCount: number
  completed: boolean
  warnings: string[]
}

export type PlannerDefinition = {
  kind: PlannerKind
  label: string
  shortLabel: string
  desc: string
  hint: string
  color: string
  tint: string
  icon: string
}
