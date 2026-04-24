export const CompanyInfoCard = ({
  company,
  companyEditMode,
  companyForm,
  loading,
  canEdit = true,
  onEdit,
  onCancel,
  onSave,
  onChange,
}) => {
  return (
    <div className="profile-card">
      <div className="card-header">
        <div>
          <h2>{'\u0414\u0430\u043d\u043d\u044b\u0435 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438'}</h2>
          <p>{'\u041e\u0441\u043d\u043e\u0432\u043d\u0430\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438'}</p>
        </div>
        {!companyEditMode ? (
          canEdit && (
            <button
              type="button"
              className="company-btn-outline"
              onClick={onEdit}
              disabled={loading || !company}
            >
              {'\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c'}
            </button>
          )
        ) : (
          <div className="card-actions">
            <button
              type="button"
              className="company-btn-primary"
              onClick={onSave}
              disabled={loading}
            >
              {'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}
            </button>
            <button
              type="button"
              className="company-btn-outline"
              onClick={onCancel}
              disabled={loading}
            >
              {'\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c'}
            </button>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="field-row">
          <label>{'\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438'}</label>
          {companyEditMode ? (
            <input
              name="name"
              value={companyForm.name}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{company?.name || '-'}</span>
          )}
        </div>
        <div className="field-row">
          <label>{'\u0411\u0418\u041d'}</label>
          {companyEditMode ? (
            <input
              name="bin"
              value={companyForm.bin}
              onChange={onChange}
              className="input"
            />
          ) : (
            <span>{company?.bin || '-'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
