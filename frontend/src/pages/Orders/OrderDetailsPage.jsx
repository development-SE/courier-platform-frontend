import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ordersApi } from '../../api/ordersApi'
import './orderDetailsPage.css'

const STATUS_STEPS = [
  { key: 'created', label: 'Order Created', by: 'Customer' },
  { key: 'processing', label: 'Processing', by: 'Manager' },
  { key: 'assigned', label: 'Assigned', by: '' },
  { key: 'inProgress', label: 'In Progress', by: '' },
  { key: 'delivered', label: 'Delivered', by: '' },
]

const formatDateTime = (value) => {
  if (!value) return 'Pending'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Pending'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const buildAddress = (street, house, apartment, entrance) => {
  const parts = [street, house, apartment ? `apt ${apartment}` : '', entrance ? `entrance ${entrance}` : '']
    .map(part => String(part || '').trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

const normalizeStatus = (status) => {
  const map = {
    Created: 'created',
    Processing: 'processing',
    Assigned: 'assigned',
    InProgress: 'inProgress',
    Delivered: 'delivered',
  }
  return map[status] || 'created'
}

export const OrderDetailsPage = () => {
  const { orderId } = useParams()
  const [manualAssigned, setManualAssigned] = useState(false)

  const [order, setOrder] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    setDetailsLoading(true)
    ordersApi.getById(orderId)
      .then(data => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setDetailsLoading(false))
  }, [orderId])

  const assigned = useMemo(() => {
    if (!order) return false
    const status = normalizeStatus(order.status)
    return manualAssigned || status === 'assigned' || status === 'inProgress' || status === 'delivered'
  }, [manualAssigned, order])

  const courierInfo = useMemo(() => {
    if (!order || !assigned) return null
    return {
      name: order.courierName || 'Courier not specified',
      id: order.courierId ? `CCR-${order.courierId}` : 'CCR-0000',
      phone: order.recipientPhone || '+7 (700) 000-00-00',
      assignedTime: formatDateTime(order.createdAt),
      rating: 4.8,
    }
  }, [assigned, order])

  const statusKey = normalizeStatus(order?.status)

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="order-details-header">
          <h1>Детали Заказа</h1>
        </div>
        <div className="details-card">Заказ не найден</div>
      </div>
    )
  }

  return (
    <div className="order-details-page">
      <div className="order-details-header">
        <h1>Детали Заказа</h1>
      </div>

      <div className="order-summary">
        <div>
          <div className="order-number">#{order.orderNumber || '—'}</div>
          <div className="order-tracking">Tracking: <span>{order.trackingCode || '—'}</span></div>
        </div>
        <div className="order-status">
          <span className={`status-dot ${assigned ? 'assigned' : 'available'}`} />
          {assigned ? 'Assigned' : 'Available'}
        </div>
        <div className="order-actions">
          <button type="button" className="btn-outline">Process/Edit</button>
          <button type="button" className="btn-danger">Cancel Order</button>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-card">
          <h3>Recipient Info</h3>
          <div className="info-row">
            <span>Full Name</span>
            <strong>{order.recipientInfo?.name  || '—'}</strong>
          </div>
          <div className="info-row">
            <span>Phone</span>
            <strong>{order.recipientInfo?.phone   || '—'}</strong>
          </div>
          <div className="info-row">
            <span>Email</span>
            <strong>—</strong>
          </div>
          <div className="info-row">
            <span>Notes</span>
            <strong>{order.comment || 'No notes'}</strong>
          </div>
        </div>

        <div className="details-card">
          <h3>Order Info</h3>
          <div className="info-row">
            <span>Service Type</span>
            <strong>{order.serviceType || '—'}</strong>
          </div>
          <div className="info-row">
            <span>Created At</span>
            <strong>{formatDateTime(order.createdAt)}</strong>
          </div>
          <div className="info-row">
            <span>Type of Delivery</span>
            <strong>{order.deliveryType || '—'}</strong>
          </div>
          <div className="info-row">
            <span>Status</span>
            <strong className="paid">{order.status || 'New'}</strong>
          </div>
        </div>

        <div className="details-card courier-card">
          <h3>Courier Information</h3>
          {!assigned ? (
            <div className="courier-pending">
              <div className="courier-avatar skeleton" />
              <div className="courier-title">Not assigned yet</div>
              <div className="courier-subtitle">Waiting for courier to accept</div>
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <button type="button" className="btn-ghost" onClick={() => setManualAssigned(true)}>
                Simulate Assign
              </button>
            </div>
          ) : (
            <div className="courier-info">
              <div className="courier-header">
                <div className="courier-avatar">CR</div>
                <div>
                  <div className="courier-name">{courierInfo.name}</div>
                  <div className="courier-id">Courier ID: {courierInfo.id}</div>
                </div>
              </div>
              <div className="info-row">
                <span>Phone</span>
                <strong>{courierInfo.phone}</strong>
              </div>
              <div className="info-row">
                <span>Assigned Time</span>
                <strong>{courierInfo.assignedTime}</strong>
              </div>
              <div className="info-row">
                <span>Rating</span>
                <strong className="rating">★★★★★ <span>{courierInfo.rating}</span></strong>
              </div>
            </div>
          )}
        </div>

        <div className="details-card route-card">
          <h3>Route</h3>
          <div className="route-point">
            <div className="route-dot pickup" />
            <div>
              <div className="route-label">Pickup Address</div>
              <div className="route-value">{buildAddress(order.pickupAddress?.street, order.pickupAddress?.house)}</div>
            </div>
          </div>
          <div className="route-line" />
          <div className="route-point">
            <div className="route-dot dropoff" />
            <div>
              <div className="route-label">Dropoff Address</div>
              <div className="route-value">
              {buildAddress(order.deliveryAddress?.street, order.deliveryAddress?.house, order.deliveryAddress?.apartment, order.deliveryAddress?.entrance)}
              </div>
            </div>
          </div>
          <button type="button" className="link-button">Open Map</button>
        </div>

        <div className="details-card timeline-card">
          <h3>Status Timeline</h3>
          <div className="timeline">
            {STATUS_STEPS.map((step, idx) => {
              const rank = { created: 1, processing: 2, assigned: 3, inProgress: 4, delivered: 5 }
              const isActive = rank[step.key] <= rank[statusKey]
              return (
                <div key={step.key} className={`timeline-item ${isActive ? 'active' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-label">{step.label}</div>
                    <div className="timeline-meta">
                      <span>{isActive ? formatDateTime(order.createdAt) : 'Pending'}</span>
                      {step.by && <span>by {step.by}</span>}
                    </div>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && <div className="timeline-line" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
