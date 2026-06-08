import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()

const unwrap = (response) => response?.data ?? response

export const devicesApi = {
  async register({ token: deviceToken, platform, deviceId }) {
    const response = await api.post('/notifications/devices', {
      token: deviceToken,
      platform,
      deviceId,
    }, token())
    return unwrap(response)
  },

  async revoke(deviceId) {
    const response = await api.delete(`/notifications/devices/${deviceId}`, token())
    return unwrap(response)
  },

  async setEnabled(deviceId, enabled) {
    const response = await api.patch(`/notifications/devices/${deviceId}/enabled`, {
      enabled,
    }, token())
    return unwrap(response)
  },
}
