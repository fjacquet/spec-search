import { useState } from "react";

export default function FilterBar({
  facets,
  filters,
  onChange,
  onClear,
  collapsible,
}) {
  const [expanded, setExpanded] = useState(false);
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const activeCount = Object.values(filters).filter((v) => v !== "").length;

  const barClass = [
    "filter-bar",
    collapsible ? "filter-bar--collapsible" : "",
    collapsible && !expanded ? "filter-bar--collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const filterContent = (
    <>
      <div className="filter-group">
        <label htmlFor="filter-benchmark">Benchmark</label>
        <select
          id="filter-benchmark"
          value={filters.benchmark}
          onChange={(e) => update("benchmark", e.target.value)}
        >
          <option value="">All</option>
          {facets.benchmarks.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-vendor">Vendor</label>
        <select
          id="filter-vendor"
          value={filters.vendor}
          onChange={(e) => update("vendor", e.target.value)}
        >
          <option value="">All</option>
          {facets.vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-processor">Processor</label>
        <input
          id="filter-processor"
          type="text"
          placeholder="e.g. Xeon Gold 6526Y"
          value={filters.processor}
          onChange={(e) => update("processor", e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="filter-system">System</label>
        <input
          id="filter-system"
          type="text"
          placeholder="e.g. R770"
          value={filters.system}
          onChange={(e) => update("system", e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="filter-min-cores">Cores</label>
        <div className="filter-range">
          <input
            id="filter-min-cores"
            type="number"
            placeholder="Min"
            value={filters.minCores}
            onChange={(e) => update("minCores", e.target.value)}
          />
          <span>-</span>
          <input
            id="filter-max-cores"
            type="number"
            placeholder="Max"
            value={filters.maxCores}
            onChange={(e) => update("maxCores", e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-min-peak">Min Peak Score</label>
        <input
          id="filter-min-peak"
          type="number"
          placeholder="0"
          value={filters.minPeak}
          onChange={(e) => update("minPeak", e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="filter-min-base">Min Base Score</label>
        <input
          id="filter-min-base"
          type="number"
          placeholder="0"
          value={filters.minBase}
          onChange={(e) => update("minBase", e.target.value)}
        />
      </div>

      <div className="filter-actions">
        <button type="button" className="btn-clear" onClick={onClear}>
          Clear Filters
        </button>
      </div>
    </>
  );

  return (
    <div className={barClass}>
      {collapsible && (
        <button
          type="button"
          className="filter-toggle"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls="filter-content"
        >
          <span>
            Filters
            {activeCount > 0 && (
              <span className="filter-badge">{activeCount}</span>
            )}
          </span>
          <span className="chevron">{"\u25BC"}</span>
        </button>
      )}
      {collapsible ? (
        <div className="filter-content" id="filter-content">
          {filterContent}
        </div>
      ) : (
        filterContent
      )}
    </div>
  );
}
