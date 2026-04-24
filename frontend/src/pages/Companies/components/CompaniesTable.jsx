import './companiesTable.css'

export const CompaniesTable = ({
  companies,
  selectedIds,
  onSelectionChange,
  onRowAction,
  loading,
}) => {
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(companies.map(c => c.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id, e) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(cid => cid !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleRowClick = (companyId, e) => {
    if (e.target.type === 'checkbox') return
    onRowAction('view', companyId)
  }

  if (companies.length === 0) {
    return (
      <div className="companies-empty">
        <p>Нет компаний</p>
      </div>
    )
  }

  return (
    <div className="companies-table-wrapper">
      <table className="companies-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                checked={companies.length > 0 && selectedIds.length === companies.length}
                onChange={handleSelectAll}
                disabled={loading}
              />
            </th>
            <th className="number-col">#</th>
            <th className="director-col">ДИРЕКТОР</th>
            <th className="bin-col">БИН</th>
            <th className="company-col">КОМПАНИЯ</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, idx) => (
            <tr
              key={company.id}
              className={selectedIds.includes(company.id) ? 'selected' : ''}
              onClick={e => handleRowClick(company.id, e)}
            >
              <td className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(company.id)}
                  onChange={e => handleSelectOne(company.id, e)}
                  disabled={loading}
                />
              </td>
              <td className="number-col">{idx + 1}</td>
              <td className="director-col">
                <span className="director-primary">{company.director || 'Not assigned'}</span>
                {company.directorId && (
                  <span className="director-secondary">{company.directorId}</span>
                )}
              </td>
              <td className="bin-col">{company.bin}</td>
              <td className="company-col">
                <span className="company-col-primary">{company.name}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
