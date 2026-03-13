import { useState } from 'react'
import { useCompanies } from './hooks/useCompanies'
import { CompaniesTable } from './components/CompaniesTable'
import { CompanyModal } from './components/CompanyModal'
import { Pagination } from '../../components/common/Pagination'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import './companiesPage.css'

export const CompaniesPage = () => {
  const {
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
  } = useCompanies(10)

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [modalError, setModalError] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    handleFilterChange({ ...filters, search: value })
  }

  const handleAddCompany = () => {
    setModalMode('create')
    setSelectedCompany(null)
    setModalOpen(true)
    setModalError(null)
  }

  const handleRowAction = (action, companyId) => {
    const company = companies.find(c => c.id === companyId)
    setSelectedCompany(company)
    setModalMode(action)
    setModalOpen(true)
    setModalError(null)
  }

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      const companyId = selectedIds[0]
      const company = companies.find(c => c.id === companyId)
      setSelectedCompany(company)
      setModalMode('edit')
      setModalOpen(true)
      setModalError(null)
    }
  }

  const handleView = () => {
    if (selectedIds.length === 1) {
      const companyId = selectedIds[0]
      const company = companies.find(c => c.id === companyId)
      setSelectedCompany(company)
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
        await handleUpdate(selectedCompany.id, formData)
      }
      setModalOpen(false)
      setSelectedCompany(null)
      setSearch('')
    } catch (err) {
      setModalError(err.message)
    }
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    setSelectedCompany(null)
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
    <div className="companies-page">
      <div className="companies-header">
        <h1>Список Компаний</h1>
      </div>

      {error && <div className="page-error">{error}</div>}

      {selectedIds.length === 0 ? (
        <div className="companies-toolbar">
          <div className="toolbar-left">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          <div className="toolbar-right">
            <button onClick={handleAddCompany} className="btn-add-user" disabled={loading}>
              + Добавить
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
            <button onClick={handleAddCompany} disabled={loading} className="btn-add-user">
              + Добавить
            </button>
          </div>
        </div>
      )}

      <CompaniesTable
        companies={companies}
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

      <CompanyModal
        isOpen={modalOpen}
        mode={modalMode}
        company={selectedCompany}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
        loading={loading}
        error={modalError}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title={selectedIds.length === 1
          ? `Удалить компанию "${companies.find(c => c.id === selectedIds[0])?.name}"?`
          : `Удалить ${selectedIds.length} компаний?`
        }
        message=""
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        loading={loading}
      />
    </div>
  )
}
