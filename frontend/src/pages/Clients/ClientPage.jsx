import { useCallback, useEffect, useMemo, useState } from 'react'
import { usersApi } from '../../api/users.api'
import { Pagination } from '../../components/common/Pagination'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { ClientModal } from './components/ClientModal'
import './clientPage.css'

const formatDate = (value) => {
  if (!value) return '—'
  const ts = typeof value === 'number' ? value * 1000 : value
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const ClientPage = () => {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('view')
  const [selectedClient, setSelectedClient] = useState(null)
  const [modalError, setModalError] = useState(null)

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await usersApi.listClients({
        search,
        page: 1,
        pageSize: 1000,
      })
      setClients(result.items || [])
      setSelectedIds(prev => prev.filter(id => (result.items || []).some(c => c.id === id)))
    } catch (err) {
      setError(err.message || 'Не удалось загрузить клиентов')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    setPage(1)
  }, [search])

  const filteredClients = useMemo(() => {
    const query = (search || '').trim().toLowerCase()
    if (!query) return clients

    return clients.filter(client =>
      [client.firstName, client.lastName, client.email, client.phone]
        .some(value => String(value || '').toLowerCase().includes(query))
    )
  }, [clients, search])

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
      setSelectedIds(pagedClients.map(c => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleOne = (clientId, e) => {
    e.stopPropagation()
    setSelectedIds(prev => (
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    ))
  }

  const handleRowClick = (clientId, e) => {
    if (e.target.type === 'checkbox') return
    const client = clients.find(c => c.id === clientId)
    setSelectedClient(client)
    setModalMode('view')
    setModalOpen(true)
    setModalError(null)
  }

  const handleView = () => {
    if (selectedIds.length === 1) {
      const client = clients.find(c => c.id === selectedIds[0])
      setSelectedClient(client)
      setModalMode('view')
      setModalOpen(true)
      setModalError(null)
    }
  }

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      const client = clients.find(c => c.id === selectedIds[0])
      setSelectedClient(client)
      setModalMode('edit')
      setModalOpen(true)
      setModalError(null)
    }
  }

  const handleModalSave = async (formData) => {
    try {
      setModalError(null)
      // Update profile via auth API
      await usersApi.update(selectedClient.id, {
        ...formData,
        role: 'CLIENT',
      })
      setModalOpen(false)
      setSelectedClient(null)
      setSelectedIds([])
      await loadClients()
    } catch (err) {
      setModalError(err.message)
    }
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    setSelectedClient(null)
    setModalError(null)
  }

  const handleDeleteClick = () => {
    if (selectedIds.length > 0) {
      setDeleteError(null)
      setDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleteError(null)
      for (const id of selectedIds) {
        await usersApi.removeClient(id)
      }
      setDeleteConfirmOpen(false)
      setSelectedIds([])
      await loadClients()
    } catch (err) {
      setDeleteError(err.message)
    }
  }

  return (
    <div className="clients-page">
      <div className="clients-header">
        <h1>Clients</h1>
      </div>

      {error && <div className="clients-error">{error}</div>}

      <div className={`clients-toolbar ${selectedIds.length > 0 ? 'clients-toolbar-selected' : ''}`}>
        {selectedIds.length === 0 ? (
          <>
            <div className="clients-toolbar-left">
              <button
                className="clients-filter-btn"
                disabled={loading}
                title="Filter"
              >
                <img src="/src/assets/filter.png" alt="Filter" width={15} height={15} />
              </button>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="clients-search"
              />
            </div>
            <div className="clients-toolbar-right">
              <button
                type="button"
                className="clients-btn-refresh"
                onClick={loadClients}
                disabled={loading}
              >
                ↻ Обновить
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="clients-toolbar-left clients-action-left">
              <button
                onClick={handleDeleteClick}
                disabled={loading}
                className="action-btn-icon delete-icon"
                title="Удалить"
              >
                <img src="/src/assets/icon.png" alt="Delete" width={15} height={15} />
              </button>
              <span className="clients-selection-info">{selectedIds.length} selected</span>
            </div>
            <div className="clients-toolbar-right" style={{ gap: '0.6rem' }}>
              <button
                onClick={handleEdit}
                disabled={selectedIds.length !== 1 || loading}
                className="clients-secondary-btn"
              >
                Редактировать
              </button>
              <button
                onClick={handleView}
                disabled={selectedIds.length !== 1 || loading}
                className="clients-secondary-btn"
              >
                Посмотреть
              </button>
            </div>
          </>
        )}
      </div>

      {pagedClients.length === 0 && !loading ? (
        <div className="clients-empty-wrapper">
          <p>Нет клиентов</p>
        </div>
      ) : (
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
                <th>ИМЯ</th>
                <th>EMAIL</th>
                <th>ТЕЛЕФОН</th>
                <th>ДАТА РЕГИСТРАЦИИ</th>
              </tr>
            </thead>
            <tbody>
              {pagedClients.map((client, index) => (
                <tr
                  key={client.id}
                  className={selectedIds.includes(client.id) ? 'selected' : ''}
                  onClick={(e) => handleRowClick(client.id, e)}
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(client.id)}
                      onChange={(e) => handleToggleOne(client.id, e)}
                    />
                  </td>
                  <td className="number-col">{(page - 1) * pageSize + index + 1}</td>
                  <td className="client-name-cell">
                    <span className="client-name">
                      {client.firstName} {client.lastName}
                    </span>
                    <span className="client-subtext">{client.id}</span>
                  </td>
                  <td className="client-email-cell">{client.email || '—'}</td>
                  <td>{client.phone || '—'}</td>
                  <td>{formatDate(client.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      <ClientModal
        isOpen={modalOpen}
        mode={modalMode}
        client={selectedClient}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
        loading={loading}
        error={modalError}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={selectedIds.length === 1
          ? `Удалить клиента ${clients.find(c => c.id === selectedIds[0])?.firstName} ${clients.find(c => c.id === selectedIds[0])?.lastName}?`
          : `Удалить ${selectedIds.length} клиентов?`
        }
        message={deleteError || ''}
        messageTone={deleteError ? 'error' : 'default'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setDeleteError(null)
        }}
        loading={loading}
      />

      {loading && <div className="clients-loading">Загрузка...</div>}
    </div>
  )
}
