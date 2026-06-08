import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { locationsApi } from '../../api/locations.api'
import { routesApi } from '../../api/routes.api'
import './mapPage.css'

const DEFAULT_CENTER = [43.238, 76.889]
const DEFAULT_ZOOM = 12

const TRANSPORT_LABEL = {
  CAR: 'Авто',
  BIKE: 'Велосипед',
  SCOOTER: 'Скутер',
  FOOT: 'Пешком',
  VAN: 'Фургон',
}

const decodePolyline = (encoded) => {
  const coords = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let shift = 0, b, r = 0
    do { b = encoded.charCodeAt(index++) - 63; r |= (b & 31) << shift; shift += 5 } while (b >= 32)
    lat += (r & 1) ? ~(r >> 1) : (r >> 1)
    shift = 0; r = 0
    do { b = encoded.charCodeAt(index++) - 63; r |= (b & 31) << shift; shift += 5 } while (b >= 32)
    lng += (r & 1) ? ~(r >> 1) : (r >> 1)
    coords.push([lat / 1e5, lng / 1e5])
  }
  return coords
}

const makeCourierIcon = (online, initials) => L.divIcon({
  className: '',
  html: `<div class="mp-courier-pin ${online ? 'mp-online' : 'mp-offline'}">${initials}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
})

const makeDestIcon = () => L.divIcon({
  className: '',
  html: `<div class="mp-dest-pin"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

const fmtDist = (m) => {
  if (!m) return '—'
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${m} м`
}

const fmtTime = (s) => {
  if (!s) return '—'
  const m = Math.round(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${m} мин`
}

export const MapPage = () => {
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [destPoint, setDestPoint] = useState(null)
  const [routeCoords, setRouteCoords] = useState([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeError, setRouteError] = useState('')
  const intervalRef = useRef(null)

  const loadCouriers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await locationsApi.findNearby({
        lat: DEFAULT_CENTER[0],
        lng: DEFAULT_CENTER[1],
        radiusMeters: 50000,
        limit: 100,
      })
      setCouriers(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message || 'Не удалось загрузить позиции курьеров')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCouriers()
    intervalRef.current = setInterval(loadCouriers, 15000)
    return () => clearInterval(intervalRef.current)
  }, [loadCouriers])

  const calcRoute = useCallback(async (courier, lat, lng) => {
    if (!courier || courier.latitude == null || courier.longitude == null) return
    setRouteLoading(true)
    setRouteError('')
    try {
      const res = await routesApi.calculate({
        originLat: courier.latitude,
        originLng: courier.longitude,
        destLat: lat,
        destLng: lng,
      })
      setRouteInfo({ distanceMeters: res.distanceMeters, durationSeconds: res.durationSeconds })
      if (res.encodedPolyline) setRouteCoords(decodePolyline(res.encodedPolyline))
    } catch (err) {
      setRouteError(err.message || 'Ошибка расчёта маршрута')
    } finally {
      setRouteLoading(false)
    }
  }, [])

  const handleMapClick = useCallback((lat, lng) => {
    setDestPoint({ lat, lng })
    setRouteCoords([])
    setRouteInfo(null)
    setRouteError('')
    if (selected) calcRoute(selected, lat, lng)
  }, [selected, calcRoute])

  const handleSelectCourier = (courier) => {
    const isAlreadySelected = selected?.courierId === courier.courierId
    setSelected(isAlreadySelected ? null : courier)
    setRouteCoords([])
    setRouteInfo(null)
    setDestPoint(null)
    setRouteError('')
  }

  const clearRoute = () => {
    setRouteCoords([])
    setRouteInfo(null)
    setDestPoint(null)
    setRouteError('')
  }

  const onlineCouriers = couriers.filter(c => c.isOnline)

  return (
    <div className="map-page">
      <div className="map-sidebar">
        <div className="map-sidebar-header">
          <span className="map-sidebar-title">Курьеры</span>
          <span className="map-online-badge">{onlineCouriers.length} онлайн</span>
        </div>

        {error && <div className="map-sidebar-error">{error}</div>}

        {loading && couriers.length === 0 && (
          <div className="map-sidebar-msg">Загрузка...</div>
        )}
        {!loading && !error && couriers.length === 0 && (
          <div className="map-sidebar-msg">Нет курьеров в зоне 50 км</div>
        )}

        <div className="map-courier-list">
          {couriers.map(c => {
            const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
              || `Курьер ${String(c.courierId || '').slice(0, 6)}`
            return (
              <div
                key={c.courierId}
                className={`map-courier-item${selected?.courierId === c.courierId ? ' selected' : ''}`}
                onClick={() => handleSelectCourier(c)}
              >
                <div className={`map-courier-dot${c.isOnline ? ' mp-dot-online' : ''}`} />
                <div className="map-courier-info">
                  <div className="map-courier-name">{name}</div>
                  <div className="map-courier-meta">
                    {TRANSPORT_LABEL[c.transportType] || c.transportType || '—'}
                    {' · '}
                    {c.isOnline ? 'Онлайн' : 'Оффлайн'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selected && (
          <div className="map-route-panel">
            <div className="map-route-panel-title">
              Маршрут от курьера
            </div>
            {!destPoint && !routeLoading && !routeInfo && (
              <div className="map-route-hint">
                Кликните на карту, чтобы задать точку назначения
              </div>
            )}
            {routeLoading && (
              <div className="map-route-hint">Рассчитываю маршрут...</div>
            )}
            {routeError && <div className="map-route-error">{routeError}</div>}
            {routeInfo && !routeLoading && (
              <>
                <div className="map-route-stats">
                  <div className="map-route-stat">
                    <span className="mp-stat-label">Расстояние</span>
                    <span className="mp-stat-value">{fmtDist(routeInfo.distanceMeters)}</span>
                  </div>
                  <div className="map-route-stat">
                    <span className="mp-stat-label">Время</span>
                    <span className="mp-stat-value">{fmtTime(routeInfo.durationSeconds)}</span>
                  </div>
                </div>
                <button type="button" className="map-route-clear" onClick={clearRoute}>
                  Сбросить маршрут
                </button>
              </>
            )}
          </div>
        )}

        <div className="map-sidebar-footer">
          {loading && <span className="map-refresh-text">Обновление...</span>}
          <span className="map-total-text">{couriers.length} курьеров всего</span>
        </div>
      </div>

      <div className="map-container-wrap">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="map-leaflet"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onMapClick={handleMapClick} />

          {couriers.map(c => {
            if (c.latitude == null || c.longitude == null) return null
            const firstName = c.firstName || 'K'
            const lastName = c.lastName || ''
            const initials = `${firstName.charAt(0)}${lastName.charAt(0) || ''}`.toUpperCase()
            const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Курьер'
            return (
              <Marker
                key={c.courierId}
                position={[c.latitude, c.longitude]}
                icon={makeCourierIcon(c.isOnline, initials)}
                eventHandlers={{ click: () => handleSelectCourier(c) }}
              >
                <Popup>
                  <div className="mp-popup">
                    <strong>{name}</strong>
                    <span>{TRANSPORT_LABEL[c.transportType] || c.transportType}</span>
                    <span className={c.isOnline ? 'mp-popup-online' : 'mp-popup-offline'}>
                      {c.isOnline ? 'Онлайн' : 'Оффлайн'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {destPoint && (
            <Marker
              position={[destPoint.lat, destPoint.lng]}
              icon={makeDestIcon()}
            />
          )}

          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              color="#3b82f6"
              weight={5}
              opacity={0.85}
            />
          )}
        </MapContainer>
      </div>
    </div>
  )
}
