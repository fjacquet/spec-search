export default function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 p-3 max-[767px]:gap-1">
      <button
        type="button"
        className="btn enabled:hover:border-primary-500 enabled:hover:bg-primary-500 enabled:hover:text-white dark:enabled:hover:border-primary-300 dark:enabled:hover:bg-primary-300 dark:enabled:hover:text-surface-900 max-[767px]:min-h-11 max-[767px]:min-w-11"
        disabled={page <= 1}
        onClick={() => onPageChange(1)}
      >
        First
      </button>
      <button
        type="button"
        className="btn enabled:hover:border-primary-500 enabled:hover:bg-primary-500 enabled:hover:text-white dark:enabled:hover:border-primary-300 dark:enabled:hover:bg-primary-300 dark:enabled:hover:text-surface-900 max-[767px]:min-h-11 max-[767px]:min-w-11"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400 max-[767px]:order-first max-[767px]:mb-1 max-[767px]:w-full max-[767px]:text-center">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn enabled:hover:border-primary-500 enabled:hover:bg-primary-500 enabled:hover:text-white dark:enabled:hover:border-primary-300 dark:enabled:hover:bg-primary-300 dark:enabled:hover:text-surface-900 max-[767px]:min-h-11 max-[767px]:min-w-11"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
      <button
        type="button"
        className="btn enabled:hover:border-primary-500 enabled:hover:bg-primary-500 enabled:hover:text-white dark:enabled:hover:border-primary-300 dark:enabled:hover:bg-primary-300 dark:enabled:hover:text-surface-900 max-[767px]:min-h-11 max-[767px]:min-w-11"
        disabled={page >= totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        Last
      </button>
    </div>
  );
}
