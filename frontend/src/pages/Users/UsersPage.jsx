import { useEffect, useState } from 'react'
import { useUsers } from './hooks/useUsers'
import { UsersTable } from './components/UsersTable'
import { UserModal } from './components/UserModal'
import { Pagination } from '../../components/common/Pagination'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { auth } from '../../utils/auth'
import './usersPage.css'

export const UsersPage = () => {
  const session = auth.getSession()
  const role = session?.role || ''
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isAdmin = role === 'ADMIN' || isSuperAdmin
  const isDirector = role === 'DIRECTOR'
  const isManager = role === 'MANAGER'
  const pageTitle = 'Employees'
  const {
    users,
    companies,
    loading,
    error,
    total,
    filters,
    page,
    pageSize,
    selectedIds,
    setSelectedIds,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useUsers(10, { canViewAdmins: false })

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalError, setModalError] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isAdminUsersView = false

  useEffect(() => {
    const defaultRole = isAdmin ? '' : isDirector ? '' : 'COURIER'
    const allowedRoles = isSuperAdmin
      ? ['', 'DIRECTOR', 'MANAGER', 'COURIER']
      : isAdmin
      ? ['', 'DIRECTOR', 'MANAGER', 'COURIER']
      : isDirector
      ? ['', 'MANAGER', 'COURIER']
      : ['COURIER']

    if (!allowedRoles.includes(filters.role)) {
      handleFilterChange({ ...filters, role: defaultRole })
    }
  }, [filters, handleFilterChange, isAdmin, isSuperAdmin, isDirector, isManager])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    handleFilterChange({ ...filters, search: value })
  }

  const handleRoleFilterChange = (e) => {
    if (!isAdmin) return
    const value = e.target.value
    handleFilterChange({ ...filters, role: value })
  }

  const handleCompanyFilterChange = (e) => {
    if (!isAdmin) return
    const value = e.target.value
    handleFilterChange({ ...filters, companyId: value })
  }

  const handleClearFilters = () => {
    setSearch('')
    handleFilterChange({ search: '', role: isAdmin ? '' : 'MANAGER', companyId: '' })
  }

  const handleAddUser = () => {
    setModalMode('create')
    setSelectedUser(null)
    setModalOpen(true)
    setModalError(null)
  }

  const handleRowAction = (action, userId) => {
    const user = users.find(u => u.id === userId)
    setSelectedUser(user)
    setModalMode(action)
    setModalOpen(true)
    setModalError(null)
  }

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      const userId = selectedIds[0]
      const user = users.find(u => u.id === userId)
      setSelectedUser(user)
      setModalMode('edit')
      setModalOpen(true)
      setModalError(null)
    }
  }

  const handleView = () => {
    if (selectedIds.length === 1) {
      const userId = selectedIds[0]
      const user = users.find(u => u.id === userId)
      setSelectedUser(user)
      setModalMode('view')
      setModalOpen(true)
      setModalError(null)
    }
  }

  const handleModalSave = async (formData) => {
    try {
      setModalError(null)
      if (modalMode === 'create') {
        await handleCreate(formData)
      } else {
        await handleUpdate(selectedUser.id, formData)
      }
      setModalOpen(false)
      setSelectedUser(null)
      setSearch('')
    } catch (err) {
      setModalError(err.message)
    }
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    setSelectedUser(null)
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
        const user = users.find(u => u.id === id)
        await handleDelete(id, user?.role)
      }
      setDeleteConfirmOpen(false)
      setSelectedIds([])
    } catch (err) {
      setDeleteError(err.message)
    }
  }

  const getCompanyInfo = (companyId) => {
    if (!companyId) return { name: '—', bin: '' }
    const company = companies.find(c => c.id === companyId)
    return {
      name: company?.name || '—',
      bin: company?.bin || '',
    }
  }

  const usersWithCompanyNames = users.map(user => {
    if (user.role === 'ADMIN' || user.role === 'COURIER' || user.role === 'USER') {
      return {
        ...user,
        companyName: '---',
        companyBin: '',
      }
    }
    const companyInfo = getCompanyInfo(user.companyId)
    return {
      ...user,
      companyName: companyInfo.name,
      companyBin: companyInfo.bin,
    }
  })

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>{pageTitle}</h1>
      </div>

      {error && <div className="page-error">{error}</div>}

      <div className={`users-toolbar ${selectedIds.length > 0 ? 'users-toolbar-selected' : ''}`}>
        {selectedIds.length === 0 ? (
          <>
            <div className="toolbar-left">
              <button
                className="filter-btn"
                disabled={loading}
                title="Filter"
                onClick={() => setFiltersOpen(prev => !prev)}
                aria-expanded={filtersOpen}
                aria-controls="users-filters"
              >
                <img src="/src/assets/filter.png" alt="Filter" width={15} height={15} />
              </button>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            <div className="toolbar-right">
              {!isManager && (
                <button onClick={handleAddUser} className="btn-add-user" disabled={loading || isAdminUsersView}>
                  + Добавить
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="toolbar-left action-left">
              {!isManager && (
                <button
                  onClick={handleDeleteClick}
                  disabled={loading}
                  className="action-btn-icon delete-icon"
                  title="Удалить"
                >
                  <img src="/src/assets/icon.png" alt="Logo" width={15} height={15} />
                </button>
              )}
              <span className="selection-info">{selectedIds.length} selected</span>
            </div>
            <div className="toolbar-right action-buttons">
              {!isManager && (
                <button
                  onClick={handleEdit}
                  disabled={selectedIds.length !== 1 || loading}
                  className="action-btn"
                >
                  Редактировать
                </button>
              )}
              <button
                onClick={handleView}
                disabled={selectedIds.length !== 1 || loading}
                className="action-btn"
              >
                Посмотреть
              </button>
            </div>
          </>
        )}
      </div>

      {selectedIds.length === 0 && filtersOpen && (
        <div id="users-filters" className="users-filters">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="roleFilter">Роль</label>
              <select
                id="roleFilter"
                value={filters.role}
                onChange={handleRoleFilterChange}
                disabled={loading || isManager}
              >
                {isSuperAdmin && (
                  <>
                    <option value="">Все роли</option>
                    <option value="DIRECTOR">Директор</option>
                    <option value="MANAGER">Менеджер</option>
                    <option value="COURIER">Курьер</option>
                  </>
                )}
                {isAdmin && !isSuperAdmin && (
                  <>
                    <option value="">Все роли</option>
                    <option value="DIRECTOR">Директор</option>
                    <option value="MANAGER">Менеджер</option>
                    <option value="COURIER">Курьер</option>
                  </>
                )}
                {isDirector && (
                  <>
                    <option value="">Все роли</option>
                    <option value="MANAGER">Менеджер</option>
                    <option value="COURIER">Курьер</option>
                  </>
                )}
                {isManager && (
                  <option value="COURIER">Курьер</option>
                )}
              </select>
            </div>
            {isAdmin && (
              <div className="filter-group">
                <label htmlFor="companyFilter">Компания</label>
                <select
                  id="companyFilter"
                  value={filters.companyId}
                  onChange={handleCompanyFilterChange}
                  disabled={loading}
                >
                  <option value="">Все компании</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="filters-actions">
            <button
              type="button"
              className="action-btn"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      <UsersTable
        users={usersWithCompanyNames}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowAction={handleRowAction}
        loading={loading}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <UserModal
        isOpen={modalOpen}
        mode={modalMode}
        user={selectedUser}
        companies={companies}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
        loading={loading}
        error={modalError}
      />
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={selectedIds.length === 1
          ? `Удалить пользователя ${users.find(u => u.id === selectedIds[0])?.firstName} ${users.find(u => u.id === selectedIds[0])?.lastName}?`
          : `Удалить ${selectedIds.length} пользователей?`
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

    </div>
  )
}
