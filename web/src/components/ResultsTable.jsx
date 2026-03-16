import { benchmarkLabel } from "../constants/benchmarks.js";
import { specUrl } from "../hooks/useSearch";

const COLUMNS = [
  { key: "benchmark", label: "Benchmark" },
  { key: "vendor", label: "Vendor" },
  { key: "system", label: "System" },
  { key: "processor", label: "Processor" },
  { key: "peakResult", label: "Peak", numeric: true },
  { key: "baseResult", label: "Base", numeric: true },
  { key: "cores", label: "Cores", numeric: true },
  { key: "chips", label: "Chips", numeric: true },
  { key: "processorMhz", label: "MHz", numeric: true },
  { key: "hwAvail", label: "HW Avail" },
  { key: "published", label: "Published" },
];

export default function ResultsTable({
  data,
  sortConfig,
  onSort,
  selected = [],
  onToggleSelection,
}) {
  const selectedIds = new Set(selected.map((s) => s.id));
  const selectedBenchmark = selected.length > 0 ? selected[0].benchmark : null;

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      onSort({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      const col = COLUMNS.find((c) => c.key === key);
      onSort({ key, direction: col?.numeric ? "desc" : "asc" });
    }
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? "\u25B2" : "\u25BC";
  };

  const isDisabled = (row) => {
    if (selectedIds.has(row.id)) return false;
    if (selected.length >= 2) return true;
    if (selectedBenchmark !== null && row.benchmark !== selectedBenchmark)
      return true;
    return false;
  };

  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>
            <th className="checkbox-cell" aria-label="Select for comparison" />
            {COLUMNS.map((col) => (
              <th key={col.key} onClick={() => handleSort(col.key)}>
                {col.label}
                <span className="sort-indicator">{sortIndicator(col.key)}</span>
              </th>
            ))}
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const checked = selectedIds.has(row.id);
            const disabled = isDisabled(row);
            return (
              <tr key={row.id} className={checked ? "row--selected" : ""}>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggleSelection(row)}
                    aria-label={`Compare ${row.processor ?? "system"}`}
                    title={
                      disabled &&
                      selectedBenchmark &&
                      row.benchmark !== selectedBenchmark
                        ? "Same benchmark required"
                        : undefined
                    }
                  />
                </td>
                {COLUMNS.map((col) => (
                  <td key={col.key} className={col.numeric ? "num" : ""}>
                    {col.key === "benchmark" ? (
                      <span title={row[col.key]}>
                        {benchmarkLabel(row[col.key] ?? "")}
                      </span>
                    ) : (
                      (row[col.key] ?? "—")
                    )}
                  </td>
                ))}
                <td>
                  {row.resultUrl ? (
                    <a
                      href={specUrl(row.resultUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
