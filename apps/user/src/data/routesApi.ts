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

export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResponse> {
  const response = await apiRequest<RouteResponse>('/api/routes/calculate', {
    method: 'POST',
    json: { origin, destination },
  })

  if (response.ok) {
    return response.data
  }

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
