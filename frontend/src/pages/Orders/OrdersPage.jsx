import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '../../mocks/api/orders.api'
import { Pagination } from '../../components/common/Pagination'
import './ordersPage.css'

const STATUS_LABELS = {
  New: 'New',
  Created: 'Created',
  Assigned: 'Assigned',
  InProgress: 'In Progress',
  Processing: 'Processing',
  Delivered: 'Delivered',
  Failed: 'Failed',
}

const STATUS_CLASS = {
  New: 'status-new',
  Created: 'status-created',
  Assigned: 'status-assigned',
  InProgress: 'status-in-progress',
  Processing: 'status-processing',
  Delivered: 'status-delivered',
  Failed: 'status-failed',
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
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])

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
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setPage(1)
              setDateTo(event.target.value)
            }}
            className="orders-date"
          />
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
    </div>
  )
}

