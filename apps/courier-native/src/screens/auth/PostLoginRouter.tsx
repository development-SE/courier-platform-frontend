// src/screens/auth/PostLoginRouter.tsx
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { fetchMyCourierProfile } from '../../data/profileApi'
import { SCREEN_IDS, ROOT_ROUTES } from '../../constants/screenIds'
import { Screen } from '../../ui/Screen'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.POST_LOGIN_ROUTER>

export function PostLoginRouter({ navigation }: Props) {
  const accessToken = useAuthStore(state => state.accessToken)

  useEffect(() => {
    const check = async () => {
      if (!accessToken) return

      try {
        const result = await fetchMyCourierProfile(accessToken)

        if (!result.ok) {
          // no profile → onboarding
          navigation.replace(SCREEN_IDS.ONBOARDING)
          return
        }

        const courier = result.data
        if (courier.employmentStatus === 'ONBOARDING' || !courier.isVerified) {
          navigation.replace(SCREEN_IDS.PENDING_APPROVAL)
          return
        }

        navigation.replace(ROOT_ROUTES.MAIN_TABS)
      } catch {
        navigation.replace(ROOT_ROUTES.MAIN_TABS)
      }
    }

    void check()
  }, [accessToken, navigation])

  return <Screen title="SwiftDeliver Courier" subtitle="Loading your profile..." />
}