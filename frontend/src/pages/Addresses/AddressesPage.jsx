import { useState } from 'react'
import { useAddresses } from './hooks/useAddresses'
import { AddressesTable } from './components/AddressesTable'
import { AddressModal } from './components/AddressModal'
import { Pagination } from '../../components/common/Pagination'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import './addressesPage.css'

export const AddressesPage = () => {
  const {
    addresses,
    companies,
    users,
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
  } = useAddresses(10)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [modalError, setModalError] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    handleFilterChange({ ...filters, search: value })
  }

  const handleTypeFilterChange = (value) => {
    handleFilterChange({ ...filters, type: value })
  }

  const handleClearFilters = () => {
    setSearch('')
    handleFilterChange({ search: '', type: '' })
  }

  const handleAddAddress = () => {
    setModalMode('create')
    setSelectedAddress(null)
    setModalOpen(true)
    setModalError(null)
  }

  const handleRowAction = (action, addressId) => {
    const address = addresses.find(a => a.id === addressId)
    setSelectedAddress(address)
    setModalMode(action)
    setModalOpen(true)
    setModalError(null)
  }

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      const addressId = selectedIds[0]
      const address = addresses.find(a => a.id === addressId)
      setSelectedAddress(address)
      setModalMode('edit')
      setModalOpen(true)
      setModalError(null)
    }
  }

  const handleView = () => {
    if (selectedIds.length === 1) {
      const addressId = selectedIds[0]
      const address = addresses.find(a => a.id === addressId)
      setSelectedAddress(address)
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
        await handleUpdate(selectedAddress.id, formData)
      }
      setModalOpen(false)
      setSelectedAddress(null)
      setSearch('')
    } catch (err) {
      setModalError(err.message)
    }
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    setSelectedAddress(null)
    setModalError(null)
  }

  const handleDeleteClick = () => {
    if (selectedIds.length > 0) {
      setDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      for (const id of selectedIds) {
        await handleDelete(id)
      }
      setDeleteConfirmOpen(false)
      setSelectedIds([])
    } catch (err) {
      setModalError(err.message)
    }
  }

  return (
    <div className="addresses-page">
      <div className="addresses-header">
        <h1>Список адресов</h1>
      </div>

      {error && <div className="page-error">{error}</div>}

      {selectedIds.length === 0 ? (
        <div className="addresses-toolbar">
          <div className="toolbar-left">
            <div className="filter-wrap">
              <button
                className="filter-btn"
                disabled={loading}
                title="Фильтры"
                onClick={() => setFiltersOpen(prev => !prev)}
                aria-expanded={filtersOpen}
                aria-controls="addresses-filters"
              >
                <img src="/src/assets/filter.png" alt="Filter" width={15} height={15} />
              </button>
              {filtersOpen && (
                <div id="addresses-filters" className="filter-popover">
                  <div className="filter-popover-title">Фильтры</div>
                  <div className="filter-row">
                    <span className="filter-label">Тип</span>
                    <div className="filter-chips">
                      <button
                        type="button"
                        className={`chip ${filters.type === '' ? 'active' : ''}`}
                        onClick={() => handleTypeFilterChange('')}
                      >
                        Все
                      </button>
                      <button
                        type="button"
                        className={`chip ${filters.type === 'company' ? 'active' : ''}`}
                        onClick={() => handleTypeFilterChange('company')}
                      >
                        Компания
                      </button>
                      <button
                        type="button"
                        className={`chip ${filters.type === 'user' ? 'active' : ''}`}
                        onClick={() => handleTypeFilterChange('user')}
                      >
                        Пользователь
                      </button>
                    </div>
                  </div>
                  <div className="filter-actions">
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
            </div>
            <div className="search-wrapper">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img" focusable="false">
                  <path
                    d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.71.71l.27.28v.79L20 20.5 21.5 19 15.5 14zM10 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={handleSearchChange}
                className="search-input with-icon"
              />
            </div>
          </div>
          <div className="toolbar-right">
            <button onClick={handleAddAddress} className="btn-add-user" disabled={loading}>
              + Добавить адрес
            </button>
          </div>
        </div>
      ) : (
        <div className="action-bar">
          <div className="action-left">
            <button
              onClick={handleDeleteClick}
              disabled={loading}
              className="action-btn-icon delete-icon"
              title="Удалить"
            >
              <img src="/src/assets/icon.png" alt="Logo" width={15} height={15} />
            </button>
            <span className="selection-info">{selectedIds.length} selected</span>
          </div>
          <div className="action-buttons">
            <button
              onClick={handleEdit}
              disabled={selectedIds.length !== 1 || loading}
              className="action-btn"
            >
              Редактировать
            </button>
            <button
              onClick={handleView}
              disabled={selectedIds.length !== 1 || loading}
              className="action-btn"
            >
              Посмотреть
            </button>
          </div>
        </div>
      )}

      <AddressesTable
        addresses={addresses}
        companies={companies}
        users={users}
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

      <AddressModal
        isOpen={modalOpen}
        mode={modalMode}
        address={selectedAddress}
        companies={companies}
        users={users}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
        loading={loading}
        error={modalError}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={selectedIds.length === 1
          ? `Удалить адрес №${selectedIds[0]}?`
          : `Удалить ${selectedIds.length} адресов?`
        }
        message=""
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        loading={loading}
      />
    </div>
  )
}

