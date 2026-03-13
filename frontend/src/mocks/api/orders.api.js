import { storage } from '../../utils/storage'

const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))

const toLower = (value) => String(value || '').toLowerCase()

const generateOrderNumber = () => {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)
  const random = Math.floor(Math.random() * 900 + 100)
  return `ORD-${timestamp}-${random}`
}

const generateTrackingCode = () => {
  const random = Math.floor(1000000 + Math.random() * 9000000)
  return `TRK${random}`
}

export const ordersApi = {
  async list({ search = '', dateFrom = '', dateTo = '', page = 1, pageSize = 10 } = {}) {
    await delay()
    let orders = storage.getOrders()

    if (search) {
      const q = toLower(search)
      orders = orders.filter(order => (
        toLower(order.orderNumber).includes(q)
        || toLower(order.trackingCode).includes(q)
        || toLower(order.recipientName).includes(q)
        || toLower(order.status).includes(q)
        || toLower(order.serviceType).includes(q)
      ))
    }

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`)
      orders = orders.filter(order => new Date(order.createdAt) >= from)
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`)
      orders = orders.filter(order => new Date(order.createdAt) <= to)
    }

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const total = orders.length
    const startIdx = (page - 1) * pageSize
    const items = orders.slice(startIdx, startIdx + pageSize)

    return { items, total }
  },

  async create(dto) {
    await delay()

    const orders = storage.getOrders()
    const orderNumber = generateOrderNumber()
    const trackingCode = generateTrackingCode()

    const newOrder = {
      id: String(Math.max(...orders.map(order => parseInt(order.id) || 0), 0) + 1),
      orderNumber,
      trackingCode,
      status: dto.status || 'New',
      serviceType: dto.serviceType || '',
      comments: dto.comments || '',
      dropoffStreet: dto.dropoffStreet || '',
      dropoffHouse: dto.dropoffHouse || '',
      dropoffApartment: dto.dropoffApartment || '',
      dropoffEntrance: dto.dropoffEntrance || '',
      recipientName: dto.recipientName || '',
      recipientPhone: dto.recipientPhone || '',
      pickupPoint: dto.pickupPoint || '',
      pickupStreet: dto.pickupStreet || '',
      pickupHouse: dto.pickupHouse || '',
      pickupContact: dto.pickupContact || '',
      courierId: dto.courierId || '',
      courierName: dto.courierName || '',
      deliveryType: dto.deliveryType || '',
      plannedPickupTime: dto.plannedPickupTime || '',
      createdAt: new Date().toISOString(),
    }

    orders.unshift(newOrder)
    storage.setOrders(orders)
    return newOrder
  },
}
