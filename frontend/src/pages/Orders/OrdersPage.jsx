import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '../../api/ordersApi'
import { assignmentsApi } from '../../api/assignments.api'
import { couriersApi } from '../../api/couriers.api'
import { auth } from '../../utils/auth'
import { Pagination } from '../../components/common/Pagination'
import './ordersPage.css'

const STATUS_LABELS = {
  New:        'New',
  Accepted:   'Accepted',
  Preparing:  'Preparing',
  Ready:      'Ready',
  Assigned:   'Assigned',
  PickedUp:   'Picked Up',
  InTransit:  'In Transit',
  Delivered:  'Delivered',
  Cancelled:  'Cancelled',
  Rejected:   'Rejected',
}

const STATUS_CLASS = {
  New:        'status-new',
  Accepted:   'status-accepted',
  Preparing:  'status-processing',
  Ready:      'status-processing',
  Assigned:   'status-assigned',
  PickedUp:   'status-in-progress',
  InTransit:  'status-in-progress',
  Delivered:  'status-delivered',
  Cancelled:  'status-failed',
  Rejected:   'status-failed',
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const formatLocation = (street, house) => {
  const safeStreet = String(street || '').trim()
  const safeHouse = String(house || '').trim()
  if (!safeStreet && !safeHouse) return '—'
  return safeHouse ? `${safeStreet} ${safeHouse}` : safeStreet
}

export const OrdersPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const dateTo = ''
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])

  // assign modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignTab, setAssignTab] = useState('auto') // 'auto' | 'manual'
  const [couriers, setCouriers] = useState([])
  const [couriersLoading, setCouriersLoading] = useState(false)
  const [courierSearch, setCourierSearch] = useState('')
  const [selectedCourierId, setSelectedCourierId] = useState(null)
  const [manualReason, setManualReason] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')
  const [assignErr, setAssignErr] = useState('')

  const session = auth.getSession()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await ordersApi.list({
        search,
        dateFrom,
        dateTo,
        page,
        pageSize,
      })
      setOrders(response.items)
      setTotal(response.total)
      setSelectedIds(prev => prev.filter(id => response.items.some(item => item.id === id)))
    } catch (err) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [search, dateFrom, dateTo, page, pageSize])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const allSelected = useMemo(() => (
    orders.length > 0 && selectedIds.length === orders.length
  ), [orders, selectedIds])

  const handleToggleAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(orders.map(order => order.id))
      return
    }
    setSelectedIds([])
  }

  const handleToggleOne = (orderId) => {
    setSelectedIds(prev => (
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    ))
  }

  const handleRowClick = (orderId, event) => {
    if (event.target.type === 'checkbox') return
    navigate(`/orders/details/${orderId}`)
  }

  const handleExportCsv = async () => {
    const result = await ordersApi.list({
      search,
      dateFrom,
      dateTo,
      page: 1,
      pageSize: 5000,
    })

    const lines = [
      ['Order Number', 'Tracking', 'Status', 'Service', 'From', 'To', 'Recipient', 'Created At'].join(','),
      ...result.items.map(order => {
        const row = [
          order.orderNumber || '',
          order.trackingCode || '',
          STATUS_LABELS[order.status] || order.status || '',
          order.serviceType || '',
          formatLocation(order.pickupStreet, order.pickupHouse),
          formatLocation(order.dropoffStreet, order.dropoffHouse),
          order.recipientName || '',
          formatDate(order.createdAt),
        ]
        return row
          .map(cell => `"${String(cell).replaceAll('"', '""')}"`)
          .join(',')
      }),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredCouriers = useMemo(() => {
    if (!courierSearch) return couriers
    const q = courierSearch.toLowerCase()
    return couriers.filter(c =>
      `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [couriers, courierSearch])

  const openAssignModal = async () => {
    setShowAssignModal(true)
    setAssignTab(selectedIds.length === 1 ? 'auto' : 'auto')
    setSelectedCourierId(null)
    setManualReason('')
    setCourierSearch('')
    setAssignMsg('')
    setAssignErr('')
    setCouriersLoading(true)
    try {
      const data = await couriersApi.list({ page: 1, pageSize: 50 })
      setCouriers(data.items)
    } catch {
      setCouriers([])
    } finally {
      setCouriersLoading(false)
    }
  }

  const handleAutoAssign = async () => {
    setAssignLoading(true)
    setAssignMsg('')
    setAssignErr('')
    let successCount = 0
    let failCount = 0
    for (const orderId of selectedIds) {
      try {
        await assignmentsApi.autoAssign(orderId)
        successCount++
      } catch {
        failCount++
      }
    }
    setAssignLoading(false)
    if (failCount === 0) {
      setAssignMsg(`Авто-назначение выполнено для ${successCount} заказа(-ов)`)
    } else {
      setAssignMsg(`Успешно: ${successCount}, ошибок: ${failCount}`)
    }
    await loadOrders()
  }

  const handleManualAssign = async () => {
    if (!selectedCourierId || selectedIds.length !== 1) return
    setAssignLoading(true)
    setAssignErr('')
    try {
      await assignmentsApi.manualAssign({
        orderId: selectedIds[0],
        courierId: selectedCourierId,
        reason: manualReason,
      })
      setAssignMsg('Курьер успешно назначен')
      setShowAssignModal(false)
      await loadOrders()
    } catch (err) {
      setAssignErr(err.message || 'Ошибка при назначении')
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Заказы</h1>
      </div>

      {error && <div className="orders-error">{error}</div>}

      <div className="orders-toolbar">
        <div className="orders-toolbar-left">
          <button type="button" className="orders-filter-btn" title="Filter" disabled>
            <img src="/src/assets/filter.png" alt="Filter" width={14} height={14} />
          </button>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
            className="orders-search"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setPage(1)
              setDateFrom(event.target.value)
            }}
            className="orders-date"
          />
          {isAdmin && selectedIds.length > 0 && (
            <button
              type="button"
              className="orders-assign-btn"
              onClick={openAssignModal}
            >
              Назначить курьера ({selectedIds.length})
            </button>
          )}
          {assignMsg && !showAssignModal && (
            <span className="orders-assign-msg">{assignMsg}</span>
          )}
        </div>

        <div className="orders-toolbar-right">
          <button
            type="button"
            className="orders-export-btn"
            onClick={handleExportCsv}
            disabled={loading}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="orders-create-btn"
            onClick={() => navigate('/orders/new')}
          >
            + Создать
          </button>
        </div>
      </div>

      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  disabled={orders.length === 0 || loading}
                />
              </th>
              <th className="number-col">#</th>
              <th>Order Number</th>
              <th>Tracking</th>
              <th>Status</th>
              <th>Service</th>
              <th>From</th>
              <th>To</th>
              <th>Recipient</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="orders-empty">Нет заказов</td>
              </tr>
            )}
            {orders.map((order, index) => (
              <tr
                key={order.id}
                className={selectedIds.includes(order.id) ? 'selected' : ''}
                onClick={event => handleRowClick(order.id, event)}
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(order.id)}
                    onChange={() => handleToggleOne(order.id)}
                  />
                </td>
                <td className="number-col">{(page - 1) * pageSize + index + 1}</td>
                <td className="order-number">#{order.orderNumber || '—'}</td>
                <td className="tracking">{order.trackingCode || '—'}</td>
                <td>
                  <span className={`order-status ${STATUS_CLASS[order.status] || 'status-new'}`}>
                    {STATUS_LABELS[order.status] || order.status || 'New'}
                  </span>
                </td>
                <td>{order.serviceType || '—'}</td>
                <td>{formatLocation(order.pickupStreet, order.pickupHouse)}</td>
                <td>{formatLocation(order.dropoffStreet, order.dropoffHouse)}</td>
                <td>{order.recipientName || '—'}</td>
                <td>{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(nextSize) => {
          setPage(1)
          setPageSize(nextSize)
        }}
      />

      {loading && <div className="orders-loading">Loading...</div>}

      {/* Assign modal */}
      {showAssignModal && (
        <div className="orders-overlay">
          <div className="orders-modal">
            <div className="orders-modal-header">
              <h2>Назначить курьера</h2>
              <button
                type="button"
                className="orders-modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <div className="orders-modal-body">
              <p className="orders-modal-info">
                Выбрано заказов: <strong>{selectedIds.length}</strong>
              </p>

              {/* Tabs — manual only for single order */}
              {selectedIds.length === 1 && (
                <div className="orders-modal-tabs">
                  <button
                    type="button"
                    className={`orders-modal-tab${assignTab === 'auto' ? ' active' : ''}`}
                    onClick={() => setAssignTab('auto')}
                  >
                    Авто-назначение
                  </button>
                  <button
                    type="button"
                    className={`orders-modal-tab${assignTab === 'manual' ? ' active' : ''}`}
                    onClick={() => setAssignTab('manual')}
                  >
                    Выбрать курьера
                  </button>
                </div>
              )}

              {assignTab === 'auto' && (
                <div className="orders-modal-auto">
                  <p>
                    Система автоматически подберёт ближайшего доступного курьера
                    для {selectedIds.length > 1 ? `каждого из ${selectedIds.length} выбранных заказов` : 'выбранного заказа'}.
                  </p>
                  {assignMsg && <div className="orders-assign-ok">{assignMsg}</div>}
                  {assignErr && <div className="orders-assign-error">{assignErr}</div>}
                </div>
              )}

              {assignTab === 'manual' && selectedIds.length === 1 && (
                <div className="orders-modal-manual">
                  <input
                    type="text"
                    placeholder="Поиск по имени..."
                    value={courierSearch}
                    onChange={e => setCourierSearch(e.target.value)}
                    className="orders-modal-search"
                  />
                  <div className="orders-courier-list">
                    {couriersLoading ? (
                      <div className="orders-courier-msg">Загрузка...</div>
                    ) : filteredCouriers.length === 0 ? (
                      <div className="orders-courier-msg">Нет курьеров</div>
                    ) : filteredCouriers.map(c => (
                      <div
                        key={c.id}
                        className={`orders-courier-row${selectedCourierId === c.id ? ' selected' : ''}`}
                        onClick={() => setSelectedCourierId(c.id)}
                      >
                        <span className="orders-courier-name">{c.firstName} {c.lastName}</span>
                        <span className={`od-ctype od-ctype--${(c.courierType || '').toLowerCase()}`}>
                          {c.courierType === 'EMPLOYEE' ? 'Сотрудник' : 'Контрактор'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="orders-form-group">
                    <label>Причина (необязательно)</label>
                    <input
                      type="text"
                      value={manualReason}
                      onChange={e => setManualReason(e.target.value)}
                      placeholder="Укажите причину назначения..."
                      className="orders-modal-search"
                    />
                  </div>
                  {assignErr && <div className="orders-assign-error">{assignErr}</div>}
                </div>
              )}
            </div>
            <div className="orders-modal-footer">
              <button
                type="button"
                className="orders-btn-cancel"
                onClick={() => setShowAssignModal(false)}
              >
                Отмена
              </button>
              {assignTab === 'auto' && !assignMsg && (
                <button
                  type="button"
                  className="orders-btn-primary"
                  onClick={handleAutoAssign}
                  disabled={assignLoading}
                >
                  {assignLoading ? 'Назначаем...' : 'Авто-назначить'}
                </button>
              )}
              {assignTab === 'manual' && selectedIds.length === 1 && (
                <button
                  type="button"
                  className="orders-btn-primary"
                  onClick={handleManualAssign}
                  disabled={!selectedCourierId || assignLoading}
                >
                  {assignLoading ? 'Назначаем...' : 'Назначить'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
