export default function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(1)}
      >
        First
      </button>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <span className="page-info">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        Last
      </button>
    </div>
  );
}
