export const DirectorProfileCard = ({
  director,
  directorEditMode,
  directorForm,
  loading,
  onEdit,
  onCancel,
  onSave,
  onChange,
}) => {
  return (
    <div className="profile-card">
      <div className="card-header">
        <div>
          <h2>Данные директора</h2>
          <p>Контактные данные директора</p>
        </div>
        {!directorEditMode ? (
          <button
            type="button"
            className="company-btn-outline"
            onClick={onEdit}
            disabled={loading || !director}
          >
            Редактировать
          </button>
        ) : (
          <div className="card-actions">
            <button
              type="button"
              className="company-btn-primary"
              onClick={onSave}
              disabled={loading}
            >
              Сохранить
            </button>
            <button
              type="button"
              className="company-btn-outline"
              onClick={onCancel}
              disabled={loading}
            >
              Отменить
            </button>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="field-row">
          <label>Имя</label>
          {directorEditMode ? (
            <input
              name="firstName"
              value={directorForm.firstName}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{director?.firstName || '—'}</span>
          )}
        </div>
        <div className="field-row">
          <label>Фамилия</label>
          {directorEditMode ? (
            <input
              name="lastName"
              value={directorForm.lastName}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{director?.lastName || '—'}</span>
          )}
        </div>
        <div className="field-row">
          <label>Email</label>
          {directorEditMode ? (
            <input
              name="email"
              value={directorForm.email}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{director?.email || '—'}</span>
          )}
        </div>
        <div className="field-row">
          <label>Телефон</label>
          {directorEditMode ? (
            <input
              name="phone"
              value={directorForm.phone}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{director?.phone || '—'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
