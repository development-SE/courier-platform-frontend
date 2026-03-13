export const CompanyInfoCard = ({
  company,
  companyEditMode,
  companyForm,
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
          <h2>Данные компании</h2>
          <p>Основная информация компании</p>
        </div>
        {!companyEditMode ? (
          <button
            type="button"
            className="company-btn-outline"
            onClick={onEdit}
            disabled={loading || !company}
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
          <label>Название компании</label>
          {companyEditMode ? (
            <input
              name="name"
              value={companyForm.name}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{company?.name || '—'}</span>
          )}
        </div>
        <div className="field-row">
          <label>БИН</label>
          {companyEditMode ? (
            <input
              name="bin"
              value={companyForm.bin}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{company?.bin || '—'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
