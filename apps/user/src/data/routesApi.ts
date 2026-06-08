import polyline from '@mapbox/polyline'
import { apiRequest } from './apiClient'

export type RoutePoint = {
  latitude: number
  longitude: number
}

export type RouteResponse = {
  distanceMeters: number
  durationSeconds: number
  encodedPolyline: string
}

const OSRM = 'https://router.project-osrm.org/route/v1/driving'

async function fetchOsrmRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResponse | null> {
  try {
    const url = `${OSRM}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.routes?.length) return null
    const route = data.routes[0]
    return {
      encodedPolyline: route.geometry,
      distanceMeters: Math.round(route.legs[0].distance),
      durationSeconds: Math.round(route.legs[0].duration),
    }
  } catch {
    return null
  }
}

export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResponse> {
  // Try backend first
  const backendRes = await apiRequest<RouteResponse>('/api/routes/calculate', {
    method: 'POST',
    json: { origin, destination },
  })
  if (backendRes.ok) return backendRes.data

  // Fall back to OSRM (free, no API key)
  const osrmRes = await fetchOsrmRoute(origin, destination)
  if (osrmRes) return osrmRes

  return buildFallbackRoute(origin, destination)
}

export function decodeRoutePolyline(encodedPolyline: string): RoutePoint[] {
  return polyline.decode(encodedPolyline).map(([latitude, longitude]) => ({
    latitude,
    longitude,
  }))
}

function buildFallbackRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): RouteResponse {
  const midpoint = {
    lat: (origin.lat + destination.lat) / 2 - (destination.lng - origin.lng) * 0.18,
    lng: (origin.lng + destination.lng) / 2 + (destination.lat - origin.lat) * 0.18,
  }

  const encodedPolyline = polyline.encode([
    [origin.lat, origin.lng],
    [midpoint.lat, midpoint.lng],
    [destination.lat, destination.lng],
  ])

  return {
    distanceMeters: 4200,
    durationSeconds: 50 * 60,
    encodedPolyline,
  }
}
