import { benchmarkLabel } from "../constants/benchmarks.js";
import { specUrl } from "../hooks/useSearch";

export default function ResultCard({ row, selected, disabled, onToggle }) {
  const isSelected = selected;

  return (
    <button
      type="button"
      className={`result-card${isSelected ? " result-card--selected" : ""}${disabled ? " result-card--disabled" : ""}`}
      onClick={() => !disabled && onToggle(row)}
      aria-pressed={isSelected}
      disabled={disabled}
    >
      <div className="result-card__processor">{row.processor ?? "—"}</div>
      <div className="result-card__system">
        {row.vendor ?? "—"} — {row.system ?? "—"}
      </div>
      <div className="result-card__scores">
        <span>
          Peak: <strong>{row.peakResult ?? "—"}</strong>
        </span>
        <span>
          Base: <strong>{row.baseResult ?? "—"}</strong>
        </span>
      </div>
      <div className="result-card__details">
        {row.cores ?? "—"} cores · {row.chips ?? "—"} chips ·{" "}
        {row.processorMhz ?? "—"} MHz
      </div>
      <div className="result-card__meta">
        <span className="result-card__benchmark" title={row.benchmark}>
          {benchmarkLabel(row.benchmark ?? "")}
        </span>
        <span>{row.hwAvail ?? "—"}</span>
        {row.resultUrl ? (
          <a
            href={specUrl(row.resultUrl)}
            target="_blank"
            rel="noopener noreferrer"
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
