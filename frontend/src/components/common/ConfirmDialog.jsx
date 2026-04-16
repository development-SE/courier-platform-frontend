import './ConfirmDialog.css'

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  messageTone = 'default',
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon" aria-hidden="true">
          <img src="/src/assets/trash.png" alt="" className="confirm-icon-img" />
        </div>

        <div className="confirm-body">
          <h3 className="confirm-title">{title}</h3>
          {message && (
            <p className={`confirm-message confirm-message-${messageTone}`}>
              {message}
            </p>
          )}
        </div>

        <div className="confirm-footer">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-confirm"
          >
            {loading ? '\u0423\u0434\u0430\u043b\u044f\u044e...' : '\u0414\u0430'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-cancel"
          >
            {'\u041d\u0435\u0442'}
          </button>
        </div>
      </div>
    </div>
  )
}
