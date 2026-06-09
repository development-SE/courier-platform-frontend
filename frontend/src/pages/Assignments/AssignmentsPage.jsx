import { useCallback, useEffect, useState } from 'react'
import { assignmentsApi } from '../../api/assignments.api'
import { couriersApi } from '../../api/couriers.api'
import { Pagination } from '../../components/common/Pagination'
import './assignmentsPage.css'

const STATUS_LABEL = {
  PENDING:         'Ожидает',
  ASSIGNED:        'Назначен',
  MANUAL_REQUIRED: 'Нужно назначение',
  ACCEPTED:        'Принят',
  REJECTED:        'Отклонён',
  TIMED_OUT:       'Истекло',
  PICKED_UP:       'Забран',
  IN_TRANSIT:      'В пути',
  ARRIVED:         'Прибыл',
  DELIVERED:       'Доставлен',
  CANCELLED:       'Отменён',
  FAILED:          'Ошибка',
}

const FAILURE_LABEL = {
  NO_ONLINE_COURIERS:              'Нет онлайн-курьеров',
  STALE_LOCATIONS:                 'Устаревшие геоданные',
  COURIER_SERVICE_UNAVAILABLE:     'Сервис курьеров недоступен',
  MISSING_ORDER_COORDINATES:       'Нет координат заказа',
  PARCEL_TOO_LARGE_FOR_ALL_VEHICLES:'Груз не подходит',
  INVALID_ORDER_DATA:              'Некорректные данные заказа',
  NO_CAPACITY_AVAILABLE:           'Нет свободной ёмкости',
  MAX_ACTIVE_ORDERS_REACHED:       'Достигнут лимит заказов',
  UNKNOWN:                         'Неизвестная ошибка',
}

const STATUS_CLASS = {
  PENDING:         'as-pending',
  ASSIGNED:        'as-assigned',
  MANUAL_REQUIRED: 'as-manual',
  ACCEPTED:        'as-accepted',
  REJECTED:        'as-rejected',
  TIMED_OUT:       'as-timedout',
  PICKED_UP:       'as-progress',
  IN_TRANSIT:      'as-progress',
  ARRIVED:         'as-progress',
  DELIVERED:       'as-delivered',
  CANCELLED:       'as-cancelled',
  FAILED:          'as-failed',
}

const ALL_STATUSES = Object.keys(STATUS_LABEL)

const shortId = (id) => (id ? String(id).slice(0, 8) + '…' : '—')

const fmtDt = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d)) return '—'
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ─── Component: Manual Required Section Alert ───
const ManualRequiredSection = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await assignmentsApi.listManualRequired({ page: 1, pageSize: 5 })
      setItems(res.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  if (items.length === 0) return null

  return (
    <div className="asgn-manual-section">
      <div className="asgn-manual-section-header">
        <h3>⚠️ Требуется ручное назначение ({items.length})</h3>
        <button type="button" className="asgn-btn-sm" onClick={load} disabled={loading}>
          {loading ? '…' : 'Обновить'}
        </button>
      </div>
      <div className="asgn-manual-section-list">
        {items.map(item => (
          <div key={item.assignmentId || item.orderId} className="asgn-manual-section-item">
            <span>
              Заказ: <code className="asgn-mono">{shortId(item.orderId)}</code>
              {item.failureReason && (
                <span className="asgn-failure" style={{ marginLeft: '0.5rem' }}>
                  {FAILURE_LABEL[item.failureReason] || item.failureReason}
                </span>
              )}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Попыток: {item.retryCount ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AssignmentsPage = () => {
  const [tab, setTab] = useState('all')

  return (
    <div className="asgn-page">
      <div className="asgn-header">
        <h1 className="asgn-title">Диспетчерская</h1>
        <div className="asgn-tabs">
          <button
            type="button"
            className={`asgn-tab ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            Все назначения
          </button>
          <button
            type="button"
            className={`asgn-tab ${tab === 'manual' ? 'active' : ''}`}
            onClick={() => setTab('manual')}
          >
            Требуется назначение
          </button>
        </div>
      </div>

      <ManualRequiredSection />

      {tab === 'all'    && <AllAssignmentsTab />}
      {tab === 'manual' && <ManualRequiredTab />}
    </div>
  )
}

// ─── Tab: All Assignments ─────────────────────────────────────────────────────

const AllAssignmentsTab = () => {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [page, setPage]       = useState(1)
  const pageSize              = 20
  const [statusFilter, setStatusFilter] = useState('')
  const [orderIdFilter, setOrderIdFilter] = useState('')

  const [historyOpen, setHistoryOpen]   = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTitle, setHistoryTitle] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await assignmentsApi.list({
        status: statusFilter || undefined,
        orderId: orderIdFilter.trim() || undefined,
        page,
        pageSize,
      })
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, orderIdFilter, page])

  useEffect(() => { load() }, [load])

  const openHistory = async (assignment) => {
    setHistoryTitle(`Назначение ${shortId(assignment.id)}`)
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryItems([])
    try {
      const data = await assignmentsApi.getHistory(assignment.id)
      setHistoryItems(Array.isArray(data) ? data : [])
    } catch {
      setHistoryItems([])
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <>
      <div className="asgn-toolbar">
        <select
          className="asgn-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">Все статусы</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <input
          className="asgn-input"
          placeholder="Фильтр по ID заказа…"
          value={orderIdFilter}
          onChange={e => { setOrderIdFilter(e.target.value); setPage(1) }}
        />
        <button type="button" className="asgn-btn-refresh" onClick={load}>
          Обновить
        </button>
      </div>

      {error && <div className="asgn-error">{error}</div>}

      <div className="asgn-table-wrap">
        <table className="asgn-table">
          <thead>
            <tr>
              <th>ID назначения</th>
              <th>ID заказа</th>
              <th>ID курьера</th>
              <th>Статус</th>
              <th>Назначен</th>
              <th>ETA (мин)</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="asgn-td-center">Загрузка…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="asgn-td-center">Нет данных</td></tr>
            )}
            {!loading && items.map(a => (
              <tr key={a.id}>
                <td className="asgn-mono">{shortId(a.id)}</td>
                <td className="asgn-mono">{shortId(a.orderId)}</td>
                <td className="asgn-mono">{a.courierId ? shortId(a.courierId) : '—'}</td>
                <td>
                  <span className={`asgn-badge ${STATUS_CLASS[a.assignmentStatus] || ''}`}>
                    {STATUS_LABEL[a.assignmentStatus] || a.assignmentStatus}
                  </span>
                </td>
                <td>{fmtDt(a.assignedAt)}</td>
                <td>{a.etaMinutes ?? '—'}</td>
                <td className="asgn-actions-cell">
                  <button
                    type="button"
                    className="asgn-btn-sm"
                    onClick={() => openHistory(a)}
                  >
                    История
                  </button>
                  <select
                    className="asgn-select-sm"
                    value={a.assignmentStatus}
                    onChange={async (e) => {
                      const newStatus = e.target.value
                      if (newStatus && newStatus !== a.assignmentStatus) {
                        try {
                          await assignmentsApi.updateStatus(a.id, newStatus)
                          load()
                        } catch (err) {
                          alert(`Ошибка смены статуса: ${err.message}`)
                        }
                      }
                    }}
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      {historyOpen && (
        <HistoryModal
          title={historyTitle}
          items={historyItems}
          loading={historyLoading}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </>
  )
}

// ─── Tab: Manual Required ─────────────────────────────────────────────────────

const ManualRequiredTab = () => {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [page, setPage]       = useState(1)
  const pageSize              = 20

  const [manualOpen, setManualOpen]     = useState(false)
  const [manualOrderId, setManualOrderId] = useState(null)
  const [autoLoading, setAutoLoading]   = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setActionMsg('')
    try {
      const res = await assignmentsApi.manualRequired({ page, pageSize })
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const handleAutoAssign = async (orderId) => {
    setAutoLoading(prev => ({ ...prev, [orderId]: true }))
    setActionMsg('')
    try {
      const res = await assignmentsApi.autoAssign(orderId)
      const status = res?.assigned?.assignmentStatus || res?.assignmentStatus || 'OK'
      setActionMsg(`Заказ ${shortId(orderId)}: авто-назначение — ${STATUS_LABEL[status] || status}`)
      load()
    } catch (e) {
      setActionMsg(`Ошибка авто-назначения: ${e.message}`)
    } finally {
      setAutoLoading(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleRetryAll = async () => {
    setActionMsg('')
    try {
      await assignmentsApi.retryManualRequired()
      setActionMsg('Повтор запущен для всех заказов')
      load()
    } catch (e) {
      setActionMsg(`Ошибка повтора: ${e.message}`)
    }
  }

  const openManual = (orderId) => {
    setManualOrderId(orderId)
    setManualOpen(true)
  }

  const handleManualAssigned = (msg) => {
    setManualOpen(false)
    setManualOrderId(null)
    setActionMsg(msg)
    load()
  }

  return (
    <>
      <div className="asgn-toolbar">
        <button type="button" className="asgn-btn-primary" onClick={handleRetryAll}>
          Повторить авто-назначение для всех
        </button>
        <button type="button" className="asgn-btn-refresh" onClick={load}>
          Обновить
        </button>
        {actionMsg && <span className="asgn-action-msg">{actionMsg}</span>}
      </div>

      {error && <div className="asgn-error">{error}</div>}

      {total > 0 && (
        <div className="asgn-manual-count">
          Заказов в очереди: <strong>{total}</strong>
        </div>
      )}

      <div className="asgn-table-wrap">
        <table className="asgn-table">
          <thead>
            <tr>
              <th>ID назначения</th>
              <th>ID заказа</th>
              <th>Причина сбоя</th>
              <th>Кандидаты (найдено / подходит)</th>
              <th>Повторов</th>
              <th>Следующий повтор</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="asgn-td-center">Загрузка…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="asgn-td-center">
                Нет заказов, требующих ручного назначения
              </td></tr>
            )}
            {!loading && items.map(item => (
              <tr key={item.assignmentId}>
                <td className="asgn-mono">{shortId(item.assignmentId)}</td>
                <td className="asgn-mono">{shortId(item.orderId)}</td>
                <td>
                  <span className="asgn-failure">
                    {FAILURE_LABEL[item.failureReason] || item.failureReason || '—'}
                  </span>
                </td>
                <td className="asgn-td-center">
                  {item.scannedCandidates ?? '—'} / {item.eligibleCandidates ?? '—'}
                </td>
                <td className="asgn-td-center">{item.retryCount ?? 0}</td>
                <td>{fmtDt(item.nextRetryAt)}</td>
                <td className="asgn-actions-cell">
                  <button
                    type="button"
                    className="asgn-btn-auto"
                    disabled={autoLoading[item.orderId]}
                    onClick={() => handleAutoAssign(item.orderId)}
                  >
                    {autoLoading[item.orderId] ? '…' : 'Авто'}
                  </button>
                  <button
                    type="button"
                    className="asgn-btn-manual"
                    onClick={() => openManual(item.orderId)}
                  >
                    Вручную
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      {manualOpen && (
        <ManualAssignModal
          orderId={manualOrderId}
          onClose={() => { setManualOpen(false); setManualOrderId(null) }}
          onSuccess={handleManualAssigned}
        />
      )}
    </>
  )
}

// ─── Modal: Manual Assign ─────────────────────────────────────────────────────

const ManualAssignModal = ({ orderId, onClose, onSuccess }) => {
  const [couriers, setCouriers]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [reason, setReason]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    couriersApi.list({ page: 1, pageSize: 50 })
      .then(res => setCouriers(res.items || []))
      .catch(() => setCouriers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = couriers.filter(c => {
    const q = search.toLowerCase()
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase()
    return !q || name.includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  const handleSubmit = async () => {
    if (!selected) { setError('Выберите курьера'); return }
    setSubmitting(true)
    setError('')
    try {
      await assignmentsApi.manualAssign({
        orderId,
        courierId: selected.id,
        reason: reason.trim() || undefined,
      })
      onSuccess(`Заказ ${shortId(orderId)} назначен курьеру ${selected.firstName || ''} ${selected.lastName || ''}`.trim())
    } catch (e) {
      setError(e.message || 'Ошибка назначения')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="asgn-overlay" onClick={onClose}>
      <div className="asgn-modal" onClick={e => e.stopPropagation()}>
        <div className="asgn-modal-header">
          <h2>Назначить курьера</h2>
          <button type="button" className="asgn-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="asgn-modal-body">
          <div className="asgn-modal-order">
            Заказ: <code>{shortId(orderId)}</code>
          </div>

          <input
            className="asgn-input"
            placeholder="Поиск курьера по имени или email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />

          {error && <div className="asgn-error" style={{ marginTop: '0.5rem' }}>{error}</div>}

          <div className="asgn-courier-list">
            {loading && <div className="asgn-td-center">Загрузка курьеров…</div>}
            {!loading && filtered.length === 0 && (
              <div className="asgn-td-center">Нет доступных курьеров</div>
            )}
            {!loading && filtered.map(c => {
              const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || c.id
              const isSelected = selected?.id === c.id
              return (
                <div
                  key={c.id}
                  className={`asgn-courier-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelected(c)}
                >
                  <div className="asgn-courier-name">{name}</div>
                  <div className="asgn-courier-meta">
                    {c.transportType && <span className="asgn-transport">{c.transportType}</span>}
                    {c.courierType && (
                      <span className={`asgn-ctype asgn-ctype--${(c.courierType || '').toLowerCase()}`}>
                        {c.courierType === 'EMPLOYEE' ? 'Employee' : 'Contractor'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="asgn-form-group">
            <label>Причина назначения (необязательно)</label>
            <input
              className="asgn-input"
              placeholder="Например: ближайший к адресу"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="asgn-modal-footer">
          <button type="button" className="asgn-btn-outline" onClick={onClose} disabled={submitting}>
            Отмена
          </button>
          <button
            type="button"
            className="asgn-btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !selected}
          >
            {submitting ? 'Назначение…' : 'Назначить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Assignment History ────────────────────────────────────────────────

const HistoryModal = ({ title, items, loading, onClose }) => (
  <div className="asgn-overlay" onClick={onClose}>
    <div className="asgn-modal" onClick={e => e.stopPropagation()}>
      <div className="asgn-modal-header">
        <h2>История — {title}</h2>
        <button type="button" className="asgn-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="asgn-modal-body">
        {loading && <div className="asgn-td-center">Загрузка…</div>}
        {!loading && items.length === 0 && (
          <div className="asgn-td-center">История пуста</div>
        )}
        {!loading && items.length > 0 && (
          <div className="asgn-history">
            {items.map((h, i) => (
              <div key={h.id ?? i} className="asgn-history-row">
                <div className="asgn-history-time">{fmtDt(h.changedAt)}</div>
                <div className="asgn-history-change">
                  <span className={`asgn-badge ${STATUS_CLASS[h.oldStatus] || 'as-pending'}`}>
                    {STATUS_LABEL[h.oldStatus] || h.oldStatus || '—'}
                  </span>
                  <span className="asgn-history-arrow">→</span>
                  <span className={`asgn-badge ${STATUS_CLASS[h.newStatus] || 'as-pending'}`}>
                    {STATUS_LABEL[h.newStatus] || h.newStatus}
                  </span>
                </div>
                {h.reason && <div className="asgn-history-reason">{h.reason}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="asgn-modal-footer">
        <button type="button" className="asgn-btn-outline" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  </div>
)
