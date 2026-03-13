import './addressesTable.css'

export const AddressesTable = ({
  addresses,
  companies,
  users,
  selectedIds,
  onSelectionChange,
  onRowAction,
  loading,
}) => {
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(addresses.map(a => a.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id, e) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(aid => aid !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleRowClick = (addressId, e) => {
    if (e.target.type === 'checkbox') return
    onRowAction('view', addressId)
  }

  const getOwnerInfo = (address) => {
    if (address.type === 'company') {
      const company = companies.find(c => c.id === address.ownerId)
      return {
        name: company?.name || '—',
        meta: company?.bin || '',
      }
    }
    const user = users.find(u => u.id === address.ownerId)
    return {
      name: user ? `${user.firstName} ${user.lastName}` : '—',
      meta: user?.email || '',
    }
  }

  if (addresses.length === 0) {
    return (
      <div className="addresses-empty">
        <p>Нет адресов</p>
      </div>
    )
  }

  return (
    <div className="addresses-table-wrapper">
      <table className="addresses-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                checked={addresses.length > 0 && selectedIds.length === addresses.length}
                onChange={handleSelectAll}
                disabled={loading}
              />
            </th>
            <th className="number-col">#</th>
            <th className="street-col">УЛИЦА</th>
            <th className="house-col">ДОМ</th>
            <th className="apartment-col">КВАРТИРА</th>
            <th className="entrance-col">ПОДЪЕЗД</th>
            <th className="owner-col">КОМПАНИЯ/ПОЛЬЗОВАТЕЛЬ</th>
          </tr>
        </thead>
        <tbody>
          {addresses.map((address, idx) => {
            const ownerInfo = getOwnerInfo(address)
            return (
            <tr
              key={address.id}
              className={selectedIds.includes(address.id) ? 'selected' : ''}
              onClick={e => handleRowClick(address.id, e)}
            >
              <td className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(address.id)}
                  onChange={e => handleSelectOne(address.id, e)}
                  disabled={loading}
                />
              </td>
              <td className="number-col">{idx + 1}</td>
              <td className="street-col">
                <span className="street-primary">{address.street}</span>
                <span className="street-secondary">{address.id}</span>
              </td>
              <td className="house-col">{address.house || '—'}</td>
              <td className="apartment-col">{address.apartment || '—'}</td>
              <td className="entrance-col">{address.entrance || '—'}</td>
              <td className="owner-col">
                <span className="owner-primary">{ownerInfo.name}</span>
                {ownerInfo.meta && (
                  <span className="owner-secondary">{ownerInfo.meta}</span>
                )}
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}

