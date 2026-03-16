import ResultCard from "./ResultCard.jsx";

const SORT_OPTIONS = [
  { key: "peakResult", label: "Peak Score", numeric: true },
  { key: "baseResult", label: "Base Score", numeric: true },
  { key: "cores", label: "Cores", numeric: true },
  { key: "processorMhz", label: "MHz", numeric: true },
  { key: "processor", label: "Processor" },
  { key: "vendor", label: "Vendor" },
  { key: "benchmark", label: "Benchmark" },
  { key: "hwAvail", label: "HW Avail" },
];

export default function ResultsList({
  data,
  sortConfig,
  onSort,
  selected,
  onToggleSelection,
}) {
  const selectedIds = new Set(selected.map((s) => s.id));
  const selectedBenchmark = selected.length > 0 ? selected[0].benchmark : null;

  const handleSortKey = (e) => {
    const key = e.target.value;
    const opt = SORT_OPTIONS.find((o) => o.key === key);
    onSort({ key, direction: opt?.numeric ? "desc" : "asc" });
  };

  const toggleDirection = () => {
    onSort({
      key: sortConfig.key,
      direction: sortConfig.direction === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className="results-list">
      <div className="sort-controls">
        <label htmlFor="sort-select">Sort by</label>
        <select
          id="sort-select"
          value={sortConfig.key}
          onChange={handleSortKey}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="sort-direction-btn"
          onClick={toggleDirection}
          aria-label={`Sort ${sortConfig.direction === "asc" ? "descending" : "ascending"}`}
        >
          {sortConfig.direction === "asc" ? "\u25B2" : "\u25BC"}
        </button>
      </div>
      {data.map((row) => {
        const isSelected = selectedIds.has(row.id);
        const disabled =
          !isSelected &&
          (selected.length >= 2 ||
            (selectedBenchmark !== null &&
              row.benchmark !== selectedBenchmark));
        return (
          <ResultCard
            key={row.id}
            row={row}
            selected={isSelected}
            disabled={disabled}
            onToggle={onToggleSelection}
          />
        );
      })}
    </div>
  );
}
