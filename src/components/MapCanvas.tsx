import { useEffect, useRef, useState } from 'react'
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
// `datum` says which coordinate system the published tiles are drawn in. Routes are always
// stored as WGS 84, so a GCJ-02 source needs the display conversion and the inverse on every
// click; a WGS 84 source needs no conversion at all.
type TileDatum = 'wgs84' | 'gcj02'
type BaseMapSpec = { base: TileSource; overlay?: TileSource; datum: TileDatum }

// Route values and exported KMZ files are always WGS 84, the datum a drone's GPS reports, so
// a drawn point flies exactly where it was drawn. The street basemap is AMap: its tiles carry
// the label density and contrast Chinese users expect, and the earlier OSM mirror was too
// pale to read. AMap publishes GCJ-02 though - a 570 m north-east shift at this latitude - so
// its tiles are converted for display only (see displayPoint/readPoint). Choosing a WGS 84
// source instead would remove that conversion, but Esri's street and topo tiles return
// "Map data not yet available" over China and the OSM mirror is the faint one being replaced.
//
// CARTO's free raster tiles carry an "API KEY REQUIRED" watermark for anonymous use, so
// nothing here points at basemaps.cartocdn.com.
const AMAP_MAX_ZOOM = 18

// Both basemaps are AMap. Its satellite stack is what the reference screenshot shows: AMap
// imagery with AMap's own annotation layer on top, which is drawn as white text with a dark
// outline and carries the POI / building-number density expected of a Chinese basemap. Because
// imagery and labels come from the same provider they are aligned by construction, and the
// label tiles already have a fully transparent card, so no blend mode or pixel work is needed -
// the previous Esri+OSM stack had to fight an opaque card, which is what made its labels either
// illegible or blocked.
//
// AMap publishes GCJ-02, so both stacks declare that datum and every coordinate is converted
// only for display (see displayPoint/readPoint).
const BASE_LAYERS: Record<BaseMap, BaseMapSpec> = {
  satellite: {
    base: {
      url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      subdomains: ['1', '2', '3', '4'],
      attribution: '影像 © 高德地图',
      maxZoom: AMAP_MAX_ZOOM,
    },
    overlay: {
      url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
      subdomains: ['1', '2', '3', '4'],
      attribution: '注记 © 高德地图',
      maxZoom: AMAP_MAX_ZOOM,
      className: 'label-overlay',
    },
    datum: 'gcj02',
  },
  streets: {
    base: {
      url: 'https://{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
      subdomains: ['wprd01', 'wprd02', 'wprd03', 'wprd04'],
      attribution: '街道 © 高德地图',
      maxZoom: AMAP_MAX_ZOOM,
    },
    datum: 'gcj02',
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
  // AMap's annotation tiles already carry a transparent card, so they are added as-is; the
  // canvas rewriter is only needed for sources that paint an opaque card behind the labels.
  const label = spec.overlay ? createTileLayer(spec.overlay) : null
  base.forEach((layer) => layer.addTo(map))
  base[0].bringToBack()
  return { base, label }
}

// Route values are WGS 84. Display against a GCJ-02 tile needs the forward shift, and a click
// on that tile needs the inverse. Both are identity for the WGS 84 sources, so the satellite
// path is exact and unchanged.
const datumOf = (baseMap: BaseMap): TileDatum => BASE_LAYERS[baseMap].datum

const displayPoint = (point: LngLat, datum: TileDatum = 'wgs84'): L.LatLngTuple => {
  if (datum !== 'gcj02') return [point[1], point[0]]
  const [lon, lat] = wgs84ToGcj02(point[0], point[1])
  return [lat, lon]
}

const readPoint = (latlng: L.LatLng, datum: TileDatum): LngLat => {
  if (datum !== 'gcj02') return [latlng.lng, latlng.lat]
  return gcj02ToWgs84(latlng.lng, latlng.lat)
}

// Datum currently painted on screen. Every overlay resolves through it, so switching the
// basemap converts all of them at once instead of relying on each call site passing it.
let activeDatum: TileDatum = 'wgs84'
const toDisplay = (point: LngLat): L.LatLngTuple => displayPoint(point, activeDatum)

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
  // Index of the control point currently being dragged, or null. While set, the marker
  // layer is not rebuilt and map panning stays disabled.
  const draggingMarkerRef = useRef<number | null>(null)
  const editMarkersRef = useRef<L.Marker[]>([])

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
    // Seed the datum before anything is drawn: the first render below reads it through
    // toDisplay, and the initial base map is whatever the caller asked for.
    activeDatum = datumOf(baseMapRef.current)
    const map = L.map(host, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      closePopupOnClick: false,
    }).setView(toDisplay(initialCenter), 17)
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
      const placed = draftRef.current.input.map(toDisplay)
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
      // The tile datum is what the user actually pointed at; the stored route is WGS 84.
      callbacksRef.current.onAddPoint(readPoint(event.latlng, activeDatum))
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

    const initialCenterPoint = L.latLng(toDisplay(initialCenter))
    const fitSavedRoute = () => {
      map.invalidateSize()
      const points = draftRef.current.input
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points.map(toDisplay)).pad(0.25), { animate: false })
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

  // Switching basemaps can also switch datums (satellite is WGS 84, AMap is GCJ-02). The route
  // is stored as WGS 84 either way, so every overlay has to be re-projected onto the new grid;
  // bumping a counter re-runs the render effects below with the new activeDatum.
  const [datumEpoch, setDatumEpoch] = useState(0)

  useEffect(() => {
    const state = stateRef.current
    if (!state || appliedBaseMapRef.current === baseMap) return
    const previousDatum = appliedBaseMapRef.current ? datumOf(appliedBaseMapRef.current) : 'wgs84'
    // Resolve what physical place is in the middle of the screen BEFORE changing the datum.
    // The two tile sets are drawn 570 m apart at this latitude, so keeping the raw Leaflet
    // centre would jump the view to a different neighbourhood on every basemap switch.
    const physicalCentre = readPoint(state.map.getCenter(), previousDatum)
    const zoom = state.map.getZoom()
    appliedBaseMapRef.current = baseMap
    activeDatum = datumOf(baseMap)
    state.baseLayers.base.forEach((layer) => state.map.removeLayer(layer))
    if (state.baseLayers.label) state.map.removeLayer(state.baseLayers.label)
    state.baseLayers = addBaseLayers(state.map, baseMap)
    if (previousDatum !== activeDatum) {
      state.map.setView(toDisplay(physicalCentre), zoom, { animate: false })
      setDatumEpoch((value) => value + 1)
    }
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
    // While a control point is being dragged the route geometry is about to change anyway,
    // so rebuilding thousands of markers on every intermediate frame only costs pointer
    // smoothness. The drag itself still moves the marker; the route redraws on drop.
    if (draggingMarkerRef.current !== null) return
    state.renderLayer.clearLayers()
    const def = PLANNER_DEFS[0]
    if (drawing) return
    if (result.source.length > 2) {
      if (draft.kind === 'grid' || draft.kind === 'oblique') {
        L.polygon(result.source.map(toDisplay), {
          color: def.color,
          weight: 2,
          fillColor: def.color,
          fillOpacity: 0.13,
          dashArray: '6 6',
          interactive: false,
        }).addTo(state.renderLayer)
      } else {
        L.polyline(result.source.map(toDisplay), {
          color: def.color,
          weight: 2,
          opacity: 0.6,
          dashArray: '4 8',
          interactive: false,
        }).addTo(state.renderLayer)
      }
    }
    if (draft.kind === 'orbit' && draft.input[0]) {
      L.circle(toDisplay(draft.input[0]), {
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
        const latlngs = leg.points.map(toDisplay)
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
    // Markers are DOM elements, so a 4000-waypoint mission would put 4000 nodes in the
    // marker pane and every drag re-layout costs hundreds of milliseconds. Decimating keeps
    // the shape readable: the photo points that actually define the grid are sampled down to
    // a display budget instead of being drawn in full. Previously the decimation was a no-op
    // for orthophoto missions because every capture point has takePhoto set, so the "keep
    // all photos" clause defeated `every` entirely.
    const markerBudget = 400
    const every = Math.max(1, Math.ceil(result.waypoints.length / markerBudget))
    const showCameraViews = showCamera && result.waypoints.length <= 80
    result.waypoints.forEach((point, index) => {
      const isLast = index === result.waypoints.length - 1
      if (index % every !== 0 && !isLast) return
      const camera = showCameraViews && point.takePhoto ? '<div class="camera-view"></div>' : ''
      L.marker(toDisplay([point.lon, point.lat]), {
        interactive: false,
        zIndexOffset: point.takePhoto ? 100 : 0,
        icon: L.divIcon({
          className: 'route-marker-shell',
          html: `${camera}<span class="route-marker" style="--marker-color:${point.takePhoto ? markerColor(def) : '#64748b'}">${showNumbers && result.waypoints.length <= markerBudget ? index + 1 : ''}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(state.renderLayer)
    })
  }, [draft.kind, draft.input, draft.settings.orbitRadius, result, showNumbers, showCamera, drawing, datumEpoch])

  useEffect(() => {
    if (!drawing) cursorRef.current = null
    drawOverlayRef.current()
  }, [draft.input, draft.kind, drawing, datumEpoch])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    // Rebuilding the markers while one of them is being dragged destroys the element under
    // the pointer, which is what made a drag freeze half way: the click that started the
    // gesture selects the point, that selection re-runs this effect, and the marker the user
    // is holding is replaced. The rebuild is deferred until the gesture ends.
    if (draggingMarkerRef.current) return
    state.editLayer.clearLayers()
    const def = PLANNER_DEFS[0]
    draft.input.forEach((point, index) => {
      const selected = draft.selectedIndex === index
      const marker = L.marker(toDisplay(point), {
        draggable: true,
        zIndexOffset: selected ? 500 : 200,
        icon: L.divIcon({
          className: 'input-marker-shell',
          html: `<span class="input-marker ${selected ? 'is-selected' : ''}" style="--input-color:${def.color}"><span>${index + 1}</span></span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })
      // Flagged on dragstart only. Setting it on mousedown would leave it stuck for a plain
      // click (no drag means no dragend to clear it), which would swallow the selection and
      // stop the marker layer from ever rebuilding again.
      marker.on('dragstart', () => {
        draggingMarkerRef.current = index
        state.map.dragging.disable()
      })
      marker.on('click', (event) => {
        // A drag ends with a click on the same element; only treat taps as selection.
        L.DomEvent.stopPropagation(event.originalEvent)
        if (draggingMarkerRef.current !== null) return
        callbacksRef.current.onSelectInput(index)
        callbacksRef.current.onLocate(point)
      })
      marker.on('dragend', () => {
        const next = marker.getLatLng()
        draggingMarkerRef.current = null
        state.map.dragging.enable()
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
    // Keep a map from index to marker so the drag path can redraw the rubber band live.
    editMarkersRef.current = state.editLayer.getLayers() as L.Marker[]
    // Safety net: if a drag is interrupted (window blur, Esc, an unmounting layer) Leaflet may
    // never fire dragend, and a stuck flag would freeze both panning and the marker rebuilds.
    // mouseup is deliberately not used here - it fires before Leaflet's dragend and would
    // clear the flag too early, re-enabling the rebuild mid-gesture.
    const releaseDrag = () => {
      if (draggingMarkerRef.current === null) return
      draggingMarkerRef.current = null
      state.map.dragging.enable()
    }
    window.addEventListener('blur', releaseDrag)
    return () => {
      window.removeEventListener('blur', releaseDrag)
    }
  }, [draft.input, draft.kind, draft.selectedIndex, datumEpoch])

  // The waypoint preview ring follows the stepper index and eases the viewport so the
  // selected point is always on screen when stepping through the route.
  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    state.previewLayer.clearLayers()
    const point = previewIndex === null ? undefined : result.waypoints[previewIndex]
    if (!point) return
    L.marker(toDisplay([point.lon, point.lat]), {
      interactive: false,
      zIndexOffset: 900,
      icon: L.divIcon({
        className: 'preview-marker-shell',
        html: `<span class="preview-ring"></span><span class="preview-core" style="--preview-color:${PLANNER_DEFS[0].color}"></span>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      }),
    }).addTo(state.previewLayer)
    if (!state.map.getBounds().contains(toDisplay([point.lon, point.lat]))) {
      state.map.panTo(toDisplay([point.lon, point.lat]), { animate: true, duration: 0.35 })
    }
  }, [previewIndex, result, datumEpoch])

  return <div ref={hostRef} className={`map-host ${drawing ? 'is-drawing' : ''}`} aria-label="航线规划地图" />
}
