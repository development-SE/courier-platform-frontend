import {
  userActiveOrdersSeed,
  userCategoriesSeed,
  userNearbyStoresSeed,
  userPopularStoresSeed,
} from '../data/userDashboard.seed'

const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 120 + 80))

export const userDashboardApi = {
  async getDashboardData() {
    await delay()
    return {
      activeOrders: userActiveOrdersSeed,
      categories: userCategoriesSeed,
      popularStores: userPopularStoresSeed,
      nearbyStores: userNearbyStoresSeed,
    }
  },
}
