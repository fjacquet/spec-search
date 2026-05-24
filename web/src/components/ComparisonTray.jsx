export default function ComparisonTray({ selected, onCompare, onClear }) {
  return (
    <section
      className="fixed inset-x-0 bottom-0 z-[100] flex items-center gap-4 border-t-2 border-primary-500 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] dark:border-primary-300 dark:bg-surface-900 max-[767px]:flex-col max-[767px]:gap-2 max-[767px]:px-3 max-[767px]:py-2"
      aria-label="Selected systems for comparison"
    >
      <div className="flex flex-1 gap-2 overflow-hidden text-[0.85rem] max-[767px]:w-full max-[767px]:flex-col">
        {selected.map((s, i) => (
          <span
            key={s.id}
            className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-200 bg-slate-50 px-2 py-1 dark:border-surface-700 dark:bg-surface-800 max-[767px]:max-w-none"
          >
            {selected.length === 2
              ? `${i === 0 ? "As-Is" : "To-Be"}: ${s.processor ?? "Unknown"}`
              : (s.processor ?? "Unknown")}
          </span>
        ))}
      </div>
      <div className="flex gap-2 max-[767px]:w-full">
        <button
          type="button"
          className="btn btn-primary whitespace-nowrap px-4 max-[767px]:min-h-11 max-[767px]:flex-1"
          onClick={onCompare}
          disabled={selected.length !== 2}
        >
          Compare
        </button>
        <button
          type="button"
          className="btn whitespace-nowrap px-4 max-[767px]:min-h-11 max-[767px]:flex-1"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </section>
  );
}
