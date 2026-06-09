import './usersTable.css'

export const UsersTable = ({
  users,
  selectedIds,
  onSelectionChange,
  onRowAction,
  loading,
}) => {
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(users.map(u => u.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id, e) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleRowClick = (userId, e) => {
    if (e.target.type === 'checkbox') return
    onRowAction('view', userId)
  }

  if (users.length === 0) {
    return (
      <div className="users-empty">
        <p>Нет пользователей</p>
      </div>
    )
  }

  const getRoleClass = (role) => {
    const normalizedRole = role?.toUpperCase()
    const classes = {
      DIRECTOR: 'director',
      MANAGER: 'manager',
      COURIER: 'courier',
      USER: 'user',
    }
    return classes[normalizedRole] || 'user'
  }

  const getRoleLabel = (role) => {
    const normalizedRole = role?.toUpperCase()
    const labels = {
      DIRECTOR: 'DIRECTOR',
      MANAGER: 'MANAGER',
      COURIER: 'COURIER',
      USER: 'USER',
    }
    return labels[normalizedRole] || role
  }

  return (
    <div className="users-table-wrapper">
      <table className="users-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                checked={users.length > 0 && selectedIds.length === users.length}
                onChange={handleSelectAll}
                disabled={loading}
              />
            </th>
            <th className="number-col">#</th>
            <th className="name-col">ИМЯ</th>
            <th className="email-col">EMAIL</th>
            <th className="phone-col">ТЕЛЕФОН</th>
            <th className="company-col">КОМПАНИЯ</th>
            <th className="role-col">РОЛЬ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr
              key={user.id}
              className={selectedIds.includes(user.id) ? 'selected' : ''}
              onClick={e => handleRowClick(user.id, e)}
            >
              <td className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={e => handleSelectOne(user.id, e)}
                  disabled={loading}
                />
              </td>
              <td className="number-col">{idx + 1}</td>
              <td className="name-col">
                <span className="name-col-primary">
                  {user.firstName} {user.lastName}
                </span>
                <span className="name-col-secondary">{user.id}</span>
              </td>
              <td className="email-col">{user.email}</td>
              <td className="phone-col">{user.phone}</td>
              <td className="company-col">
                <span className="company-col-primary">{user.companyName || '---'}</span>
                {user.companyBin && (
                  <span className="company-col-secondary">{user.companyBin}</span>
                )}
              </td>
              <td className="role-col">
                <span className={`role-badge ${getRoleClass(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
