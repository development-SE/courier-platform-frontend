import { useCallback, useEffect, useMemo, useState } from 'react'
import { ordersApi } from '../../api/ordersApi'
import { companiesApi } from '../../api/companies.api'
import { Pagination } from '../../components/common/Pagination'
import { auth } from '../../utils/auth'
import './clientPage.css'

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

const formatMoney = (value) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const normalize = (value) => String(value || '').trim().toLowerCase()

const buildClientRows = (orders, companiesMap) => {
  const groups = new Map()

  orders.forEach((order) => {
    const name = order.recipientInfo?.name || '—'
    const phone = order.recipientInfo?.phone || '—'
    const companyId = order.companyId || ''
    const key = `${normalize(phone)}::${normalize(name)}::${companyId}`
    const amount = Number(order.totalAmount || 0)
    const createdAt = order.createdAt || null

    if (!groups.has(key)) {
      const company = companiesMap.get(companyId)
      groups.set(key, {
        id: key,
        clientName: name,
        phone,
        companyId,
        companyName: company?.name || (companyId ? 'Unknown company' : '—'),
        companyBin: company?.bin || '',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: createdAt,
        latestOrderStatus: order.status || '—',
      })
    }

    const existing = groups.get(key)
    existing.totalOrders += 1
    existing.totalSpent += amount

    if (createdAt && (!existing.lastOrderAt || new Date(createdAt) > new Date(existing.lastOrderAt))) {
      existing.lastOrderAt = createdAt
      existing.latestOrderStatus = order.status || existing.latestOrderStatus
    }
  })

  return Array.from(groups.values()).sort((a, b) => {
    const left = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0
    const right = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0
    return right - left
  })
}

export const ClientPage = () => {
  const session = auth.getSession()
  const role = session?.role || ''
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isAdmin = role === 'ADMIN' || isSuperAdmin
  const isCompanyScoped = role === 'DIRECTOR' || role === 'MANAGER'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState([])
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ordersResult, companiesResult] = await Promise.all([
        ordersApi.listAll(),
        companiesApi.list({ page: 1, pageSize: 500 }),
      ])

      const companiesMap = new Map(
        (companiesResult.items || []).map(company => [company.id, company])
      )

      const rows = buildClientRows(ordersResult.items || [], companiesMap)
      setClients(rows)
      setCompanies(companiesResult.items || [])
      setSelectedIds(prev => prev.filter(id => rows.some(row => row.id === id)))
    } catch (err) {
      setError(err.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    setPage(1)
  }, [search, companyFilter])

  const filteredClients = useMemo(() => {
    const query = normalize(search)

    return clients.filter((client) => {
      if (companyFilter && client.companyId !== companyFilter) {
        return false
      }

      if (!query) {
        return true
      }

      return [
        client.clientName,
        client.phone,
        client.companyName,
        client.companyBin,
        client.latestOrderStatus,
      ].some(value => normalize(value).includes(query))
    })
  }, [clients, search, companyFilter])

  const total = filteredClients.length
  const pagedClients = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredClients.slice(startIndex, startIndex + pageSize)
  }, [filteredClients, page, pageSize])

  const allSelected = useMemo(() => (
    pagedClients.length > 0 && selectedIds.length === pagedClients.length
  ), [pagedClients, selectedIds])

  const handleToggleAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(pagedClients.map(client => client.id))
      return
    }
    setSelectedIds([])
  }

  const handleToggleOne = (clientId) => {
    setSelectedIds(prev => (
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    ))
  }

  const handleClearFilters = () => {
    setSearch('')
    setCompanyFilter('')
  }

  const title = isCompanyScoped ? 'Clients' : 'All Clients'

  return (
    <div className="clients-page">
      <div className="clients-header">
        <h1>{title}</h1>
      </div>

      {error && <div className="clients-error">{error}</div>}

      <div className="clients-toolbar">
        <div className="clients-toolbar-left">
          <button type="button" className="clients-filter-btn" title="Filter" disabled>
            <img src="/src/assets/filter.png" alt="Filter" width={14} height={14} />
          </button>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="clients-search"
          />
          {isAdmin && (
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="clients-company-filter"
            >
              <option value="">All companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="clients-toolbar-right">
          <button
            type="button"
            className="clients-secondary-btn"
            onClick={handleClearFilters}
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="button"
            className="clients-secondary-btn"
            onClick={loadClients}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="clients-table-wrapper">
        <table className="clients-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  disabled={pagedClients.length === 0 || loading}
                />
              </th>
              <th className="number-col">#</th>
              <th>Client</th>
              <th>Phone</th>
              <th>Company</th>
              <th>BIN</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Order</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pagedClients.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="clients-empty">No clients found</td>
              </tr>
            )}
            {pagedClients.map((client, index) => (
              <tr key={client.id} className={selectedIds.includes(client.id) ? 'selected' : ''}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(client.id)}
                    onChange={() => handleToggleOne(client.id)}
                  />
                </td>
                <td className="number-col">{(page - 1) * pageSize + index + 1}</td>
                <td className="client-name-cell">
                  <div className="client-name">{client.clientName || '—'}</div>
                  <span className="client-subtext">{client.id}</span>
                </td>
                <td>{client.phone || '—'}</td>
                <td className="company-cell">
                  <span className="company-primary">{client.companyName || '—'}</span>
                  {client.companyBin && <span className="company-secondary">{client.companyBin}</span>}
                </td>
                <td>{client.companyBin || '—'}</td>
                <td>{client.totalOrders}</td>
                <td>{formatMoney(client.totalSpent)}</td>
                <td>{formatDate(client.lastOrderAt)}</td>
                <td>
                  <span className="client-status-pill">{client.latestOrderStatus || '—'}</span>
                </td>
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

      {loading && <div className="clients-loading">Loading...</div>}
    </div>
  )
}
