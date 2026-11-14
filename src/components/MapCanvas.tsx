import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LngLat, PlannerDefinition, PlannerDraft, PlannerResult } from '../lib/types'
import { PLANNER_DEFS } from '../lib/planners'
import { gcj02ToWgs84, wgs84ToGcj02 } from '../lib/coords'

export type BaseMap = 'satellite' | 'streets'
type MapCanvasProps = {
  draft: PlannerDraft
  result: PlannerResult
  baseMap: BaseMap
  showNumbers: boolean
  showCamera: boolean
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
  baseLayers: L.TileLayer[]
  renderLayer: L.LayerGroup
  editLayer: L.LayerGroup
  previewLayer: L.LayerGroup
}

type TileSource = { url: string; attribution: string; maxZoom: number; subdomains?: string[] }
type BaseMapSpec = { base: TileSource; overlay?: TileSource }

// AMap raster tiles are the only base map source: webrd serves the street map,
// webst style=6 serves imagery and webst style=8 the Chinese road and place annotations.
const AMAP_SUBDOMAINS = ['01', '02', '03', '04']
const AMAP_MAX_ZOOM = 18

const BASE_LAYERS: Record<BaseMap, BaseMapSpec> = {
  satellite: {
    base: {
      url: 'https://webst{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      subdomains: AMAP_SUBDOMAINS,
      attribution: '影像 © 高德地图',
      maxZoom: AMAP_MAX_ZOOM,
    },
    overlay: {
      url: 'https://webst{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      subdomains: AMAP_SUBDOMAINS,
      attribution: '注记 © 高德地图',
      maxZoom: AMAP_MAX_ZOOM,
    },
  },
  streets: {
    base: {
      url: 'https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      subdomains: AMAP_SUBDOMAINS,
      attribution: '街道 © 高德地图',
      maxZoom: AMAP_MAX_ZOOM,
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
})

// The imagery and annotation tiles are separate layers, so switching base maps
// always swaps the whole stack instead of a single layer.
const addBaseLayers = (map: L.Map, baseMap: BaseMap) => {
  const spec = BASE_LAYERS[baseMap]
  const layers = [createTileLayer(spec.base)]
  if (spec.overlay) layers.push(createTileLayer(spec.overlay))
  layers.forEach((layer) => layer.addTo(map))
  layers[0].bringToBack()
  return layers
}

// Route data stays WGS 84 everywhere in the app. The tiles are GCJ-02, so geometry is
// converted on the way into Leaflet and map hits are converted back on the way out.
const displayPoint = (point: LngLat): L.LatLngTuple => {
  const [lon, lat] = wgs84ToGcj02(point[0], point[1])
  return [lat, lon]
}

const markerColor = (def: PlannerDefinition) => def.color

export function MapCanvas({
  draft,
  result,
  baseMap,
  showNumbers,
  showCamera,
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
    const initialCenter: LngLat = draftRef.current.input[0] ?? [113.66425, 34.8298]
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
    const editLayer = L.layerGroup().addTo(map)
    const previewLayer = L.layerGroup().addTo(map)
    stateRef.current = { map, baseLayers, renderLayer, editLayer, previewLayer }

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (!drawingRef.current) return
      callbacksRef.current.onAddPoint(gcj02ToWgs84(event.latlng.lng, event.latlng.lat))
    })
    map.on('dblclick', (event: L.LeafletMouseEvent) => {
      L.DomEvent.preventDefault(event.originalEvent)
      if (!drawingRef.current) return
      if (draftRef.current.input.length >= 3) callbacksRef.current.onFinishPolygon()
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
    state.baseLayers.forEach((layer) => state.map.removeLayer(layer))
    state.baseLayers = addBaseLayers(state.map, baseMap)
  }, [baseMap])

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
  }, [draft.kind, draft.input, draft.settings.orbitRadius, result, showNumbers, showCamera])

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
        const moved = gcj02ToWgs84(next.lng, next.lat)
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
