import { specUrl } from "../hooks/useSearch";
import { useSuite } from "../hooks/useSuite.js";

export default function ResultCard({ row, selected, disabled, onToggle }) {
  const suite = useSuite();
  const isSelected = selected;

  return (
    <button
      type="button"
      className={`block w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-left text-inherit transition-[border-color,box-shadow] hover:border-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:hover:border-primary-300 ${isSelected ? "border-l-4 border-l-primary-500 bg-primary-50 dark:border-l-primary-300 dark:bg-surface-700" : ""} ${disabled ? "cursor-default opacity-50 hover:border-slate-200 dark:hover:border-surface-700" : ""}`}
      onClick={() => !disabled && onToggle(row)}
      aria-pressed={isSelected}
      disabled={disabled}
    >
      <div className="mb-0.5 text-[0.95rem] font-bold">
        {row.processor ?? "—"}
      </div>
      <div className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">
        {row.vendor ?? "—"} — {row.system ?? "—"}
      </div>
      <div className="mb-1 flex gap-4 text-sm">
        <span>
          {suite.peakLabel}:{" "}
          <strong className="text-primary-500 dark:text-primary-300">
            {row.peakResult ?? "—"}
          </strong>
        </span>
        <span>
          {suite.baseLabel}:{" "}
          <strong className="text-primary-500 dark:text-primary-300">
            {row.baseResult ?? "—"}
          </strong>
        </span>
      </div>
      <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
        {row.cores ?? "—"} cores · {row.chips ?? "—"} chips ·{" "}
        {row.processorMhz ?? "—"} MHz
      </div>
      <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span
          className="font-semibold text-slate-900 dark:text-slate-100"
          title={row.benchmark}
        >
          {suite.benchmarkLabels[row.benchmark] ?? row.benchmark ?? "—"}
        </span>
        <span>{row.hwAvail ?? "—"}</span>
        {row.resultUrl ? (
          <a
            href={specUrl(row.resultUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 no-underline hover:underline dark:text-primary-300"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </a>
        ) : (
          <span>—</span>
        )}
      </div>
    </button>
  );
}
