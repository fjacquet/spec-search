import { specUrl } from "../hooks/useSearch";
import { useSuite } from "../hooks/useSuite.js";

const BASE_COLUMNS = [
  { key: "benchmark", label: "Benchmark" },
  { key: "vendor", label: "Vendor" },
  { key: "system", label: "System" },
  { key: "processor", label: "Processor" },
  { key: "peakResult", label: null, numeric: true },
  { key: "baseResult", label: null, numeric: true },
  { key: "cores", label: "Cores", numeric: true },
  { key: "chips", label: "Chips", numeric: true },
  { key: "processorMhz", label: "MHz", numeric: true },
  { key: "hwAvail", label: "HW Avail" },
  { key: "published", label: "Published" },
];

function buildColumns(suite) {
  const cols = BASE_COLUMNS.map((col) => {
    if (col.key === "peakResult") return { ...col, label: suite.peakLabel };
    if (col.key === "baseResult") return { ...col, label: suite.baseLabel };
    return col;
  });
  // Insert extra columns before hwAvail
  const hwIdx = cols.findIndex((c) => c.key === "hwAvail");
  cols.splice(hwIdx, 0, ...suite.extraColumns);
  return cols;
}

export default function ResultsTable({
  data,
  sortConfig,
  onSort,
  selected = [],
  onToggleSelection,
}) {
  const suite = useSuite();
  const COLUMNS = buildColumns(suite);
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
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const isDisabled = (row) => {
    if (selectedIds.has(row.id)) return false;
    if (selected.length >= 2) return true;
    if (selectedBenchmark !== null && row.benchmark !== selectedBenchmark)
      return true;
    return false;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-surface-700">
      <table className="w-full border-collapse text-[0.85rem] max-[479px]:text-xs">
        <thead>
          <tr>
            <th
              className="w-10 text-center sticky top-0 cursor-pointer select-none whitespace-nowrap border-b-2 border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold hover:text-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:hover:text-primary-300 max-[479px]:px-2 max-[479px]:py-1.5"
              aria-label="Select for comparison"
            />
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="sticky top-0 cursor-pointer select-none whitespace-nowrap border-b-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold hover:text-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:hover:text-primary-300 max-[479px]:px-2 max-[479px]:py-1.5"
              >
                {col.label}
                <span className="ml-1 text-[0.7rem]">
                  {sortIndicator(col.key)}
                </span>
              </th>
            ))}
            <th className="sticky top-0 cursor-pointer select-none whitespace-nowrap border-b-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold hover:text-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:hover:text-primary-300 max-[479px]:px-2 max-[479px]:py-1.5">
              Link
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const checked = selectedIds.has(row.id);
            const disabled = isDisabled(row);
            return (
              <tr
                key={row.id}
                className={`hover:bg-primary-50 dark:hover:bg-surface-700 ${checked ? "bg-primary-50 dark:bg-surface-700" : ""}`}
              >
                <td className="w-10 text-center whitespace-nowrap border-b border-slate-200 px-3 py-2 dark:border-surface-700 max-[479px]:px-2 max-[479px]:py-1.5">
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
                    className="h-[18px] w-[18px] cursor-pointer accent-primary-500"
                  />
                </td>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap border-b border-slate-200 px-3 py-2 dark:border-surface-700 max-[479px]:px-2 max-[479px]:py-1.5 ${col.numeric ? "num" : ""}`}
                  >
                    {col.key === "benchmark" ? (
                      <span title={row[col.key]}>
                        {suite.benchmarkLabels[row[col.key]] ??
                          row[col.key] ??
                          "—"}
                      </span>
                    ) : (
                      (row[col.key] ?? "—")
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap border-b border-slate-200 px-3 py-2 dark:border-surface-700 max-[479px]:px-2 max-[479px]:py-1.5">
                  {row.resultUrl ? (
                    <a
                      href={specUrl(row.resultUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 no-underline hover:underline dark:text-primary-300"
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
