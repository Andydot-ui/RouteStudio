import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LngLat, PlannerDefinition, PlannerDraft, PlannerResult } from '../lib/types'
import { PLANNER_DEFS } from '../lib/planners'

export type BaseMap = 'satellite' | 'streets' | 'terrain'
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
  onMapReady?: () => void
}

type MapState = {
  map: L.Map
  baseLayer: L.TileLayer
  renderLayer: L.LayerGroup
  editLayer: L.LayerGroup
}

const BASE_LAYERS: Record<BaseMap, { url: string; attribution: string; maxZoom: number }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri and contributors',
    maxZoom: 19,
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri and contributors',
    maxZoom: 19,
  },
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
  onMapReady,
}: MapCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef<MapState | null>(null)
  const callbacksRef = useRef({ onAddPoint, onSetInput, onSelectInput, onLocate, onMapReady })
  const draftRef = useRef(draft)
  const drawingRef = useRef(drawing)

  useEffect(() => {
    callbacksRef.current = { onAddPoint, onSetInput, onSelectInput, onLocate, onMapReady }
    draftRef.current = draft
    drawingRef.current = drawing
  })

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const initialCenter: LngLat = draft.input[0] ?? [113.66425, 34.8298]
    const map = L.map(host, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    }).setView([initialCenter[1], initialCenter[0]], 17)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map)
    const baseLayer = L.tileLayer(BASE_LAYERS[baseMap].url, {
      attribution: BASE_LAYERS[baseMap].attribution,
      maxZoom: BASE_LAYERS[baseMap].maxZoom,
      crossOrigin: true,
    }).addTo(map)
    const renderLayer = L.layerGroup().addTo(map)
    const editLayer = L.layerGroup().addTo(map)
    stateRef.current = { map, baseLayer, renderLayer, editLayer }

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (!drawingRef.current) return
      callbacksRef.current.onAddPoint([event.latlng.lng, event.latlng.lat])
    })
    map.on('dblclick', (event: L.LeafletMouseEvent) => {
      L.DomEvent.preventDefault(event.originalEvent)
    })
    const timeout = window.setTimeout(() => {
      map.invalidateSize()
      callbacksRef.current.onMapReady?.()
    }, 80)

    return () => {
      window.clearTimeout(timeout)
      map.off()
      map.remove()
      stateRef.current = null
    }
  }, [baseMap, draft.input])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    const next = BASE_LAYERS[baseMap]
    const layer = L.tileLayer(next.url, {
      attribution: next.attribution,
      maxZoom: next.maxZoom,
      crossOrigin: true,
    })
    state.map.addLayer(layer)
    state.map.removeLayer(state.baseLayer)
    state.baseLayer = layer
    layer.bringToBack()
  }, [baseMap])

  useEffect(() => {
    const state = stateRef.current
    if (!state || !draft.input.length) return
    const bounds = L.latLngBounds(draft.input.map((point) => [point[1], point[0]] as L.LatLngTuple))
    if (bounds.isValid()) {
      state.map.fitBounds(bounds.pad(0.38), {
        animate: true,
        duration: 0.45,
        maxZoom: draft.kind === 'orbit' ? 17 : 18,
      })
    }
  }, [draft.kind, draft.input])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    state.renderLayer.clearLayers()
    const def = PLANNER_DEFS.find((item) => item.kind === draft.kind) ?? PLANNER_DEFS[0]
    if (result.source.length > 2) {
      if (draft.kind === 'grid' || draft.kind === 'oblique') {
        L.polygon(result.source.map((point) => [point[1], point[0]] as L.LatLngTuple), {
          color: def.color,
          weight: 2,
          fillColor: def.color,
          fillOpacity: 0.13,
          dashArray: '6 6',
          interactive: false,
        }).addTo(state.renderLayer)
      } else {
        L.polyline(result.source.map((point) => [point[1], point[0]] as L.LatLngTuple), {
          color: def.color,
          weight: 2,
          opacity: 0.6,
          dashArray: '4 8',
          interactive: false,
        }).addTo(state.renderLayer)
      }
    }
    if (draft.kind === 'orbit' && draft.input[0]) {
      L.circle([draft.input[0][1], draft.input[0][0]], {
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
        const latlngs = leg.points.map((point) => [point[1], point[0]] as L.LatLngTuple)
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
      const camera = showCameraViews && point.takePhoto
        ? '<div class="camera-view"></div>'
        : ''
      L.marker([point.lat, point.lon], {
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
    state.map.invalidateSize()
  }, [draft.kind, draft.input, draft.settings.orbitRadius, result, showNumbers, showCamera])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    state.editLayer.clearLayers()
    const def = PLANNER_DEFS.find((item) => item.kind === draft.kind) ?? PLANNER_DEFS[0]
    draft.input.forEach((point, index) => {
      const selected = draft.selectedIndex === index
      const marker = L.marker([point[1], point[0]], {
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
        const updated = draftRef.current.input.map((item, itemIndex) =>
          itemIndex === index ? ([next.lng, next.lat] as LngLat) : item,
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

  return <div ref={hostRef} className={`map-host ${drawing ? 'is-drawing' : ''}`} aria-label="航线规划地图" />
}
