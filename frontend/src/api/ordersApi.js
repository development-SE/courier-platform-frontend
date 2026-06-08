import { api } from '../utils/api'
import { auth } from '../utils/auth'

const token = () => auth.getToken()

const unwrap = (response) => response?.data ?? response

const MAX_BACKEND_PAGE_SIZE = 100

// Map your backend response to the shape the UI already expects
const toUiOrder = (order) => ({
  id:            order.orderId,
  orderNumber:   order.orderId?.slice(0, 8).toUpperCase() || '—',
  trackingCode:  'TRK' + order.orderId?.replace(/-/g, '').slice(0, 7).toUpperCase(),
  status:        toPascalStatus(order.status),
  serviceType:   order.serviceType || '—',
  comment:       order.comment || '',
  createdAt:     order.createdAt,
  totalAmount:   order.totalAmount || 0,
  companyId:     order.companyId || '',

  // recipient
  recipientInfo: {
    name:  order.recipientInfo?.name  || '—',
    phone: order.recipientInfo?.phone || '—',
  },

  // addresses
  pickupAddress: {
    street:    order.pickupAddress?.street || '',
    house:     order.pickupAddress?.house  || '',
    city:      order.pickupAddress?.city   || '',
  },
  deliveryAddress: {
    street:    order.deliveryAddress?.street    || '',
    house:     order.deliveryAddress?.house     || '',
    city:      order.deliveryAddress?.city      || '',
    apartment: order.deliveryAddress?.apartment || '',
    entrance:  order.deliveryAddress?.entrance  || '',
  },

  // flat fields the UI also uses
  pickupStreet:     order.pickupAddress?.street    || '',
  pickupHouse:      order.pickupAddress?.house     || '',
  dropoffStreet:    order.deliveryAddress?.street  || '',
  dropoffHouse:     order.deliveryAddress?.house   || '',
  dropoffApartment: order.deliveryAddress?.apartment || '',
  dropoffEntrance:  order.deliveryAddress?.entrance  || '',
  recipientName:    order.recipientInfo?.name  || '—',
  recipientPhone:   order.recipientInfo?.phone || '—',
  comments:         order.comment || '',
  deliveryType:     '—',   // not in backend yet
})

// "NEW" → "New", "IN_TRANSIT" → "InTransit"
const toPascalStatus = (status) => {
  if (!status) return 'New'
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

export const ordersApi = {
  async list({ search = '', dateFrom = '', dateTo = '', page = 1, pageSize = 10 } = {}) {
    const safePageSize = Math.min(Math.max(1, pageSize), MAX_BACKEND_PAGE_SIZE)
    const params = new URLSearchParams()
    params.append('page', page)
    params.append('size', safePageSize)
    params.append('sortBy', 'createdAt')
    params.append('sortDesc', 'true')

    const response = await api.get(`/orders?${params.toString()}`, token())
    const data = unwrap(response)

    let items = (data?.orders || []).map(toUiOrder)

    // client-side search & date filter (until backend supports it)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
      )
    }
    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`)
      items = items.filter(o => new Date(o.createdAt) >= from)
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`)
      items = items.filter(o => new Date(o.createdAt) <= to)
    }

    return {
      items,
      total: data?.totalCount || items.length,
    }
  },

  async listAll({ search = '', dateFrom = '', dateTo = '' } = {}) {
    let page = 1
    let total = 0
    let allItems = []

    while (true) {
      const response = await this.list({
        search,
        dateFrom,
        dateTo,
        page,
        pageSize: MAX_BACKEND_PAGE_SIZE,
      })

      total = response.total
      allItems = allItems.concat(response.items)

      if (allItems.length >= total || response.items.length < MAX_BACKEND_PAGE_SIZE) {
        break
      }

      page += 1
    }

    return {
      items: allItems,
      total,
    }
  },

  async getById(orderId) {
    const response = await api.get(`/orders/${orderId}`, token())
    const data = unwrap(response)
    return toUiOrder(data)
  },

  async create(dto) {
    const body = {
      serviceType: dto.serviceType?.toUpperCase() || 'STANDARD',
      comment: dto.comments || '',
      deliveryAddress: {
        type: 'USER',
        city: dto.dropoffCity || 'Almaty',
        street: dto.dropoffStreet,
        house: dto.dropoffHouse,
        apartment: dto.dropoffApartment || undefined,
        entrance: dto.dropoffEntrance || undefined,
        latitude: dto.dropoffLat || 43.238949,
        longitude: dto.dropoffLng || 76.889709,
      },
      recipientInfo: {
        name: dto.recipientName,
        phone: dto.recipientPhone,
      },
      pickupAddress: {
        type: 'COMPANY',
        city: dto.pickupCity || 'Almaty',
        street: dto.pickupStreet,
        house: dto.pickupHouse,
        latitude: dto.pickupLat || 43.241332,
        longitude: dto.pickupLng || 76.934170,
      },
      pickupInfo: {
        name: dto.pickupContact || 'Warehouse',
        phone: dto.pickupPhone || '+77000000000',
      },
      items: dto.items || [{ itemId: 'ITEM-1', name: 'Package', quantity: 1 }],
    }

    const response = await api.post('/orders', body, token())
    const data = unwrap(response)
    return { id: data?.orderId, ...dto }
  },

  async updateStatus(orderId, newStatus) {
    const response = await api.patch(`/orders/${orderId}/status`, {
      newStatus: newStatus.toUpperCase(),
    }, token())
    return unwrap(response)
  },
}
