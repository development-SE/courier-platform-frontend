import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Use your PC's IP address — phone must be on same WiFi
const BASE_URL = 'http://10.202.21.193:8080/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json',  'Accept': 'application/json' },
})

// Attach JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
apiClient.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken')
      await AsyncStorage.removeItem('userSession')
    }
    return Promise.reject(error)
  }
)