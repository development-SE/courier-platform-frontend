import { useEffect, useState } from 'react'
import * as Location from 'expo-location'

type LocationCoords = {
  latitude: number
  longitude: number
}

export function useUserLocation() {
  const [location, setLocation] = useState<LocationCoords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null

    const startLocationTracking = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          setError('Location permission denied')
          setIsLoading(false)
          return
        }

        // Get initial location
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
        setIsLoading(false)

        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or when moved 10 meters
          },
          (loc) => {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            })
          }
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    startLocationTracking()

    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [])

  return {
    location,
    error,
    isLoading,
    latitude: location?.latitude,
    longitude: location?.longitude,
  }
}
