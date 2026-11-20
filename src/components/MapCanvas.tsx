import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LngLat, PlannerDefinition, PlannerDraft, PlannerResult } from '../lib/types'
import { PLANNER_DEFS } from '../lib/planners'

export type BaseMap = 'satellite' | 'streets'
type MapCanvasProps = {
  draft: PlannerDraft
  result: PlannerResult
  baseMap: BaseMap
  showNumbers: boolean
  showCamera: boolean
  showLabels: boolean
  drawing: boolean
  onAddPoint: (point: LngLat) => void
  onSetInput: (points: LngLat[]) => void
  onSelectInput: (index: number | null) => void
  onLocate: (point: LngLat) => void
  onFinishPolygon: () => void
  previewIndex?: number | null
  onMapReady?: () => void
}

type MapState = {
  map: L.Map
  baseLayers: BaseLayerStack
  renderLayer: L.LayerGroup
  drawLayer: L.LayerGroup
  editLayer: L.LayerGroup
  previewLayer: L.LayerGroup
}

type TileSource = { url: string; attribution: string; maxZoom: number; subdomains?: string[]; className?: string }
type BaseMapSpec = { base: TileSource; overlay?: TileSource }

// Both base maps are published in the global WGS 84 / Web Mercator grid, the same datum a
// drone's GPS reports. Picking a point on the map therefore yields its true coordinate with
// no datum correction anywhere in the app, which is what makes exported routes land exactly
// where they were drawn. AMap and the other Chinese providers shift their tiles into GCJ-02,
// so every coordinate would have to be converted on the way in and back on the way out - a
// chain that silently breaks the moment one formula is off.
//
// CARTO's free raster tiles now carry an "API KEY REQUIRED" watermark for anonymous use, so
// nothing here points at basemaps.cartocdn.com. The satellite annotation overlay and the
// street basemap both use the tile.openstreetmap.de mirror: it serves Chinese place and road
// labels with no watermark and is CORS-enabled. Over imagery the same tiles are blended with
// CSS `multiply`, so their pale background drops out and only the dark labels remain - the
// free, key-less equivalent of a transparent label layer. Esri's own reference-label layer is
// empty over China, which is why it is not used here.
const ESRI_MAX_ZOOM = 19
const OSM_DE_MAX_ZOOM = 18

const BASE_LAYERS: Record<BaseMap, BaseMapSpec> = {
  satellite: {
    base: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '影像 © Esri, Maxar',
      maxZoom: ESRI_MAX_ZOOM,
    },
    overlay: {
      url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '注记 © OSM',
      maxZoom: OSM_DE_MAX_ZOOM,
      className: 'label-overlay',
    },
  },
  streets: {
    base: {
      url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '街道 © OpenStreetMap 贡献者',
      maxZoom: OSM_DE_MAX_ZOOM,
    },
  },
}

const createTileLayer = (source: TileSource) => L.tileLayer(source.url, {
  attribution: source.attribution,
  maxZoom: source.maxZoom,
  subdomains: source.subdomains ?? ['a', 'b', 'c'],
  crossOrigin: true,
  keepBuffer: 5,
  updateWhenIdle: false,
  updateWhenZooming: true,
  className: source.className,
})

// The imagery and annotation tiles are separate layers, so switching base maps
// always swaps the whole stack instead of a single layer. The satellite annotation
// overlay is returned unattached so a dedicated effect can add or remove it when the
// user toggles the label layer.
type BaseLayerStack = { base: L.TileLayer[]; label: L.TileLayer | null }
const addBaseLayers = (map: L.Map, baseMap: BaseMap): BaseLayerStack => {
  const spec = BASE_LAYERS[baseMap]
  const base = [createTileLayer(spec.base)]
  const label = spec.overlay ? createTileLayer(spec.overlay) : null
  base.forEach((layer) => layer.addTo(map))
  base[0].bringToBack()
  return { base, label }
}

// The tiles and the route share one datum, so display needs no conversion at all.
const displayPoint = (point: LngLat): L.LatLngTuple => [point[1], point[0]]

const markerColor = (def: PlannerDefinition) => def.color

export function MapCanvas({
  draft,
  result,
  baseMap,
  showNumbers,
  showCamera,
  showLabels,
  drawing,
  onAddPoint,
  onSetInput,
  onSelectInput,
  onLocate,
  onFinishPolygon,
  previewIndex = null,
  onMapReady,
}: MapCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<MapState | null>(null)
  const callbacksRef = useRef({ onAddPoint, onSetInput, onSelectInput, onLocate, onFinishPolygon, onMapReady })
  const draftRef = useRef(draft)
  const drawingRef = useRef(drawing)
  const mapReadyRef = useRef(false)
  const baseMapRef = useRef(baseMap)
  const appliedBaseMapRef = useRef<BaseMap | null>(null)
  const cursorRef = useRef<L.LatLng | null>(null)
  const drawOverlayRef = useRef<() => void>(() => undefined)

  useEffect(() => {
    callbacksRef.current = { onAddPoint, onSetInput, onSelectInput, onLocate, onFinishPolygon, onMapReady }
    draftRef.current = draft
    drawingRef.current = drawing
    baseMapRef.current = baseMap
  })

  // Initialize Leaflet exactly once. Map state must never be coupled to route data.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const initialCenter: LngLat = draftRef.current.input[0] ?? [113.662923, 34.830072]
    const map = L.map(host, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      closePopupOnClick: false,
    }).setView(displayPoint(initialCenter), 17)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map)

    const baseLayers = addBaseLayers(map, baseMapRef.current)
    appliedBaseMapRef.current = baseMapRef.current
    const renderLayer = L.layerGroup().addTo(map)
    const drawLayer = L.layerGroup().addTo(map)
    const editLayer = L.layerGroup().addTo(map)
    const previewLayer = L.layerGroup().addTo(map)
    stateRef.current = { map, baseLayers, renderLayer, drawLayer, editLayer, previewLayer }

    // While the user is drawing, the boundary follows the placed control points and a
    // dashed edge follows the cursor. The preview polygon is filled so the area that
    // will actually be covered is visible before the click is committed. Tiles and
    // route share the WGS 84 datum, so these overlays use the Leaflet latlng as-is.
    drawOverlayRef.current = () => {
      const state = stateRef.current
      if (!state) return
      state.drawLayer.clearLayers()
      if (!drawingRef.current) return
      const def = PLANNER_DEFS[0]
      const placed = draftRef.current.input.map(displayPoint)
      const cursor = cursorRef.current
      const cursorPoint: L.LatLngTuple | null = cursor ? [cursor.lat, cursor.lng] : null
      const ring = cursorPoint && placed.length >= 2 ? [...placed, cursorPoint] : placed
      if (ring.length >= 3) {
        L.polygon(ring, {
          stroke: false,
          fillColor: def.color,
          fillOpacity: 0.2,
          interactive: false,
        }).addTo(state.drawLayer)
      }
      if (placed.length >= 2) {
        const lines: L.PolylineOptions = { interactive: false, lineCap: 'round', lineJoin: 'round' }
        L.polyline(placed, { ...lines, color: '#ffffff', weight: 6, opacity: 0.55 }).addTo(state.drawLayer)
        L.polyline(placed, { ...lines, color: def.color, weight: 3, opacity: 0.98 }).addTo(state.drawLayer)
      }
      if (cursorPoint && placed.length) {
        const rubber = [placed[placed.length - 1], cursorPoint]
        const dashed: L.PolylineOptions = { interactive: false, dashArray: '9 7', lineCap: 'round' }
        L.polyline(rubber, { ...dashed, color: '#ffffff', weight: 5, opacity: 0.45 }).addTo(state.drawLayer)
        L.polyline(rubber, { ...dashed, color: def.color, weight: 2.5, opacity: 0.98 }).addTo(state.drawLayer)
        if (placed.length >= 2) {
          const closing: L.PolylineOptions = { interactive: false, dashArray: '4 9', lineCap: 'round' }
          L.polyline([cursorPoint, placed[0]], { ...closing, color: '#ffffff', weight: 4, opacity: 0.35 }).addTo(state.drawLayer)
          L.polyline([cursorPoint, placed[0]], { ...closing, color: def.color, weight: 1.8, opacity: 0.8 }).addTo(state.drawLayer)
        }
        L.circleMarker(cursorPoint, {
          radius: 5,
          color: '#ffffff',
          weight: 2.5,
          fillColor: def.color,
          fillOpacity: 1,
          interactive: false,
        }).addTo(state.drawLayer)
      }
      if (placed.length >= 2) {
        L.circleMarker(placed[0], {
          radius: 6,
          color: def.color,
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 0.92,
          interactive: false,
        }).addTo(state.drawLayer)
      }
    }

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (!drawingRef.current) return
      callbacksRef.current.onAddPoint([event.latlng.lng, event.latlng.lat] as LngLat)
    })
    map.on('dblclick', (event: L.LeafletMouseEvent) => {
      L.DomEvent.preventDefault(event.originalEvent)
      if (!drawingRef.current) return
      if (draftRef.current.input.length >= 3) callbacksRef.current.onFinishPolygon()
    })
    map.on('mousemove', (event: L.LeafletMouseEvent) => {
      if (!drawingRef.current) return
      cursorRef.current = event.latlng
      drawOverlayRef.current()
    })
    map.on('mouseout', () => {
      if (!drawingRef.current) return
      cursorRef.current = null
      drawOverlayRef.current()
    })
    map.on('movestart zoomstart', () => {
      cursorRef.current = null
      drawOverlayRef.current()
    })

    // Middle mouse and right mouse drag pan the canvas. The native context menu is
    // suppressed only while dragging on the map, leaving markers fully usable.
    let rightDown = false
    let lastX = 0
    let lastY = 0
    host.addEventListener('contextmenu', (event) => event.preventDefault())
    host.addEventListener('mousedown', (event) => {
      if (event.button === 1 || event.button === 2) {
        event.preventDefault()
        rightDown = true
        lastX = event.clientX
        lastY = event.clientY
        map.dragging.disable()
        host.classList.add('is-panning')
      }
    })
    host.addEventListener('mousemove', (event) => {
      if (!rightDown) return
      if (Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY) < 1) return
      map.dragging.disable()
      map.panBy([lastX - event.clientX, lastY - event.clientY], { animate: false })
      lastX = event.clientX
      lastY = event.clientY
    })
    const stopPanning = () => {
      if (!rightDown) return
      rightDown = false
      map.dragging.enable()
      host.classList.remove('is-panning')
    }
    host.addEventListener('mouseup', stopPanning)
    host.addEventListener('mouseleave', stopPanning)

    const initialCenterPoint = L.latLng(displayPoint(initialCenter))
    const fitSavedRoute = () => {
      map.invalidateSize()
      const points = draftRef.current.input
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points.map(displayPoint)).pad(0.25), { animate: false })
      } else {
        map.setView(initialCenterPoint, 17, { animate: false })
      }
      mapReadyRef.current = true
      callbacksRef.current.onMapReady?.()
    }
    window.setTimeout(fitSavedRoute, 80)

    return () => {
      map.off()
      map.remove()
      stateRef.current = null
    }
  }, [])

  useEffect(() => {
    const state = stateRef.current
    if (!state || appliedBaseMapRef.current === baseMap) return
    appliedBaseMapRef.current = baseMap
    state.baseLayers.base.forEach((layer) => state.map.removeLayer(layer))
    if (state.baseLayers.label) state.map.removeLayer(state.baseLayers.label)
    state.baseLayers = addBaseLayers(state.map, baseMap)
  }, [baseMap])

  // The label overlay is its own tile layer so it can be switched off without touching
  // the imagery underneath. It is only ever created for the satellite stack.
  useEffect(() => {
    const state = stateRef.current
    const label = state?.baseLayers.label
    if (!state || !label) return
    if (showLabels) {
      if (!state.map.hasLayer(label)) label.addTo(state.map)
    } else if (state.map.hasLayer(label)) {
      state.map.removeLayer(label)
    }
  }, [baseMap, showLabels])

  useEffect(() => {
    const state = stateRef.current
    if (!state || !mapReadyRef.current) return
    state.map.invalidateSize({ pan: false, animate: false })
  }, [draft.input.length])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    state.renderLayer.clearLayers()
    const def = PLANNER_DEFS[0]
    if (drawing) return
    if (result.source.length > 2) {
      if (draft.kind === 'grid' || draft.kind === 'oblique') {
        L.polygon(result.source.map(displayPoint), {
          color: def.color,
          weight: 2,
          fillColor: def.color,
          fillOpacity: 0.13,
          dashArray: '6 6',
          interactive: false,
        }).addTo(state.renderLayer)
      } else {
        L.polyline(result.source.map(displayPoint), {
          color: def.color,
          weight: 2,
          opacity: 0.6,
          dashArray: '4 8',
          interactive: false,
        }).addTo(state.renderLayer)
      }
    }
    if (draft.kind === 'orbit' && draft.input[0]) {
      L.circle(displayPoint(draft.input[0]), {
        radius: result.area > 0 ? Math.sqrt(result.area / Math.PI) : draft.settings.orbitRadius,
        color: '#fff',
        weight: 1.5,
        opacity: 0.9,
        dashArray: '6 8',
        fillColor: def.color,
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(state.renderLayer)
    }
    result.legs.forEach((leg, legIndex) => {
      if (leg.points.length > 1) {
        const latlngs = leg.points.map(displayPoint)
        const isTransit = leg.kind === 'transit'
        const hue = (180 + legIndex * 29) % 360
        L.polyline(latlngs, {
          color: isTransit ? '#ffffff' : draft.kind === 'oblique' ? `hsl(${hue} 72% 64%)` : def.color,
          weight: isTransit ? 1.5 : 3,
          opacity: isTransit ? 0.78 : 0.94,
          dashArray: isTransit ? '4 8' : undefined,
          interactive: false,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(state.renderLayer)
      }
    })
    const every = Math.max(1, Math.ceil(result.waypoints.length / 180))
    const showCameraViews = showCamera && result.waypoints.length <= 80
    result.waypoints.forEach((point, index) => {
      if (index % every !== 0 && !point.takePhoto) return
      const camera = showCameraViews && point.takePhoto ? '<div class="camera-view"></div>' : ''
      L.marker(displayPoint([point.lon, point.lat]), {
        interactive: false,
        zIndexOffset: point.takePhoto ? 100 : 0,
        icon: L.divIcon({
          className: 'route-marker-shell',
          html: `${camera}<span class="route-marker" style="--marker-color:${point.takePhoto ? markerColor(def) : '#64748b'}">${showNumbers ? index + 1 : ''}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(state.renderLayer)
    })
  }, [draft.kind, draft.input, draft.settings.orbitRadius, result, showNumbers, showCamera, drawing])

  useEffect(() => {
    if (!drawing) cursorRef.current = null
    drawOverlayRef.current()
  }, [draft.input, draft.kind, drawing])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    state.editLayer.clearLayers()
    const def = PLANNER_DEFS[0]
    draft.input.forEach((point, index) => {
      const selected = draft.selectedIndex === index
      const marker = L.marker(displayPoint(point), {
        draggable: true,
        zIndexOffset: selected ? 500 : 200,
        icon: L.divIcon({
          className: 'input-marker-shell',
          html: `<span class="input-marker ${selected ? 'is-selected' : ''}" style="--input-color:${def.color}"><span>${index + 1}</span></span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event.originalEvent)
        callbacksRef.current.onSelectInput(index)
        callbacksRef.current.onLocate(point)
      })
      marker.on('dragend', () => {
        const next = marker.getLatLng()
        const moved = [next.lng, next.lat] as LngLat
        const updated = draftRef.current.input.map((item, itemIndex) =>
          itemIndex === index ? (moved as LngLat) : item,
        )
        callbacksRef.current.onSetInput(updated)
        callbacksRef.current.onSelectInput(index)
      })
      marker.bindTooltip(
        `<div class="map-popup"><strong>控制点 ${index + 1}</strong><span>${point[1].toFixed(6)}, ${point[0].toFixed(6)}</span><span>拖动可修改位置</span></div>`,
        { direction: 'top', offset: [0, -16], className: 'route-tooltip' },
      )
      marker.addTo(state.editLayer)
    })
  }, [draft.input, draft.kind, draft.selectedIndex])

  // The waypoint preview ring follows the stepper index and eases the viewport so the
  // selected point is always on screen when stepping through the route.
  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    state.previewLayer.clearLayers()
    const point = previewIndex === null ? undefined : result.waypoints[previewIndex]
    if (!point) return
    L.marker(displayPoint([point.lon, point.lat]), {
      interactive: false,
      zIndexOffset: 900,
      icon: L.divIcon({
        className: 'preview-marker-shell',
        html: `<span class="preview-ring"></span><span class="preview-core" style="--preview-color:${PLANNER_DEFS[0].color}"></span>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      }),
    }).addTo(state.previewLayer)
    if (!state.map.getBounds().contains(displayPoint([point.lon, point.lat]))) {
      state.map.panTo(displayPoint([point.lon, point.lat]), { animate: true, duration: 0.35 })
    }
  }, [previewIndex, result])

  return <div ref={hostRef} className={`map-host ${drawing ? 'is-drawing' : ''}`} aria-label="航线规划地图" />
}
