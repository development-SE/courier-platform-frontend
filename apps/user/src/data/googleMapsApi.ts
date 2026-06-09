const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export function isGoogleMapsConfigured(): boolean {
  return typeof GOOGLE_MAPS_API_KEY === 'string' && GOOGLE_MAPS_API_KEY.length > 0
}

export interface GeocodeResult {
  latitude: number
  longitude: number
}

export interface AutocompleteSuggestion {
  place_id: string
  display_name: string
  main_text?: string
  secondary_text?: string
}

/**
 * Geocodes an address string using Google Geocoding API.
 * Returns { latitude, longitude } or null.
 */
export async function googleGeocode(address: string): Promise<GeocodeResult | null> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps API Key is not configured')
    return null
  }

  const normalized = address.trim()
  if (!normalized) return null

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      normalized
    )}&key=${GOOGLE_MAPS_API_KEY}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        latitude: location.lat,
        longitude: location.lng,
      }
    }
  } catch (error) {
    console.error('Google Geocoding error:', error)
  }
  return null
}

/**
 * Reverse geocodes coordinates to a street address using Google Geocoding API.
 * Returns { street: string, city: string } or null.
 */
export async function googleReverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ street: string; city: string } | null> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps API Key is not configured')
    return null
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=ru`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Skip plus_codes to get a real readable street address
      const result = data.results.find(
        (r: any) =>
          !r.types.includes('plus_code') &&
          !r.formatted_address.includes('+')
      ) || data.results[0]

      let streetName = ''
      let streetNumber = ''
      let routeName = ''
      let cityName = ''

      // Parse address components
      if (result.address_components) {
        for (const component of result.address_components) {
          if (component.types.includes('street_number')) {
            streetNumber = component.long_name
          }
          if (component.types.includes('route')) {
            routeName = component.long_name
          }
          if (component.types.includes('locality')) {
            cityName = component.long_name
          }
        }
      }

      streetName = [routeName, streetNumber].filter(Boolean).join(' ')
      if (!streetName || streetName.includes('+')) {
        // Fallback to first non-pluscode component of the formatted address
        const parts = result.formatted_address.split(',')
        const cleanPart = parts.find((p: string) => !p.includes('+'))?.trim() || parts[0]?.trim() || ''
        streetName = cleanPart
      }

      return {
        street: streetName,
        city: cityName,
      }
    }
  } catch (error) {
    console.error('Google Reverse Geocoding error:', error)
  }
  return null
}

/**
 * Fetches suggestions from Google Places Autocomplete API.
 * Biased towards Astana/Almaty in Kazakhstan.
 */
export async function googlePlacesAutocomplete(
  text: string
): Promise<AutocompleteSuggestion[]> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps API Key is not configured')
    return []
  }

  const query = text.trim()
  if (!query) return []

  try {
    // Astana center bias: 51.1693, 71.4490, radius 25km
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&key=${GOOGLE_MAPS_API_KEY}&components=country:kz&language=ru&location=51.1693,71.4490&radius=25000&strictbounds=false`
    
    const response = await fetch(url)
    if (!response.ok) return []
    const data = await response.json()
    if (data.status === 'OK' && data.predictions) {
      return data.predictions.map((p: any) => ({
        place_id: p.place_id,
        display_name: p.description,
        main_text: p.structured_formatting?.main_text,
        secondary_text: p.structured_formatting?.secondary_text,
      }))
    }
  } catch (error) {
    console.error('Google Places Autocomplete error:', error)
  }
  return []
}

/**
 * Fetches location coordinates (geometry) for a given placeId from Place Details API.
 */
export async function googlePlaceDetails(placeId: string): Promise<GeocodeResult | null> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps API Key is not configured')
    return null
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    if (data.status === 'OK' && data.result?.geometry?.location) {
      const loc = data.result.geometry.location
      return {
        latitude: loc.lat,
        longitude: loc.lng,
      }
    }
  } catch (error) {
    console.error('Google Place Details error:', error)
  }
  return null
}
