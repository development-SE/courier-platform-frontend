import './Pagination.css'

export const Pagination = ({ page, pageSize, total, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.ceil(total / pageSize)
  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endRecord = Math.min(page * pageSize, total)

  if (total === 0) return null

  return (
    <div className="pagination">
      <div className="pagination-left">
        <span className="pagination-info">
          {startRecord}-{endRecord} of {total}
        </span>
      </div>

      <div className="pagination-right">
        <label>
          Rows per page:{' '}
          <select value={pageSize} onChange={(e) => onPageSizeChange(parseInt(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="pagination-btn"
          title="Previous page"
        >
          ‹
        </button>

        <span className="pagination-page-info">{page}/{totalPages}</span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="pagination-btn"
          title="Next page"
        >
          ›
        </button>
      </div>
    </div>
  )
}