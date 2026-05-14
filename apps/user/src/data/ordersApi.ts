import { apiRequest } from './apiClient'

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  timestamp?: string
}

export type UserOrderAddress = {
  addressId?: string
  type?: string
  city?: string
  street?: string
  house?: string
  apartment?: string
  entrance?: string
  floor?: string
  latitude?: number
  longitude?: number
  createdAt?: string
  updatedAt?: string
}

export type UserOrderContact = {
  contactId?: string
  name?: string
  surname?: string
  phone?: string
  createdAt?: string
  updatedAt?: string
}

export type UserOrderItem = {
  itemId?: string
  name?: string
  quantity: number
  price?: number
}

export type UserOrder = {
  orderId: string
  status: string
  serviceType?: string
  comment?: string
  totalAmount?: number
  itemsCount?: number
  companyId?: string
  createdAt?: string
  updatedAt?: string
  deliveryAddress?: UserOrderAddress
  pickupAddress?: UserOrderAddress
  recipientInfo?: UserOrderContact
  pickupInfo?: UserOrderContact
  items?: UserOrderItem[]
  deliveryConfirmationCode?: string
}

export type UserOrdersPayload = {
  orders: UserOrder[]
  totalCount: number
  pagination: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

export type CreateParcelOrderParams = {
  pickupAddress: string
  deliveryAddress: string
  pickupContactName?: string
  pickupContactPhone?: string
  recipientName: string
  recipientPhone: string
  serviceType?: 'STANDARD' | 'EXPRESS' | 'SCHEDULED'
  comment?: string
  packageDescription?: string
  pickupLat?: number
  pickupLon?: number
  deliveryLat?: number
  deliveryLon?: number
}

export type CreateParcelOrderPayload = {
  orderId?: string
  status?: string
  id?: string
}

export async function listUserOrders(accessToken: string, params?: { page?: number; size?: number }) {
  const searchParams = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 50),
    sortBy: 'createdAt',
    sortDesc: 'true',
  })

  return apiRequest<ApiResponse<UserOrdersPayload>>(`/api/v1/orders?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function getUserOrder(accessToken: string, orderId: string) {
  return apiRequest<ApiResponse<UserOrder>>(`/api/v1/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function createParcelOrder(accessToken: string, params: CreateParcelOrderParams) {
  return apiRequest<ApiResponse<CreateParcelOrderPayload>>('/api/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: {
      serviceType: params.serviceType ?? 'STANDARD',
      comment: params.comment?.trim() ?? '',
      items: [
        {
          itemId: '',
          name: params.packageDescription?.trim() || 'Parcel',
          quantity: 1,
          price: null,
        },
      ],
      pickupAddress: {
        type: 'COMPANY',
        city: 'Almaty',
        street: params.pickupAddress.trim(),
        house: '1',
        latitude: params.pickupLat ?? 43.238949,
        longitude: params.pickupLon ?? 76.889709,
      },
      deliveryAddress: {
        type: 'USER',
        city: 'Almaty',
        street: params.deliveryAddress.trim(),
        house: '1',
        latitude: params.deliveryLat ?? 43.245382,
        longitude: params.deliveryLon ?? 76.927421,
      },
      recipientInfo: {
        name: params.recipientName.trim(),
        surname: null,
        phone: params.recipientPhone.trim(),
      },
      pickupInfo: {
        name: params.pickupContactName?.trim() || 'Sender',
        surname: null,
        phone: params.pickupContactPhone?.trim() || '+7 700 000 0000',
      },
    },
  })
}
