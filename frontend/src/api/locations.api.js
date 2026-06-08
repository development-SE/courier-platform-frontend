import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()

const unwrap = (response) => response?.data ?? response

export const locationsApi = {
  async updateMyLocation({ latitude, longitude, isOnline }) {
    const response = await api.put('/logistics/couriers/me/location', {
      latitude,
      longitude,
      isOnline,
    }, token())
    return unwrap(response)
  },

  async getCourierLocation(courierId) {
    const response = await api.get(`/logistics/couriers/${courierId}/location`, token())
    return unwrap(response)
  },

  async setOnlineStatus(isOnline) {
    const response = await api.patch('/logistics/couriers/me/online', {
      isOnline,
    }, token())
    return unwrap(response)
  },

  async findNearby({ lat, lng, radiusMeters = 5000, limit = 20 }) {
    const params = new URLSearchParams()
    params.append('lat', lat)
    params.append('lng', lng)
    params.append('radiusMeters', radiusMeters)
    params.append('limit', limit)

    const response = await api.get(`/logistics/couriers/nearby?${params.toString()}`, token())
    return unwrap(response)
  },
}
