import { apiClient } from './client'

export const ordersApi = {
  list: async (page = 1, pageSize = 10) => {
    const res = await apiClient.get(`/orders?page=${page}&pageSize=${pageSize}`)
    return res.data
  },

  getById: async (id) => {
    const res = await apiClient.get(`/orders/${id}`)
    return res.data
  },

  create: async ({
    pickupAddress,
    pickupLat,
    pickupLon,
    pickupContactName,
    pickupContactPhone,
    deliveryAddress,
    deliveryLat,
    deliveryLon,
    recipientName,
    recipientPhone,
    serviceType = 'STANDARD',
    comment = '',
    packageDescription = '',
  }) => {
    const body = {
      serviceType,                          // STANDARD | EXPRESS | SCHEDULED
      comment: comment || '',
      items: [
        {
          itemId:   '',
          name:     packageDescription || 'Посылка',
          quantity: 1,
          price:    null,
        },
      ],
      pickupAddress: {
        type:      'COMPANY',               // USER | COMPANY
        city:      'Астана',
        street:    pickupAddress || '',
        house:     '1',
        latitude:  pickupLat  ?? 51.1694,
        longitude: pickupLon  ?? 71.4491,
      },
      deliveryAddress: {
        type:      'USER',                  // USER | COMPANY
        city:      'Астана',
        street:    deliveryAddress || '',
        house:     '1',
        latitude:  deliveryLat  ?? 51.1694,
        longitude: deliveryLon  ?? 71.4491,
      },
      recipientInfo: {
        name:    recipientName  || 'Получатель',
        surname: null,
        phone:   recipientPhone || '+70000000000',
      },
      pickupInfo: {
        name:    pickupContactName  || 'Отправитель',
        surname: null,
        phone:   pickupContactPhone || '+70000000000',
      },
    }

    console.log('Sending order:', JSON.stringify(body, null, 2))
    const res = await apiClient.post('/orders', body)
    return res.data
  },

  cancel: async (id) => {
    const res = await apiClient.put(`/orders/${id}/cancel`)
    return res.data
  },
}