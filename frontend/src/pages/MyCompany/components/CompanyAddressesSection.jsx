import { Pagination } from '../../../components/common/Pagination'

const EditIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
  </svg>
)

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" fill="currentColor" />
  </svg>
)

export const CompanyAddressesSection = ({
  loading,
  company,
  addresses,
  total,
  search,
  page,
  pageSize,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h2>Адреса компании</h2>
          <p>Адреса, привязанные к компании</p>
        </div>
        <button
          type="button"
          className="company-btn-add"
          onClick={onAdd}
          disabled={loading || !company}
        >
          + Добавить адрес
        </button>
      </div>
      <div className="section-toolbar">
        <input
          type="text"
          placeholder="Поиск по улице, дому, квартире..."
          value={search}
          onChange={onSearchChange}
          className="company-search-input"
        />
      </div>
      <div className="company-table-wrapper">
        <table className="company-profile-table">
          <thead>
            <tr>
              <th>Улица</th>
              <th>Дом</th>
              <th>Квартира</th>
              <th>Подъезд</th>
              <th className="company-actions-col">Действия</th>
            </tr>
          </thead>
          <tbody>
            {addresses.length === 0 ? (
              <tr>
                <td colSpan={5} className="company-empty-row">Нет адресов</td>
              </tr>
            ) : (
              addresses.map(address => (
                <tr key={address.id}>
                  <td>{address.street}</td>
                  <td>{address.house || '—'}</td>
                  <td>{address.apartment || '—'}</td>
                  <td>{address.entrance || '—'}</td>
                  <td className="company-actions-col">
                    <button
                      type="button"
                      className="company-icon-btn"
                      title="Редактировать"
                      onClick={() => onEdit(address)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className="company-icon-btn danger"
                      title="Удалить"
                      onClick={() => onDelete(address)}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
