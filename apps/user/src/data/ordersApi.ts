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
  parcelSize?: 'SMALL' | 'MEDIUM' | 'LARGE'
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
  parcelSize?: 'SMALL' | 'MEDIUM' | 'LARGE'
  totalPrice?: number
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
      parcelSize: params.parcelSize,
      comment: params.comment?.trim() ?? '',
      items: [
        {
          itemId: '',
          name: params.packageDescription?.trim() || 'Parcel',
          quantity: 1,
          price: params.totalPrice ?? null,
        },
      ],
      pickupAddress: {
        type: 'COMPANY',
        city: 'Astana',
        street: params.pickupAddress.trim(),
        house: '1',
        latitude: params.pickupLat ?? 51.1282,
        longitude: params.pickupLon ?? 71.4304,
      },
      deliveryAddress: {
        type: 'USER',
        city: 'Astana',
        street: params.deliveryAddress.trim(),
        house: '1',
        latitude: params.deliveryLat ?? 51.1350,
        longitude: params.deliveryLon ?? 71.4450,
      },
      recipientInfo: {
        name: params.recipientName.trim(),
        surname: null,
        phone: params.recipientPhone.trim(),
      },
      pickupInfo: {
        name: params.pickupContactName?.trim() ?? '',
        surname: null,
        phone: params.pickupContactPhone?.trim() ?? '',
      },
    },
  })
}

export type CreateFoodOrderParams = {
  restaurantName: string
  total: number
  items: { id: string; name: string; price: number; quantity: number }[]
  pickupAddress?: string
  pickupLat?: number
  pickupLon?: number
  
  deliveryCity?: string
  deliveryStreet?: string
  deliveryHouse?: string
  deliveryEntrance?: string
  deliveryFloor?: string
  deliveryApartment?: string
  deliveryLat?: number
  deliveryLon?: number
  serviceType?: 'STANDARD' | 'SCHEDULED' | 'EXPRESS'
  recipientName?: string
  recipientPhone?: string

  pickupContactName?: string
  pickupContactPhone?: string
}

export async function createFoodOrder(accessToken: string, params: CreateFoodOrderParams) {
  return apiRequest<ApiResponse<CreateParcelOrderPayload>>('/api/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: {
      serviceType: params.serviceType ?? 'STANDARD',
      comment: `Food order from ${params.restaurantName}`,
      items: params.items.map(item => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      pickupAddress: {
        type: 'COMPANY',
        city: 'Astana',
        street: params.pickupAddress?.trim() ?? '',
        house: '1',
        latitude: params.pickupLat ?? 51.1282,
        longitude: params.pickupLon ?? 71.4304,
      },
      deliveryAddress: {
        type: 'USER',
        city: params.deliveryCity?.trim() || 'Astana',
        street: params.deliveryStreet?.trim() || 'Uly Dala Ave',
        house: params.deliveryHouse?.trim() || '8',
        entrance: params.deliveryEntrance?.trim() || '',
        floor: params.deliveryFloor?.trim() || '',
        apartment: params.deliveryApartment?.trim() || '',
        latitude: params.deliveryLat ?? 51.1350,
        longitude: params.deliveryLon ?? 71.4450,
      },
      recipientInfo: {
        name: params.recipientName?.trim() ?? '',
        surname: null,
        phone: params.recipientPhone?.trim() ?? '',
      },
      pickupInfo: {
        name: params.pickupContactName?.trim() || params.restaurantName,
        surname: null,
        phone: params.pickupContactPhone?.trim() ?? '',
      },
    },
  })
}

export async function getDeliveryConfirmationCode(accessToken: string, orderId: string) {
  return apiRequest<ApiResponse<{ deliveryConfirmationCode: string }>>(`/api/v1/orders/${orderId}/delivery-confirmation-code`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export type TrackingState = {
  currentStep: number // 0: Confirmed, 1: Preparing, 2: On the way, 3: Arrived, 4: Delivered
  title: string
  subtitle: string
  statusColor: string
  statusIcon: string // Feather glyph name
  showConfirmationCode: boolean
  isTerminal: boolean
  terminalType?: 'CANCELLED' | 'REJECTED'
}

export function mapOrderStatusToTrackingState(status: string): TrackingState {
  const normalized = (status || '').toUpperCase()
  switch (normalized) {
    case 'NEW':
      return {
        currentStep: 0,
        title: 'Order placed',
        subtitle: 'Your order has been received and is waiting for processing',
        statusColor: '#B26B00',
        statusIcon: 'clock',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'ACCEPTED':
      return {
        currentStep: 1,
        title: 'Order accepted',
        subtitle: 'Our platform accepted your order and is preparing delivery',
        statusColor: '#004397',
        statusIcon: 'check-circle',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'PREPARING':
      return {
        currentStep: 1,
        title: 'Preparing parcel',
        subtitle: 'Your parcel is being prepared for courier pickup',
        statusColor: '#004397',
        statusIcon: 'package',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'READY':
      return {
        currentStep: 1,
        title: 'Ready for pickup',
        subtitle: 'The parcel is ready and waiting for the courier',
        statusColor: '#004397',
        statusIcon: 'package',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'ASSIGNMENT_PENDING':
      return {
        currentStep: 1,
        title: 'Courier assignment in progress',
        subtitle: 'We are searching for a nearby courier to assign',
        statusColor: '#B26B00',
        statusIcon: 'clock',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'ASSIGNED':
      return {
        currentStep: 1,
        title: 'Courier assigned',
        subtitle: 'A courier has been assigned and is heading to the pickup location',
        statusColor: '#004397',
        statusIcon: 'truck',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'PICKED_UP':
      return {
        currentStep: 2,
        title: 'Picked up',
        subtitle: 'The courier has picked up your parcel and started the delivery',
        statusColor: '#004397',
        statusIcon: 'truck',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'IN_TRANSIT':
      return {
        currentStep: 2,
        title: 'Courier is on the way',
        subtitle: 'Your parcel is in transit to the destination address',
        statusColor: '#004397',
        statusIcon: 'navigation',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'DELIVERY_CONFIRMATION_PENDING':
      return {
        currentStep: 3,
        title: 'Confirm delivery',
        subtitle: 'Please share the confirmation code with your courier',
        statusColor: '#A7391E',
        statusIcon: 'shield',
        showConfirmationCode: true,
        isTerminal: false,
      }
    case 'DELIVERED':
      return {
        currentStep: 4,
        title: 'Delivered',
        subtitle: 'Your order was successfully delivered. Thank you!',
        statusColor: '#2C4E2E',
        statusIcon: 'check-circle',
        showConfirmationCode: false,
        isTerminal: false,
      }
    case 'CANCELLED':
      return {
        currentStep: 0,
        title: 'Order cancelled',
        subtitle: 'This order has been cancelled',
        statusColor: '#6B7280',
        statusIcon: 'x-circle',
        showConfirmationCode: false,
        isTerminal: true,
        terminalType: 'CANCELLED',
      }
    case 'REJECTED':
      return {
        currentStep: 0,
        title: 'Order rejected',
        subtitle: 'This order has been rejected',
        statusColor: '#EF4444',
        statusIcon: 'slash',
        showConfirmationCode: false,
        isTerminal: true,
        terminalType: 'REJECTED',
      }
    default:
      return {
        currentStep: 0,
        title: 'Tracking order',
        subtitle: 'We are updating your order status',
        statusColor: '#6B7280',
        statusIcon: 'help-circle',
        showConfirmationCode: false,
        isTerminal: false,
      }
  }
}

export async function cancelOrder(accessToken: string, orderId: string) {
  return apiRequest<ApiResponse<any>>(`/api/v1/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: {
      status: 'CANCELLED',
    },
  })
}

export type UpdateOrderAddressParams = {
  house?: string
  apartment?: string
  entrance?: string
  floor?: string
}

export async function updateOrderAddress(
  accessToken: string,
  orderId: string,
  params: UpdateOrderAddressParams
) {
  return apiRequest<ApiResponse<any>>(`/api/v1/orders/${orderId}/delivery-address`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    json: params,
  })
}
