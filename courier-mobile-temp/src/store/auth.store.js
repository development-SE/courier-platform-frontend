import AsyncStorage from '@react-native-async-storage/async-storage'

export const authStore = {
  saveSession: async (accessToken, refreshToken, role) => {
    await AsyncStorage.setItem('accessToken', accessToken)
    await AsyncStorage.setItem('refreshToken', refreshToken)
    await AsyncStorage.setItem('userRole', role)
  },

  getToken: async () => {
    return await AsyncStorage.getItem('accessToken')
  },

  getRole: async () => {
    return await AsyncStorage.getItem('userRole')
  },

  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('accessToken')
    return !!token
  },

  clearSession: async () => {
    await AsyncStorage.removeItem('accessToken')
    await AsyncStorage.removeItem('refreshToken')
    await AsyncStorage.removeItem('userRole')
  },
}