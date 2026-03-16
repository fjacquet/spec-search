import { benchmarkLabel } from "../constants/benchmarks.js";
import { useMediaQuery } from "../hooks/useMediaQuery";
import BarChart from "./BarChart.jsx";
import RadarChart from "./RadarChart.jsx";

const FIELDS = [
  { key: "processor", label: "Processor" },
  { key: "vendor", label: "Vendor" },
  { key: "system", label: "System" },
  { key: "benchmark", label: "Benchmark" },
  { key: "peakResult", label: "Peak Score", numeric: true },
  { key: "baseResult", label: "Base Score", numeric: true },
  { key: "cores", label: "Cores", numeric: true },
  { key: "chips", label: "Chips", numeric: true },
  { key: "threadsPerCore", label: "Threads/Core", numeric: true },
  { key: "processorMhz", label: "MHz", numeric: true },
  { key: "memory", label: "Memory" },
  { key: "os", label: "OS" },
  { key: "hwAvail", label: "HW Available" },
  { key: "published", label: "Published" },
];

function formatValue(field, val) {
  if (val == null) return "—";
  if (field.key === "benchmark") return benchmarkLabel(val);
  return val;
}

function formatDelta(a, b) {
  if (a == null || b == null) return null;
  const diff = a - b;
  const pct = b !== 0 ? ((diff / b) * 100).toFixed(1) : null;
  const sign = diff > 0 ? "+" : "";
  return { diff, sign, pct };
}

function DesktopGrid({ systems }) {
  const [a, b] = systems;

  return (
    <div className="comparison-grid">
      <div className="comparison-grid__col-header" />
      <div className="comparison-grid__col-header">
        {a.processor ?? "System A"}
      </div>
      <div className="comparison-grid__col-header">
        {b.processor ?? "System B"}
      </div>

      {FIELDS.map((field) => {
        const valA = a[field.key];
        const valB = b[field.key];
        const delta = field.numeric ? formatDelta(valA, valB) : null;

        let classA = "comparison-grid__value";
        let classB = "comparison-grid__value";
        if (delta && delta.diff > 0) {
          classA += " comparison-grid__value--better";
          classB += " comparison-grid__value--worse";
        } else if (delta && delta.diff < 0) {
          classA += " comparison-grid__value--worse";
          classB += " comparison-grid__value--better";
        }

        return (
          <div key={field.key} style={{ display: "contents" }}>
            <div className="comparison-grid__label">{field.label}</div>
            <div className={classA}>
              {formatValue(field, valA)}
              {delta && delta.diff !== 0 && (
                <span className="comparison-grid__delta">
                  ({delta.sign}
                  {delta.diff}
                  {delta.pct ? `, ${delta.sign}${delta.pct}%` : ""})
                </span>
              )}
            </div>
            <div className={classB}>{formatValue(field, valB)}</div>
          </div>
        );
      })}
    </div>
  );
}

function MobileComparison({ systems }) {
  const [a, b] = systems;

  const numericFields = FIELDS.filter((f) => f.numeric);

  return (
    <div>
      {systems.map((sys, i) => (
        <div key={sys.id} className="comparison-mobile-card">
          <h3>
            System {i + 1}: {sys.processor ?? "Unknown"}
          </h3>
          {FIELDS.map((field) => (
            <div key={field.key} className="comparison-mobile-row">
              <span className="comparison-mobile-row__label">
                {field.label}
              </span>
              <span>{formatValue(field, sys[field.key])}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="comparison-delta-section">
        <h3>Differences</h3>
        {numericFields.map((field) => {
          const delta = formatDelta(a[field.key], b[field.key]);
          if (!delta || delta.diff === 0) return null;
          return (
            <div key={field.key} className="comparison-mobile-row">
              <span className="comparison-mobile-row__label">
                {field.label}
              </span>
              <span
                className={
                  delta.diff > 0
                    ? "comparison-grid__value--better"
                    : "comparison-grid__value--worse"
                }
              >
                {delta.sign}
                {delta.diff}
                {delta.pct ? ` (${delta.sign}${delta.pct}%)` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparisonView({ systems, onClose }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="comparison-view">
      <div className="comparison-view__header">
        <h2>System Comparison</h2>
        <button
          type="button"
          className="comparison-view__close"
          onClick={onClose}
        >
          Back to Results
        </button>
      </div>

      <div className="comparison-charts">
        <RadarChart systems={systems} />
        <BarChart systems={systems} />
      </div>

      {isDesktop ? (
        <DesktopGrid systems={systems} />
      ) : (
        <MobileComparison systems={systems} />
      )}
    </div>
  );
}
