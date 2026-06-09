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
  const [verifyingDocId, setVerifyingDocId] = useState(null)
  const [rejectingDocId, setRejectingDocId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const emptyCreateForm = { firstName: '', lastName: '', phone: '', email: '', password: '', transportType: 'CAR' }
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState(emptyCreateForm)

  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [editForm, setEditForm] = useState({})

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
          const user = usersById.get(String(courier.userId || courier.id))
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
    setVerifyingDocId(null)
    setRejectingDocId(null)
    setRejectionReason('')
    setEditSuccess('')
  }

  const openEdit = () => {
    if (!profile) return
    setEditForm({
      employmentStatus: profile.employmentStatus || 'ACTIVE',
      transportType: profile.transportType || 'CAR',
      isVerified: profile.isVerified ?? false,
      canTakeOrders: profile.canTakeOrders ?? true,
      maxActiveOrders: profile.maxActiveOrders ?? 5,
      notes: profile.notes || '',
    })
    setEditError('')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditError('')
  }

  const handleEditField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!profile?.id) return
    setEditLoading(true)
    setEditError('')
    try {
      const body = {
        employmentStatus: editForm.employmentStatus,
        transportType: editForm.transportType,
        isVerified: editForm.isVerified,
        canTakeOrders: editForm.canTakeOrders,
        maxActiveOrders: Number(editForm.maxActiveOrders),
        notes: editForm.notes || null,
      }
      const updated = await couriersApi.update(profile.id, body)
      setProfile(updated)
      try {
        const updatedEligibility = await couriersApi.getEligibility(updated.id)
        setEligibility(updatedEligibility)
      } catch {
        // eligibility refresh is best-effort
      }
      setEditOpen(false)
      setEditSuccess('Профиль курьера обновлён')
      await loadCouriers()
    } catch (err) {
      setEditError(err.message || 'Ошибка при сохранении')
    } finally {
      setEditLoading(false)
    }
  }

  const reloadProfile = async (courierId) => {
    try {
      const profileResponse = await couriersApi.getByUserId(courierId)
      setProfile(profileResponse)
    } catch (err) {
      setDetailsError(err.message || 'Failed to reload profile')
    }
  }

  const handleApproveDocument = async (docId) => {
    const courierId = profile?.id
    if (!courierId) return
    setVerifyingDocId(docId)
    try {
      await couriersApi.verifyDocument(courierId, docId, { status: 'APPROVED' })
      await reloadProfile(courierId)
    } catch (err) {
      setDetailsError(err.message || 'Failed to approve document')
    } finally {
      setVerifyingDocId(null)
    }
  }

  const handleRejectDocument = async (docId) => {
    const courierId = profile?.id
    if (!courierId || !rejectionReason.trim()) return
    setVerifyingDocId(docId)
    try {
      await couriersApi.verifyDocument(courierId, docId, { status: 'REJECTED', rejectionReason: rejectionReason.trim() })
      await reloadProfile(courierId)
      setRejectingDocId(null)
      setRejectionReason('')
    } catch (err) {
      setDetailsError(err.message || 'Failed to reject document')
    } finally {
      setVerifyingDocId(null)
    }
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

  const handleViewFile = async (fileUrl) => {
    try {
      const response = await fetch(`http://localhost:8080${fileUrl}`, {
        headers: { Authorization: `Bearer ${auth.getToken()}` },
      })
      if (!response.ok) {
        setDetailsError(`Failed to load file (${response.status})`)
        return
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      window.open(objectUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(objectUrl), 15000)
    } catch (err) {
      setDetailsError(err.message || 'Failed to load file')
    }
  }

  const handleReset = () => {
    setSearch('')
    setCompanyFilter('')
    setPage(1)
  }

  const openCreate = () => {
    setCreateForm(emptyCreateForm)
    setCreateError('')
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setCreateError('')
  }

  const handleCreateField = (field) => (e) => {
    setCreateForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)
    try {
      await couriersApi.createEmployee(createForm)
      setCreateOpen(false)
      await loadCouriers()
    } catch (err) {
      setCreateError(err.message || 'Failed to create courier')
    } finally {
      setCreateLoading(false)
    }
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
          {isAdmin && (
            <button
              type="button"
              className="couriers-add-btn"
              onClick={openCreate}
              disabled={loading}
            >
              + Create Courier
            </button>
          )}
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
              <th>Type</th>
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
                  <span className={`courier-type-badge courier-type-badge--${(courier.courierType || 'contractor').toLowerCase()}`}>
                    {courier.courierType === 'EMPLOYEE' ? 'Employee' : 'Contractor'}
                  </span>
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

      {createOpen && (
        <div className="cc-modal-overlay" onClick={closeCreate}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cc-modal-header">
              <h2>Добавить курьера</h2>
              <button type="button" className="cc-modal-close" onClick={closeCreate}>×</button>
            </div>

            {createError && <div className="cc-modal-error">{createError}</div>}

            <form className="cc-modal-form" onSubmit={handleCreateSubmit}>
              <div className="cc-form-row">
                <div className="cc-form-group">
                  <label>Имя *</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={handleCreateField('firstName')}
                    placeholder="Иван"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div className="cc-form-group">
                  <label>Фамилия *</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={handleCreateField('lastName')}
                    placeholder="Иванов"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="cc-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={handleCreateField('email')}
                  placeholder="courier@company.com"
                  required
                />
              </div>

              <div className="cc-form-group">
                <label>Телефон</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={handleCreateField('phone')}
                  placeholder="+7 700 000 0000"
                />
              </div>

              <div className="cc-form-group">
                <label>Пароль *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={handleCreateField('password')}
                  placeholder="Мин. 8 символов"
                  required
                />
                <span className="cc-form-hint">
                  8+ символов: заглавная, строчная, цифра, спецсимвол (@$!%*?&amp;)
                </span>
              </div>

              <div className="cc-form-group">
                <label>Тип транспорта *</label>
                <select
                  value={createForm.transportType}
                  onChange={handleCreateField('transportType')}
                  required
                >
                  <option value="FOOT">Пешком</option>
                  <option value="BIKE">Велосипед</option>
                  <option value="SCOOTER">Скутер</option>
                  <option value="CAR">Автомобиль</option>
                  <option value="VAN">Фургон</option>
                </select>
              </div>

              <div className="cc-modal-footer">
                <button
                  type="button"
                  className="cc-btn-outline"
                  onClick={closeCreate}
                  disabled={createLoading}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="cc-btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Создание...' : 'Создать курьера'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="courier-details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="courier-details-header">
              <h2>Courier Details</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {isAdmin && profile && !detailsLoading && (
                  <button type="button" className="ce-btn-edit" onClick={openEdit}>
                    Редактировать
                  </button>
                )}
                <button type="button" className="courier-details-close" onClick={closeDetails}>x</button>
              </div>
            </div>

            {detailsLoading && <div className="courier-details-loading">Loading details...</div>}
            {detailsError && <div className="courier-details-error">{detailsError}</div>}

            {editSuccess && !detailsLoading && (
              <div className="ce-success-banner">{editSuccess}</div>
            )}

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

                <div className="courier-details-section">
                  <h3>Documents</h3>
                  {profile?.missingDocumentTypes?.length > 0 && (
                    <p className="courier-doc-missing">
                      Missing: {profile.missingDocumentTypes.join(', ')}
                    </p>
                  )}
                  {profile?.documents?.length ? (
                    <div className="courier-doc-list">
                      {profile.documents.map(doc => (
                        <div key={doc.id} className="courier-doc-item">
                          <div className="courier-doc-info">
                            <span className="courier-doc-type">{doc.documentType}</span>
                            <span className="courier-doc-number">#{doc.documentNumber}</span>
                            <span className={`courier-doc-status courier-doc-status--${(doc.status || '').toLowerCase()}`}>
                              {doc.status}
                            </span>
                          </div>
                          {doc.fileUrl && (
                            <button
                              type="button"
                              className="courier-doc-link"
                              onClick={() => handleViewFile(doc.fileUrl)}
                            >
                              View file
                            </button>
                          )}
                          {doc.rejectionReason && (
                            <p className="courier-doc-rejection">Rejection: {doc.rejectionReason}</p>
                          )}
                          {doc.status !== 'APPROVED' && (
                            <div className="courier-doc-actions">
                              <button
                                type="button"
                                className="courier-doc-approve-btn"
                                disabled={verifyingDocId === doc.id}
                                onClick={() => handleApproveDocument(doc.id)}
                              >
                                {verifyingDocId === doc.id ? '...' : 'Approve'}
                              </button>
                              {rejectingDocId === doc.id ? (
                                <div className="courier-doc-reject-form">
                                  <input
                                    type="text"
                                    placeholder="Rejection reason"
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    className="courier-doc-reject-input"
                                  />
                                  <button
                                    type="button"
                                    className="courier-doc-reject-confirm-btn"
                                    disabled={verifyingDocId === doc.id || !rejectionReason.trim()}
                                    onClick={() => handleRejectDocument(doc.id)}
                                  >
                                    Confirm Reject
                                  </button>
                                  <button
                                    type="button"
                                    className="courier-doc-reject-cancel-btn"
                                    onClick={() => { setRejectingDocId(null); setRejectionReason('') }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="courier-doc-reject-btn"
                                  disabled={verifyingDocId === doc.id}
                                  onClick={() => setRejectingDocId(doc.id)}
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          )}
                          {doc.status === 'APPROVED' && (
                            <div className="courier-doc-actions">
                              <button
                                type="button"
                                className="courier-doc-reject-btn"
                                disabled={verifyingDocId === doc.id}
                                onClick={() => setRejectingDocId(doc.id)}
                              >
                                Revoke
                              </button>
                              {rejectingDocId === doc.id && (
                                <div className="courier-doc-reject-form">
                                  <input
                                    type="text"
                                    placeholder="Rejection reason"
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    className="courier-doc-reject-input"
                                  />
                                  <button
                                    type="button"
                                    className="courier-doc-reject-confirm-btn"
                                    disabled={verifyingDocId === doc.id || !rejectionReason.trim()}
                                    onClick={() => handleRejectDocument(doc.id)}
                                  >
                                    Confirm Revoke
                                  </button>
                                  <button
                                    type="button"
                                    className="courier-doc-reject-cancel-btn"
                                    onClick={() => { setRejectingDocId(null); setRejectionReason('') }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No documents uploaded yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {editOpen && (
        <div className="cc-modal-overlay" onClick={closeEdit}>
          <div className="cc-modal ce-modal" onClick={e => e.stopPropagation()}>
            <div className="cc-modal-header">
              <h2>Редактировать профиль</h2>
              <button type="button" className="cc-modal-close" onClick={closeEdit}>×</button>
            </div>

            {editError && <div className="cc-modal-error">{editError}</div>}

            <form className="cc-modal-form" onSubmit={handleEditSubmit}>
              <div className="cc-form-group">
                <label>Статус занятости</label>
                <select value={editForm.employmentStatus} onChange={handleEditField('employmentStatus')}>
                  <option value="ONBOARDING">Онбординг</option>
                  <option value="ACTIVE">Активен</option>
                  <option value="SUSPENDED">Приостановлен</option>
                  <option value="INACTIVE">Неактивен</option>
                </select>
              </div>

              <div className="cc-form-group">
                <label>Тип транспорта</label>
                <select value={editForm.transportType} onChange={handleEditField('transportType')}>
                  <option value="FOOT">Пешком</option>
                  <option value="BIKE">Велосипед</option>
                  <option value="SCOOTER">Скутер</option>
                  <option value="CAR">Автомобиль</option>
                  <option value="VAN">Фургон</option>
                </select>
              </div>

              <div className="cc-form-group">
                <label>Макс. активных заказов (1–20)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editForm.maxActiveOrders}
                  onChange={handleEditField('maxActiveOrders')}
                  required
                />
              </div>

              <div className="ce-checkboxes">
                <label className="ce-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.isVerified}
                    onChange={handleEditField('isVerified')}
                  />
                  Верифицирован
                </label>
                <label className="ce-checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.canTakeOrders}
                    onChange={handleEditField('canTakeOrders')}
                  />
                  Может брать заказы
                </label>
              </div>

              <div className="cc-form-group">
                <label>Заметки</label>
                <textarea
                  value={editForm.notes}
                  onChange={handleEditField('notes')}
                  rows={3}
                  placeholder="Дополнительные заметки о курьере..."
                  className="ce-textarea"
                />
              </div>

              <div className="cc-modal-footer">
                <button
                  type="button"
                  className="cc-btn-outline"
                  onClick={closeEdit}
                  disabled={editLoading}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="cc-btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
