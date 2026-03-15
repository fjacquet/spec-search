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

export default function ResultsTable({ data, sortConfig, onSort }) {
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

  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>
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
          {data.map((row) => (
            <tr key={row.id}>
              {COLUMNS.map((col) => (
                <td key={col.key} className={col.numeric ? "num" : ""}>
                  {row[col.key] ?? "—"}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
