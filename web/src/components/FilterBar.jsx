import { useState } from "react";
import { useSuite } from "../hooks/useSuite.js";

export default function FilterBar({
  facets,
  filters,
  onChange,
  onClear,
  collapsible,
}) {
  const suite = useSuite();
  const [expanded, setExpanded] = useState(false);
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const activeCount = Object.values(filters).filter((v) => v !== "").length;

  const filterContent = (
    <>
      <div className="flex flex-col gap-1 max-[767px]:w-full">
        <label
          htmlFor="filter-benchmark"
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
        >
          Benchmark
        </label>
        <select
          id="filter-benchmark"
          value={filters.benchmark}
          onChange={(e) => update("benchmark", e.target.value)}
          className="field max-[767px]:min-h-11 max-[767px]:w-full max-[767px]:text-base"
        >
          <option value="">All</option>
          {facets.benchmarks.map((b) => (
            <option key={b} value={b}>
              {suite.benchmarkLabels[b] ?? b} ({b})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 max-[767px]:w-full">
        <label
          htmlFor="filter-vendor"
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
        >
          Vendor
        </label>
        <select
          id="filter-vendor"
          value={filters.vendor}
          onChange={(e) => update("vendor", e.target.value)}
          className="field max-[767px]:min-h-11 max-[767px]:w-full max-[767px]:text-base"
        >
          <option value="">All</option>
          {facets.vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 max-[767px]:w-full">
        <label
          htmlFor="filter-processor"
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
        >
          Processor
        </label>
        <input
          id="filter-processor"
          type="text"
          placeholder="e.g. Xeon Gold 6526Y"
          value={filters.processor}
          onChange={(e) => update("processor", e.target.value)}
          className="field w-[200px] max-[767px]:min-h-11 max-[767px]:w-full max-[767px]:text-base"
        />
      </div>

      <div className="flex flex-col gap-1 max-[767px]:w-full">
        <label
          htmlFor="filter-system"
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
        >
          System
        </label>
        <input
          id="filter-system"
          type="text"
          placeholder="e.g. R770"
          value={filters.system}
          onChange={(e) => update("system", e.target.value)}
          className="field w-[200px] max-[767px]:min-h-11 max-[767px]:w-full max-[767px]:text-base"
        />
      </div>

      <div className="flex flex-col gap-1 max-[767px]:w-full">
        <label
          htmlFor="filter-min-cores"
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
        >
          Cores
        </label>
        <div className="flex items-center gap-1 max-[767px]:gap-2">
          <input
            id="filter-min-cores"
            type="number"
            placeholder="Min"
            value={filters.minCores}
            onChange={(e) => update("minCores", e.target.value)}
            className="field w-[90px] max-[767px]:w-auto max-[767px]:min-h-11 max-[767px]:text-base max-[767px]:flex-1 max-[767px]:min-w-0"
          />
          <span>-</span>
          <input
            id="filter-max-cores"
            type="number"
            placeholder="Max"
            value={filters.maxCores}
            onChange={(e) => update("maxCores", e.target.value)}
            className="field w-[90px] max-[767px]:w-auto max-[767px]:min-h-11 max-[767px]:text-base max-[767px]:flex-1 max-[767px]:min-w-0"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 max-[767px]:w-full">
        <label
          htmlFor="filter-min-peak"
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
        >
          Min {suite.peakLabel}
        </label>
        <input
          id="filter-min-peak"
          type="number"
          placeholder="0"
          value={filters.minPeak}
          onChange={(e) => update("minPeak", e.target.value)}
          className="field w-[90px] max-[767px]:w-auto max-[767px]:min-h-11 max-[767px]:text-base"
        />
      </div>

      <div className="flex flex-col gap-1 max-[767px]:w-full">
        <label
          htmlFor="filter-min-base"
          className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
        >
          Min {suite.baseLabel}
        </label>
        <input
          id="filter-min-base"
          type="number"
          placeholder="0"
          value={filters.minBase}
          onChange={(e) => update("minBase", e.target.value)}
          className="field w-[90px] max-[767px]:w-auto max-[767px]:min-h-11 max-[767px]:text-base"
        />
      </div>

      <div className="flex items-end max-[767px]:w-full">
        <button
          type="button"
          className="btn max-[767px]:min-h-11 max-[767px]:w-full max-[767px]:text-base"
          onClick={onClear}
        >
          Clear Filters
        </button>
      </div>
    </>
  );

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-surface-700 dark:bg-surface-800 md:flex-row md:flex-wrap md:gap-3 md:p-4">
      {collapsible && (
        <button
          type="button"
          className="flex min-h-11 w-full cursor-pointer items-center justify-between border-none bg-transparent px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls="filter-content"
        >
          <span>
            Filters
            {activeCount > 0 && (
              <span className="ml-2 rounded-[10px] bg-primary-500 px-1.5 py-0.5 text-[0.7rem] text-white dark:bg-primary-300 dark:text-surface-900">
                {activeCount}
              </span>
            )}
          </span>
          <span
            className={`transition-transform ${expanded ? "" : "-rotate-90"}`}
          >
            {"▼"}
          </span>
        </button>
      )}
      {collapsible ? (
        <div
          className={`flex flex-col gap-2 overflow-hidden transition-all ${expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
          id="filter-content"
        >
          {filterContent}
        </div>
      ) : (
        filterContent
      )}
    </div>
  );
}
