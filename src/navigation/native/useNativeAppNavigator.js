import { useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { createNativeAppNavigator } from '../appNavigator'

export function useNativeAppNavigator() {
  const navigation = useNavigation()

  return useMemo(
    () => createNativeAppNavigator(navigation),
    [navigation],
  )
}
