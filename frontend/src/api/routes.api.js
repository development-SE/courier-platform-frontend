const GATEWAY = 'http://localhost:8080'

export const routesApi = {
  async calculate({ originLat, originLng, destLat, destLng }) {
    const res = await fetch(`${GATEWAY}/api/routes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
      }),
    })
    if (!res.ok) throw new Error('Ошибка расчёта маршрута')
    return res.json()
  },
}
