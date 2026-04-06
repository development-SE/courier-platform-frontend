import { useMemo } from 'react'
import { getCourierProfile } from '../../../services/courierDataService'
import { getCourierInitials } from '@core/domain/profile/model'

export function useNativeProfileViewModel() {
  return useMemo(() => {
    const courier = getCourierProfile()

    return {
      courier,
      initials: getCourierInitials(courier),
      ratingLabel: `${courier.rating ?? 0} · Курьер`,
    }
  }, [])
}
