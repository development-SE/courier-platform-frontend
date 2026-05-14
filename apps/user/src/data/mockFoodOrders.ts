import type { UserOrder, UserOrderAddress, UserOrderItem } from './ordersApi'

export type MockFoodCheckoutItem = {
  id: string
  name: string
  price: number
  quantity: number
}

const PICKUP_ADDRESS: UserOrderAddress = {
  type: 'COMPANY',
  city: 'Almaty',
  street: 'Abylai Khan Ave',
  house: '121',
  latitude: 43.2389,
  longitude: 76.8897,
}

const DELIVERY_ADDRESS: UserOrderAddress = {
  type: 'USER',
  city: 'Almaty',
  street: 'Nazarbayev Ave',
  house: '223',
  apartment: '4B',
  latitude: 43.2451,
  longitude: 76.9123,
}

function createOrderId() {
  return `food-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function toOrderItems(items: MockFoodCheckoutItem[]): UserOrderItem[] {
  return items.map(item => ({
    itemId: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }))
}

export function createMockFoodOrder(params: {
  restaurantName: string
  total: number
  items: MockFoodCheckoutItem[]
}): UserOrder {
  const timestamp = new Date().toISOString()
  const orderId = createOrderId()
  const orderItems = toOrderItems(params.items)

  return {
    orderId,
    status: 'PREPARING',
    serviceType: 'FOOD',
    totalAmount: Number(params.total.toFixed(2)),
    itemsCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: timestamp,
    updatedAt: timestamp,
    pickupAddress: PICKUP_ADDRESS,
    deliveryAddress: DELIVERY_ADDRESS,
    pickupInfo: {
      name: params.restaurantName,
      phone: '+7 700 400 7000',
    },
    recipientInfo: {
      name: 'You',
      phone: '+7 777 000 0000',
    },
    items: orderItems,
  }
}
