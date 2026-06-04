import * as Location from 'expo-location'

export async function requestLocationPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync()
    if (existingStatus === 'granted') {
      return 'granted'
    }

    const { status: askStatus } = await Location.requestForegroundPermissionsAsync()
    if (askStatus === 'granted') {
      return 'granted'
    } else if (askStatus === 'denied') {
      return 'denied'
    }
    return 'undetermined'
  } catch (err) {
    console.error('[Location] Error requesting location permissions:', err)
    return 'denied'
  }
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync()
    if (status !== 'granted') {
      console.warn('[Location] Cannot get location: permission not granted')
      return null
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }
  } catch (err) {
    console.error('[Location] Failed to get current location:', err)
    return null
  }
}
