const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

export async function geocodeAddress(street, house, city = 'Almaty') {
  if (!street) return null
  const q = [street, house, city, 'Kazakhstan'].filter(Boolean).join(', ')
  try {
    const res = await fetch(
      `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'ru,en' } },
    )
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
