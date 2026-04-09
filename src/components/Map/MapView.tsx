'use client'
import React from 'react'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Utensils, Palette, BedDouble, Map as MapIcon, Bus, Store } from 'lucide-react'
import { MAPBOX_TOKEN, MAPBOX_STYLE, CDMX_CENTER, DEFAULT_ZOOM } from '@/lib/mapbox'


import type { Negocio, CategoriaSlug } from '@/types/negocio'


export const CATEGORIA_COLOR: Record<CategoriaSlug, string> = {
  comida:     '#C5A044',
  artesanias: '#D85A30',
  hospedaje:  '#534AB7',
  tours:      '#0D7C66',
  transporte: '#185FA5',
  otro:       '#1A9E78',
}

// Lucide React components — para tarjetas y sheets
export const CATEGORIA_LUCIDE: Record<CategoriaSlug, React.ComponentType<{ size?: number; color?: string }>> = {
  comida:     Utensils,
  artesanias: Palette,
  hospedaje:  BedDouble,
  tours:      MapIcon,
  transporte: Bus,
  otro:       Store,
}

// SVG paths de Lucide (24x24 viewBox) para los pines de Mapbox
const PIN_PATHS: Record<CategoriaSlug, string> = {
  comida:     `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3M21 15v7"/>`,
  artesanias: `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13A1.64 1.64 0 0114.42 16h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>`,
  hospedaje:  `<path d="M2 20v-8a2 2 0 012-2h16a2 2 0 012 2v8"/><path d="M4 10V6a2 2 0 012-2h12a2 2 0 012 2v4"/><path d="M12 10v4"/><path d="M2 18h20"/>`,
  tours:      `<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>`,
  transporte: `<path d="M8 6v6M15 6v6M2 12h19.6M18 18h3c0 0 .8-2.8.8-4 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 00-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>`,
  otro:       `<path d="M2 7l4.41-4.41A2 2 0 017.83 2h8.34a2 2 0 011.42.59L22 7M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M2.5 7h19M15 22v-4a3 3 0 00-6 0v4"/>`,
}

function pinSvg(color: string, paths: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="13" r="6" fill="#fff" opacity="0.95"/>
    <g transform="translate(9,8) scale(0.4167)" stroke="white" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      ${paths}
    </g>
  </svg>`
}

interface MarkerEntry {
  marker: mapboxgl.Marker
  pin:    HTMLElement
}

interface Props {
  negocios:  Negocio[]
  onSelect:  (negocio: Negocio) => void
  onHover?:  (negocio: Negocio | null, rect: DOMRect | null) => void
  selected?: Negocio | null
  mapStyle?: string
}

export interface MapViewHandle {
  drawRoute: (geometry: GeoJSON.LineString, bounds?: [[number, number], [number, number]]) => void
  clearRoute: () => void
  triggerGeolocate: () => void
  flyToUser: (coords: [number, number]) => void
}

export const MapView = forwardRef<MapViewHandle, Props>(function MapView(
  { negocios, onSelect, onHover, selected, mapStyle },
  ref,
) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<mapboxgl.Map | null>(null)
  const routeReadyRef    = useRef(false)
  const appliedStyleRef  = useRef<string>(MAPBOX_STYLE)
  const pendingRouteRef  = useRef<{ geometry: GeoJSON.LineString; bounds?: [[number, number], [number, number]] } | null>(null)
  // Map estable id → { marker, pin } — nunca se limpia completo
  const entriesRef     = useRef<Map<string, MarkerEntry>>(new Map())
  // Ref para onSelect: evita stale closure sin recrear markers
  const onSelectRef    = useRef(onSelect)
  // Ref para onHover: igual, evita stale closure
  const onHoverRef     = useRef(onHover)
  // Ref para selected id: accesible desde handlers sin closures
  const selectedIdRef  = useRef<string | undefined>(selected?.id)
  const geolocateRef   = useRef<mapboxgl.GeolocateControl | null>(null)

  // Mantener refs siempre frescos
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onHoverRef.current  = onHover  }, [onHover])

  // Exponer drawRoute y clearRoute al padre
  useImperativeHandle(ref, () => ({
    drawRoute(geometry, bounds) {
      const map = mapRef.current
      if (!map) return
      if (!routeReadyRef.current) {
        // El estilo aún no cargó — guardar para ejecutar en style.load
        pendingRouteRef.current = { geometry, bounds }
        return
      }
      const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined
      if (!src) return
      src.setData({ type: 'Feature', properties: {}, geometry })
      if (bounds) {
        map.fitBounds(bounds, { padding: { top: 80, bottom: 300, left: 40, right: 40 }, duration: 1000 })
      }
    },
    clearRoute() {
      const map = mapRef.current
      if (!map || !routeReadyRef.current) return
      const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined
      if (src) src.setData({ type: 'FeatureCollection', features: [] })
    },
    triggerGeolocate() {
      geolocateRef.current?.trigger()
    },
    flyToUser(coords) {
      const map = mapRef.current
      if (!map) return
      map.flyTo({ center: coords, zoom: 16, duration: 1200 })
      map.once('moveend', () => { geolocateRef.current?.trigger() })
    },
  }))

  // ── Efecto 1: inicializar mapa (una sola vez) ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAPBOX_STYLE,
      center:    CDMX_CENTER,
      zoom:      DEFAULT_ZOOM,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    })
    geolocateRef.current = geolocate
    map.addControl(geolocate, 'top-right')

// Agregar source y layers de ruta en cada carga de estilo (inicial + setStyle)
    map.on('style.load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Sombra de la línea
      map.addLayer({
        id: 'route-line-shadow',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#000', 'line-width': 9, 'line-opacity': 0.12, 'line-blur': 3 },
      })
      // Línea principal
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#0D7C66', 'line-width': 5, 'line-opacity': 0.9 },
      })
      routeReadyRef.current = true
      // Ejecutar ruta que llegó antes de que el estilo cargara
      if (pendingRouteRef.current) {
        const { geometry, bounds } = pendingRouteRef.current
        pendingRouteRef.current = null
        const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined
        if (src) {
          src.setData({ type: 'Feature', properties: {}, geometry })
          if (bounds) map.fitBounds(bounds, { padding: { top: 80, bottom: 300, left: 40, right: 40 }, duration: 1000 })
        }
      }
    })

    mapRef.current = map
    return () => {
      routeReadyRef.current = false
      geolocateRef.current = null
      entriesRef.current.forEach(({ marker }) => marker.remove())
      entriesRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Efecto 1b: cambiar estilo del mapa (solo si cambia realmente) ──────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapStyle || mapStyle === appliedStyleRef.current) return
    appliedStyleRef.current = mapStyle
    routeReadyRef.current = false
    map.setStyle(mapStyle)
  }, [mapStyle])

  // ── Efecto 2: sincronizar markers con negocios (solo crea/elimina) ────────
  // NO depende de `selected` ni `onSelect` → no se dispara al seleccionar
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const incomingIds = new Set(negocios.map(n => n.id))

    // Eliminar markers de negocios que ya no existen
    entriesRef.current.forEach(({ marker }, id) => {
      if (!incomingIds.has(id)) {
        marker.remove()
        entriesRef.current.delete(id)
      }
    })

    // Crear markers solo para negocios nuevos
    negocios.forEach(negocio => {
      if (!negocio.lat || !negocio.lng)      return
      if (entriesRef.current.has(negocio.id)) return  // ya existe, no recrear

      const color = CATEGORIA_COLOR[negocio.categoria] ?? '#1A9E78'
      const paths = PIN_PATHS[negocio.categoria] ?? PIN_PATHS.otro

      // Wrapper de hit-area: tamaño fijo, sin transform → sin hover-jitter
      const el = document.createElement('div')
      el.style.cssText = 'width:36px;height:44px;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;'

      // Pin visual: escala solo en hover/selección, SIN transition permanente
      const pin = document.createElement('div')
      pin.style.cssText = 'pointer-events:none;transform-origin:bottom center;transform:scale(1);filter:drop-shadow(0 2px 4px rgba(0,0,0,.25));'
      pin.innerHTML = pinSvg(color, paths)
      el.appendChild(pin)

      el.addEventListener('mouseenter', () => {
        if (selectedIdRef.current === negocio.id) return
        pin.style.transition = 'transform .15s, filter .15s'
        pin.style.transform  = 'scale(1.2)'
        pin.style.filter     = 'drop-shadow(0 3px 8px rgba(0,0,0,.3))'
        onHoverRef.current?.(negocio, el.getBoundingClientRect())
      })
      el.addEventListener('mouseleave', () => {
        if (selectedIdRef.current === negocio.id) return
        pin.style.transform = 'scale(1)'
        pin.style.filter    = 'drop-shadow(0 2px 4px rgba(0,0,0,.25))'
        // Eliminar transition después de la animación para no interferir con zoom
        setTimeout(() => { pin.style.transition = '' }, 150)
        onHoverRef.current?.(null, null)
      })
      // Usar ref para evitar stale closure sobre onSelect
      el.addEventListener('click', () => onSelectRef.current(negocio))

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([negocio.lng, negocio.lat])
        .addTo(map)

entriesRef.current.set(negocio.id, { marker, pin })
    })
  }, [negocios])  // ← solo negocios; selected y onSelect NO están aquí

  // ── Efecto 3: actualizar estilo visual del pin seleccionado ───────────────
  // Muta el DOM directamente — cero recreación de markers
  useEffect(() => {
    const prevId = selectedIdRef.current
    const nextId = selected?.id

    // Desseleccionar anterior
    if (prevId && prevId !== nextId) {
      const prev = entriesRef.current.get(prevId)
      if (prev) {
        prev.pin.style.transform = 'scale(1)'
        prev.pin.style.filter    = 'drop-shadow(0 2px 4px rgba(0,0,0,.25))'
      }
    }

    // Seleccionar nuevo
    if (nextId) {
      const next = entriesRef.current.get(nextId)
      if (next) {
        next.pin.style.transform = 'scale(1.35)'
        next.pin.style.filter    = 'drop-shadow(0 4px 10px rgba(0,0,0,.4))'
      }
    }

    selectedIdRef.current = nextId

    // Volar a la ubicación seleccionada
    const map = mapRef.current
    if (map && selected?.lat && selected?.lng) {
      map.flyTo({ center: [selected.lng, selected.lat], zoom: 16, duration: 800 })
    }
  }, [selected])

  return (
    <>
      {/* Controles Mapbox — Glass Jade */}
      <style>{`
        .mapboxgl-ctrl-top-right {
          margin-top: 155px;
          margin-right: 10px;
        }

        /* Contenedor del grupo (zoom + brújula / geolocate) */
        .mapboxgl-ctrl-group {
          background: rgba(255,255,255,0.92) !important;
          backdrop-filter: blur(20px) saturate(120%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(120%) !important;
          border: 1px solid rgba(255,255,255,0.7) !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 20px rgba(13,124,102,0.14), 0 1px 4px rgba(0,0,0,0.07) !important;
          overflow: hidden !important;
        }

        /* Botones individuales */
        .mapboxgl-ctrl-group button {
          width: 38px !important;
          height: 38px !important;
          background: transparent !important;
          transition: background 0.15s ease !important;
        }

        .mapboxgl-ctrl-group button:hover {
          background: rgba(13,124,102,0.09) !important;
        }

        /* Separador entre botones */
        .mapboxgl-ctrl-group button + button {
          border-top: 1px solid rgba(13,124,102,0.1) !important;
        }

        /* Iconos — tinte jade */
        .mapboxgl-ctrl-zoom-in  .mapboxgl-ctrl-icon,
        .mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon,
        .mapboxgl-ctrl-compass  .mapboxgl-ctrl-icon {
          filter: invert(30%) sepia(60%) saturate(600%) hue-rotate(128deg) brightness(85%) !important;
        }

        .mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon {
          filter: invert(30%) sepia(60%) saturate(600%) hue-rotate(128deg) brightness(85%) !important;
        }

        /* Geolocate activo → jade sólido */
        .mapboxgl-ctrl-geolocate-active .mapboxgl-ctrl-icon,
        .mapboxgl-ctrl-geolocate-background .mapboxgl-ctrl-icon {
          filter: invert(42%) sepia(90%) saturate(450%) hue-rotate(128deg) brightness(80%) !important;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  )
})
