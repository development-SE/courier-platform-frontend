import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ordersApi } from '../../api/ordersApi'
import { assignmentsApi } from '../../api/assignments.api'
import { couriersApi } from '../../api/couriers.api'
import { usersApi } from '../../api/users.api'
import { auth } from '../../utils/auth'
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
    New: 'created',
    Accepted: 'processing',
    Preparing: 'processing',
    Ready: 'processing',
    InTransit: 'inProgress',
  }
  return map[status] || 'created'
}

export const OrderDetailsPage = () => {
  const { orderId } = useParams()

  const [order, setOrder] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(true)

  // assign
  const [autoLoading, setAutoLoading] = useState(false)
  const [autoMsg, setAutoMsg] = useState('')
  const [autoErr, setAutoErr] = useState('')
  const [showManualModal, setShowManualModal] = useState(false)
  const [couriers, setCouriers] = useState([])
  const [couriersLoading, setCouriersLoading] = useState(false)
  const [courierSearch, setCourierSearch] = useState('')
  const [selectedCourierId, setSelectedCourierId] = useState(null)
  const [manualReason, setManualReason] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualErr, setManualErr] = useState('')

  const [assignment, setAssignment] = useState(null)
  const [courierProfile, setCourierProfile] = useState(null)
  const [courierUser, setCourierUser] = useState(null)

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusErr, setStatusErr] = useState('')

  const session = auth.getSession()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'

  const loadCourierDetails = async (targetOrderId) => {
    try {
      const assignRes = await assignmentsApi.list({ orderId: targetOrderId })
      const activeAssign = assignRes.items?.[0]
      if (activeAssign && activeAssign.courierId) {
        setAssignment(activeAssign)
        const cId = activeAssign.courierId
        
        const [profileRes, usersRes] = await Promise.all([
          couriersApi.getByUserId(cId).catch(() => null),
          usersApi.listCouriers({ page: 1, pageSize: 1000 }).catch(() => ({ items: [] }))
        ])
        
        setCourierProfile(profileRes)
        const matchedUser = (usersRes.items || []).find(u => String(u.userId || u.id) === String(cId))
        setCourierUser(matchedUser || null)
      } else {
        setAssignment(null)
        setCourierProfile(null)
        setCourierUser(null)
      }
    } catch (err) {
      console.error("Error loading courier details:", err)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    setStatusLoading(true)
    setStatusErr('')
    try {
      await ordersApi.updateStatus(orderId, newStatus)
      setShowStatusModal(false)
      const updated = await ordersApi.getById(orderId)
      setOrder(updated)
      await loadCourierDetails(orderId)
    } catch (err) {
      setStatusErr(err.message || 'Ошибка смены статуса')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить этот заказ?')) return
    try {
      await ordersApi.updateStatus(orderId, 'CANCELLED')
      const updated = await ordersApi.getById(orderId)
      setOrder(updated)
      await loadCourierDetails(orderId)
    } catch (err) {
      alert(err.message || 'Ошибка при отмене заказа')
    }
  }

  useEffect(() => {
    if (!orderId) return
    setDetailsLoading(true)
    ordersApi.getById(orderId)
      .then(data => {
        setOrder(data)
        const status = normalizeStatus(data.status)
        const isAssigned = status === 'assigned' || status === 'inProgress' || status === 'delivered'
        if (isAssigned) {
          return loadCourierDetails(orderId)
        } else {
          setAssignment(null)
          setCourierProfile(null)
          setCourierUser(null)
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setDetailsLoading(false))
  }, [orderId])

  const assigned = useMemo(() => {
    if (!order) return false
    const status = normalizeStatus(order.status)
    return status === 'assigned' || status === 'inProgress' || status === 'delivered'
  }, [order])

  const courierInfo = useMemo(() => {
    if (!order || !assigned) return null
    const courierName = courierUser 
      ? `${courierUser.firstName || ''} ${courierUser.lastName || ''}`.trim() || courierUser.email
      : order.courierName || 'Courier not specified'
      
    const courierPhone = courierUser?.phone || order.recipientPhone || '+7 (700) 000-00-00'
    const assignedTime = assignment?.assignedAt || order.createdAt
    const courierIdStr = assignment?.courierId || order.courierId
    
    return {
      name: courierName,
      id: courierIdStr ? `CCR-${courierIdStr}` : 'CCR-0000',
      phone: courierPhone,
      assignedTime: formatDateTime(assignedTime),
      rating: 4.8,
      transportType: courierProfile?.transportType || '—',
    }
  }, [assigned, order, assignment, courierProfile, courierUser])

  const filteredCouriers = useMemo(() => {
    if (!courierSearch) return couriers
    const q = courierSearch.toLowerCase()
    return couriers.filter(c =>
      `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [couriers, courierSearch])

  const statusKey = normalizeStatus(order?.status)

  const timelineSteps = useMemo(() => {
    const isCancelled = order?.status === 'Cancelled'
    if (!isCancelled) {
      return STATUS_STEPS
    }

    const steps = [
      { key: 'created', label: 'Order Created', by: 'Customer' }
    ]

    const wasAssigned = !!assignment
    const wasProcessing = order.status === 'Processing' || order.status === 'Accepted' || order.status === 'Preparing' || order.status === 'Ready' || wasAssigned

    if (wasProcessing) {
      steps.push({ key: 'processing', label: 'Processing', by: 'Manager' })
    }
    if (wasAssigned) {
      steps.push({ key: 'assigned', label: 'Assigned', by: '' })
    }

    steps.push({ key: 'cancelled', label: 'Cancelled', by: '' })
    return steps
  }, [order, assignment])

  const handleAutoAssign = async () => {
    setAutoLoading(true)
    setAutoMsg('')
    setAutoErr('')
    try {
      await assignmentsApi.autoAssign(orderId)
      setAutoMsg('Курьер успешно назначен автоматически')
      const updated = await ordersApi.getById(orderId)
      setOrder(updated)
      await loadCourierDetails(orderId)
    } catch (err) {
      setAutoErr(err.message || 'Ошибка при авто-назначении')
    } finally {
      setAutoLoading(false)
    }
  }

  const openManualModal = async () => {
    setShowManualModal(true)
    setSelectedCourierId(null)
    setManualReason('')
    setManualErr('')
    setCourierSearch('')
    setCouriersLoading(true)
    try {
      const [profilesRes, usersRes] = await Promise.all([
        couriersApi.list({ page: 1, pageSize: 50 }),
        usersApi.listCouriers({ page: 1, pageSize: 1000 }).catch(() => ({ items: [] }))
      ])
      const usersById = new Map((usersRes.items || []).map(u => [String(u.userId || u.id), u]))
      const enriched = (profilesRes.items || []).map(p => {
        const u = usersById.get(String(p.id))
        return {
          ...p,
          firstName: u?.firstName || '',
          lastName: u?.lastName || '',
          email: u?.email || '',
        }
      })
      setCouriers(enriched)
    } catch {
      setCouriers([])
    } finally {
      setCouriersLoading(false)
    }
  }

  const handleManualAssign = async () => {
    if (!selectedCourierId) return
    setManualLoading(true)
    setManualErr('')
    try {
      await assignmentsApi.manualAssign({ orderId, courierId: selectedCourierId, reason: manualReason })
      setShowManualModal(false)
      setAutoMsg('Курьер назначен вручную')
      const updated = await ordersApi.getById(orderId)
      setOrder(updated)
      await loadCourierDetails(orderId)
    } catch (err) {
      setManualErr(err.message || 'Ошибка при назначении')
    } finally {
      setManualLoading(false)
    }
  }

  if (detailsLoading) {
    return (
      <div className="order-details-page">
        <div className="order-details-header"><h1>Детали Заказа</h1></div>
        <div className="details-card">Загрузка...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="order-details-header"><h1>Детали Заказа</h1></div>
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
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setStatusErr('')
              setShowStatusModal(true)
            }}
          >
            Process/Edit
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleCancelOrder}
            disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
          >
            Cancel Order
          </button>
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
            <span>Delivery Fee</span>
            <strong className="paid">{order.deliveryFee ? `${order.deliveryFee} ₸` : '—'}</strong>
          </div>
          <div className="info-row">
            <span>Status</span>
            <strong className="paid">{order.status || 'New'}</strong>
          </div>
        </div>

        <div className="details-card courier-card">
          <h3>Courier Information</h3>
          {order.status === 'Cancelled' ? (
            <div className="courier-pending">
              <div className="courier-avatar" style={{ background: '#fecaca', color: '#dc2626' }}>✗</div>
              <div className="courier-title" style={{ color: '#dc2626' }}>Order Cancelled</div>
              <div className="courier-subtitle">Courier info is not accessible</div>
            </div>
          ) : !assigned ? (
            <div className="courier-pending">
              <div className="courier-avatar skeleton" />
              <div className="courier-title">Not assigned yet</div>
              <div className="courier-subtitle">Waiting for courier to accept</div>
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              {isAdmin && (
                <div className="assign-panel">
                  {autoMsg && <div className="assign-success">{autoMsg}</div>}
                  {autoErr && <div className="assign-error">{autoErr}</div>}
                  <div className="assign-btns">
                    <button
                      type="button"
                      className="btn-assign-auto"
                      onClick={handleAutoAssign}
                      disabled={autoLoading}
                    >
                      {autoLoading ? 'Назначаем...' : 'Авто-назначить'}
                    </button>
                    <button
                      type="button"
                      className="btn-assign-manual"
                      onClick={openManualModal}
                      disabled={autoLoading}
                    >
                      Вручную
                    </button>
                  </div>
                </div>
              )}
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
                <span>Transport Type</span>
                <strong style={{ textTransform: 'uppercase' }}>{courierInfo.transportType}</strong>
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
              {autoMsg && <div className="assign-success" style={{ marginTop: '0.5rem' }}>{autoMsg}</div>}
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
            {timelineSteps.map((step, idx) => {
              const rank = { created: 1, processing: 2, assigned: 3, inProgress: 4, delivered: 5, cancelled: 6 }
              const isActive = rank[step.key] <= rank[statusKey]
              return (
                <div key={step.key} className={`timeline-item ${isActive ? 'active' : ''} ${step.key === 'cancelled' ? 'cancelled' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-label">{step.label}</div>
                    <div className="timeline-meta">
                      <span>{isActive ? formatDateTime(order.createdAt) : 'Pending'}</span>
                      {step.by && <span>by {step.by}</span>}
                    </div>
                  </div>
                  {idx < timelineSteps.length - 1 && <div className="timeline-line" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Manual assign modal */}
      {showManualModal && (
        <div className="od-overlay">
          <div className="od-modal">
            <div className="od-modal-header">
              <h2>Назначить курьера вручную</h2>
              <button
                type="button"
                className="od-modal-close"
                onClick={() => setShowManualModal(false)}
              >
                ×
              </button>
            </div>
            <div className="od-modal-body">
              <p className="od-modal-info">
                Заказ: <code>#{order.orderNumber}</code>
              </p>
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={courierSearch}
                onChange={e => setCourierSearch(e.target.value)}
                className="od-search"
              />
              <div className="od-courier-list">
                {couriersLoading ? (
                  <div className="od-list-msg">Загрузка...</div>
                ) : filteredCouriers.length === 0 ? (
                  <div className="od-list-msg">Нет курьеров</div>
                ) : filteredCouriers.map(c => (
                  <div
                    key={c.id}
                    className={`od-courier-row${selectedCourierId === c.id ? ' selected' : ''}`}
                    onClick={() => setSelectedCourierId(c.id)}
                  >
                    <span className="od-courier-name">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className={`od-ctype od-ctype--${(c.courierType || '').toLowerCase()}`}>
                      {c.courierType === 'EMPLOYEE' ? 'Сотрудник' : 'Контрактор'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="od-form-group">
                <label>Причина (необязательно)</label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value)}
                  placeholder="Укажите причину назначения..."
                  className="od-search"
                />
              </div>
              {manualErr && <div className="od-error">{manualErr}</div>}
            </div>
            <div className="od-modal-footer">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowManualModal(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleManualAssign}
                disabled={!selectedCourierId || manualLoading}
              >
                {manualLoading ? 'Назначаем...' : 'Назначить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status change modal */}
      {showStatusModal && (
        <div className="od-overlay">
          <div className="od-modal" style={{ maxWidth: '380px' }}>
            <div className="od-modal-header">
              <h2>Изменить статус заказа</h2>
              <button
                type="button"
                className="od-modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            <div className="od-modal-body">
              <p className="od-modal-info">
                Текущий статус: <strong>{order.status}</strong>
              </p>
              <div className="od-status-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {[
                  { value: 'NEW', label: 'New' },
                  { value: 'ACCEPTED', label: 'Accepted' },
                  { value: 'PREPARING', label: 'Preparing' },
                  { value: 'READY', label: 'Ready' },
                  { value: 'ASSIGNED', label: 'Assigned' },
                  { value: 'IN_TRANSIT', label: 'In Transit' },
                  { value: 'DELIVERED', label: 'Delivered' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ].map(s => {
                  const isCurrent = order.status?.toUpperCase() === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      className={`btn-outline ${isCurrent ? 'active-status' : ''}`}
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 1rem',
                        background: isCurrent ? '#eff6ff' : '#ffffff',
                        borderColor: isCurrent ? '#3b82f6' : '#e5e7eb',
                        color: isCurrent ? '#1d4ed8' : '#374151',
                        fontWeight: isCurrent ? '700' : '500',
                      }}
                      onClick={() => handleUpdateStatus(s.value)}
                      disabled={statusLoading}
                    >
                      {s.label} {isCurrent && '✓'}
                    </button>
                  )
                })}
              </div>
              {statusErr && <div className="od-error" style={{ marginTop: '0.75rem' }}>{statusErr}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
