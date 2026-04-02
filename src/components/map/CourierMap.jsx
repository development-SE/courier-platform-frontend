import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, LocateFixed, Minus, Plus } from 'lucide-react'
import { getCourierPosition } from '../../services/courierDataService'
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_STYLE_URL } from '../../constants/map.config'
import './CourierMap.css'

const COURIER_POSITION = getCourierPosition()

function createCourierMarkerElement() {
  const marker = document.createElement('div')
  marker.className = 'courier-map__marker'
  return marker
}

function MapFallback() {
  return (
    <div className="courier-map__fallback" aria-label="Map fallback">
      <svg className="courier-map__fallback-svg" viewBox="0 0 430 560" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <rect width="430" height="560" fill="#12121A" />
        <defs>
          <pattern id="courier-grid-sm" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
          <pattern id="courier-grid-lg" width="90" height="90" patternUnits="userSpaceOnUse">
            <path d="M 90 0 L 0 0 0 90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="430" height="560" fill="url(#courier-grid-sm)" />
        <rect width="430" height="560" fill="url(#courier-grid-lg)" />
        <rect x="0" y="142" width="430" height="18" fill="#1D1D2E" />
        <rect x="0" y="265" width="430" height="15" fill="#1D1D2E" />
        <rect x="0" y="394" width="430" height="16" fill="#1D1D2E" />
        <rect x="150" y="0" width="16" height="560" fill="#1D1D2E" />
        <rect x="278" y="0" width="12" height="560" fill="#1D1D2E" />
        <g transform="translate(215, 265)">
          <circle cx="0" cy="0" r="22" fill="rgba(205,94,61,0.15)" />
          <circle cx="0" cy="0" r="14" fill="rgba(205,94,61,0.25)" />
          <polygon points="0,-14 10,8 0,2 -10,8" fill="#CD5E3D" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      </svg>
      <div className="courier-map__fallback-notice">
        <span>Карта · демо-режим</span>
        <span>MapLibre style недоступен, используем заглушку</span>
      </div>
    </div>
  )
}

function MapControls({ onZoomIn, onZoomOut, onLocate }) {
  return (
    <div className="courier-map__controls">
      <button type="button" className="courier-map__control-btn" onClick={onZoomIn} aria-label="Приблизить">
        <Plus size={18} />
      </button>
      <button type="button" className="courier-map__control-btn" onClick={onZoomOut} aria-label="Отдалить">
        <Minus size={18} />
      </button>
      <button type="button" className="courier-map__control-btn" onClick={onLocate} aria-label="Моё положение">
        <LocateFixed size={18} />
      </button>
      <button type="button" className="courier-map__control-btn courier-map__control-btn--layers" aria-label="Слои (скоро)">
        <Layers size={18} />
      </button>
    </div>
  )
}

export default function CourierMap({ className = '' }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    let isMounted = true
    let mapLoaded = false
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      attributionControl: false,
    })

    const loadTimeout = window.setTimeout(() => {
      if (isMounted && !mapLoaded) {
        setHasError(true)
      }
    }, 7000)

    map.on('load', () => {
      mapLoaded = true
      if (!isMounted) return

      markerRef.current = new maplibregl.Marker({
        element: createCourierMarkerElement(),
        anchor: 'bottom',
      })
        .setLngLat(COURIER_POSITION)
        .addTo(map)

      mapRef.current = map
      setIsReady(true)
      setHasError(false)
      window.clearTimeout(loadTimeout)
    })

    map.on('error', () => {
      if (!isMounted) return
      setHasError(true)
      window.clearTimeout(loadTimeout)
    })

    return () => {
      isMounted = false
      window.clearTimeout(loadTimeout)
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 220 })
  }, [])

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 220 })
  }, [])

  const handleLocate = useCallback(() => {
    mapRef.current?.flyTo({
      center: COURIER_POSITION,
      zoom: 14,
      duration: 800,
      essential: true,
    })
  }, [])

  const showFallback = hasError || !isReady

  return (
    <div className={`courier-map ${className}`.trim()}>
      <div ref={mapContainerRef} className="courier-map__viewport" />
      {showFallback && <MapFallback />}
      <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onLocate={handleLocate} />
    </div>
  )
}
