import { useCallback, useEffect, useMemo, useState } from 'react'
import { usersApi } from '../../api/users.api'
import { companiesApi } from '../../api/companies.api'
import { couriersApi } from '../../api/couriers.api'
import { Pagination } from '../../components/common/Pagination'
import { auth } from '../../utils/auth'
import './courierPage.css'

const formatDate = (value) => {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const formatRole = (value) => String(value || 'COURIER').trim().toUpperCase()
const formatBool = (value) => (value ? 'Yes' : 'No')
const formatDateTime = (value) => {
  if (!value) return '---'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '---'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const buildCourierName = (courier) => {
  const fullName = `${courier.firstName || ''} ${courier.lastName || ''}`.trim()
  return fullName || courier.email || '---'
}

export const CourierPage = () => {
  const session = auth.getSession()
  const role = session?.role || ''
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isAdmin = role === 'ADMIN' || isSuperAdmin

  const [couriers, setCouriers] = useState([])
  const [companies, setCompanies] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [profile, setProfile] = useState(null)
  const [eligibility, setEligibility] = useState(null)

  const loadCouriers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
        const [response, usersResponse, companiesResponse] = await Promise.all([
          couriersApi.list({
            companyId: isAdmin ? companyFilter : '',
            page,
            pageSize,
          }),
          usersApi.listCouriers({ page: 1, pageSize: 1000 }),
          companiesApi.list({ page: 1, pageSize: 500 }).catch(() => ({ items: [] })),
        ])

        const companyItems = Array.isArray(companiesResponse)
          ? companiesResponse
          : (companiesResponse.items || [])
        const usersById = new Map(
          (usersResponse.items || []).map(user => [String(user.userId || user.id), user])
        )
        const companiesById = new Map(
          companyItems.map(company => [String(company.id), company])
        )
        const enrichedItems = (response.items || []).map(courier => {
          const user = usersById.get(String(courier.userId))
          const company = companiesById.get(String(courier.companyId))

          return {
            ...courier,
            firstName: user?.firstName || courier.firstName,
            lastName: user?.lastName || courier.lastName,
            email: user?.email || courier.email,
            phone: user?.phone || courier.phone,
            role: user?.role || courier.role || 'COURIER',
            companyName: company?.name || courier.companyName,
          }
        })
        const missingUserCount = enrichedItems.filter(courier => (
          !courier.firstName && !courier.lastName && !courier.email && !courier.phone
        )).length

        setCouriers(enrichedItems)
        setTotal(response.total || 0)
        setSelectedIds(prev => prev.filter(id => enrichedItems.some(item => item.id === id)))
        if (isAdmin) {
          setCompanies(companyItems)
        }
        if (missingUserCount > 0) {
          setError(`Loaded ${enrichedItems.length} courier profiles, but ${missingUserCount} have no matching user info by userId.`)
        }
    } catch (err) {
        setError(err.message || 'Failed to load couriers')
    } finally {
        setLoading(false)
    }
}, [companyFilter, page, pageSize, isAdmin])

  const loadCompanies = useCallback(async () => {
    if (!isAdmin) return
    try {
      const response = await companiesApi.list({ page: 1, pageSize: 500 })
      const items = Array.isArray(response) ? response : (response.items || [])
      setCompanies(items)
    } catch (err) {
      setError(err.message || 'Failed to load companies')
    }
  }, [isAdmin])

  useEffect(() => {
    loadCouriers()
  }, [loadCouriers])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const allSelected = useMemo(() => (
    couriers.length > 0 && selectedIds.length === couriers.length
  ), [couriers, selectedIds])

  const handleToggleAll = (event) => {
    if (event.target.checked) {
      setSelectedIds(couriers.map(courier => courier.id))
      return
    }
    setSelectedIds([])
  }

  const handleToggleOne = (courierId) => {
    setSelectedIds(prev => (
      prev.includes(courierId)
        ? prev.filter(id => id !== courierId)
        : [...prev, courierId]
    ))
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setDetailsError('')
    setSelectedCourier(null)
    setProfile(null)
    setEligibility(null)
  }

  const openDetails = async (courier) => {
    const userId = courier.userId || courier.id

    setDetailsOpen(true)
    setSelectedCourier(courier)
    setProfile(null)
    setEligibility(null)
    setDetailsError('')
    setDetailsLoading(true)

    try {
      const profileResponse = await couriersApi.getByUserId(userId)
      setProfile(profileResponse)

      try {
        const eligibilityResponse = await couriersApi.getEligibility(profileResponse.id)
        setEligibility(eligibilityResponse)
      } catch (eligibilityErr) {
        setEligibility({
          eligible: false,
          reasonCode: 'ELIGIBILITY_CHECK_FAILED',
          message: eligibilityErr.message || 'Failed to get eligibility',
        })
      }
    } catch (err) {
      setDetailsError(err.message || 'Failed to load courier details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleReset = () => {
    setSearch('')
    setCompanyFilter('')
    setPage(1)
  }

  const handleExportCsv = () => {
    const lines = [
      ['Name', 'Phone', 'Email', 'Company', 'Role', 'Created At'].join(','),
      ...couriers.map(courier => {
        const row = [
          buildCourierName(courier),
          courier.phone || '',
          courier.email || '',
          courier.companyName || '---',
          courier.role || 'COURIER',
          formatDate(courier.createdAt),
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
    link.download = `couriers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="couriers-page">
      <div className="couriers-header">
        <h1>Couriers</h1>
      </div>

      {error && <div className="couriers-error">{error}</div>}

      <div className="couriers-toolbar">
        <div className="couriers-toolbar-left">
          <button type="button" className="couriers-filter-btn" title="Filter" disabled>
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
            className="couriers-search"
          />
          {isAdmin && (
            <select
              value={companyFilter}
              onChange={(event) => {
                setPage(1)
                setCompanyFilter(event.target.value)
              }}
              className="couriers-company-filter"
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

        <div className="couriers-toolbar-right">
          <button
            type="button"
            className="couriers-export-btn"
            onClick={handleExportCsv}
            disabled={loading || couriers.length === 0}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="couriers-create-btn"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="couriers-table-wrapper">
        <table className="couriers-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  disabled={couriers.length === 0 || loading}
                />
              </th>
              <th className="number-col">#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {couriers.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="couriers-empty">No couriers found</td>
              </tr>
            )}
            {couriers.map((courier, index) => (
              <tr
                key={courier.id}
                className={selectedIds.includes(courier.id) ? 'selected' : ''}
                onClick={(event) => {
                  if (event.target.type === 'checkbox') return
                  openDetails(courier)
                }}
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(courier.id)}
                    onChange={() => handleToggleOne(courier.id)}
                  />
                </td>
                <td className="number-col">{(page - 1) * pageSize + index + 1}</td>
                <td className="courier-name">{buildCourierName(courier)}</td>
                <td>{courier.phone || '---'}</td>
                <td>{courier.email || '---'}</td>
                <td>{courier.companyName || '---'}</td>
                <td>
                  <span className="courier-role">{formatRole(courier.role)}</span>
                </td>
                <td>{formatDate(courier.createdAt)}</td>
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

      {loading && <div className="couriers-loading">Loading...</div>}

      {detailsOpen && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="courier-details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="courier-details-header">
              <h2>Courier Details</h2>
              <button type="button" className="courier-details-close" onClick={closeDetails}>x</button>
            </div>

            {detailsLoading && <div className="courier-details-loading">Loading details...</div>}
            {detailsError && <div className="courier-details-error">{detailsError}</div>}

            {!detailsLoading && !detailsError && (
              <div className="courier-details-body">
                <div className="courier-details-grid">
                  <div>
                    <span className="details-label">Name</span>
                    <strong>{buildCourierName(selectedCourier || {})}</strong>
                  </div>
                  <div>
                    <span className="details-label">Phone</span>
                    <strong>{selectedCourier?.phone || '---'}</strong>
                  </div>
                  <div>
                    <span className="details-label">Email</span>
                    <strong>{selectedCourier?.email || '---'}</strong>
                  </div>
                  <div>
                    <span className="details-label">Company</span>
                    <strong>{selectedCourier?.companyName || '---'}</strong>
                  </div>
                  <div>
                    <span className="details-label">Courier Type</span>
                    <strong>{profile?.courierType || '---'}</strong>
                  </div>
                  <div>
                    <span className="details-label">Employment Status</span>
                    <strong>{profile?.employmentStatus || '---'}</strong>
                  </div>
                  <div>
                    <span className="details-label">Transport Type</span>
                    <strong>{profile?.transportType || '---'}</strong>
                  </div>
                  <div>
                    <span className="details-label">Verified</span>
                    <strong>{formatBool(profile?.isVerified)}</strong>
                  </div>
                  <div>
                    <span className="details-label">Can Take Orders</span>
                    <strong>{formatBool(profile?.canTakeOrders)}</strong>
                  </div>
                  <div>
                    <span className="details-label">Max Active Orders</span>
                    <strong>{profile?.maxActiveOrders ?? '---'}</strong>
                  </div>
                  <div>
                    <span className="details-label">Created At</span>
                    <strong>{formatDateTime(profile?.createdAt || selectedCourier?.createdAt)}</strong>
                  </div>
                  <div>
                    <span className="details-label">Updated At</span>
                    <strong>{formatDateTime(profile?.updatedAt)}</strong>
                  </div>
                </div>

                <div className="courier-details-section">
                  <h3>Notes</h3>
                  <p>{profile?.notes || '---'}</p>
                </div>

                <div className="courier-details-section">
                  <h3>Eligibility Now</h3>
                  <p>
                    Status: <strong>{eligibility?.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</strong>
                  </p>
                  <p>Reason: {eligibility?.reasonCode || '---'}</p>
                  <p>Message: {eligibility?.message || '---'}</p>
                  <p>Within Schedule: {formatBool(eligibility?.withinSchedule)}</p>
                  <p>Evaluated At: {formatDateTime(eligibility?.evaluatedAt)}</p>
                </div>

                <div className="courier-details-section">
                  <h3>Schedules</h3>
                  {profile?.schedules?.length ? (
                    <table className="courier-schedule-table">
                      <thead>
                        <tr>
                          <th>Weekday</th>
                          <th>Start</th>
                          <th>End</th>
                          <th>Timezone</th>
                          <th>Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.schedules.map(schedule => (
                          <tr key={schedule.id || `${schedule.weekday}-${schedule.startTime}`}>
                            <td>{schedule.weekday}</td>
                            <td>{schedule.startTime || '---'}</td>
                            <td>{schedule.endTime || '---'}</td>
                            <td>{schedule.timezone || '---'}</td>
                            <td>{formatBool(schedule.active)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>---</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
