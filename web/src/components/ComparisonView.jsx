import { useRef, useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSuite } from "../hooks/useSuite.js";
import BarChart, { prepareBarSvg } from "./BarChart.jsx";
import { exportToPptx } from "./exportPptx.js";
import RadarChart, { prepareRadarSvg } from "./RadarChart.jsx";

const BASE_FIELDS = [
  { key: "processor", label: "Processor" },
  { key: "vendor", label: "Vendor" },
  { key: "system", label: "System" },
  { key: "benchmark", label: "Benchmark" },
  { key: "peakResult", label: null, numeric: true },
  { key: "baseResult", label: null, numeric: true },
  { key: "cores", label: "Cores", numeric: true },
  { key: "chips", label: "Chips", numeric: true },
  { key: "threadsPerCore", label: "Threads/Core", numeric: true },
  { key: "processorMhz", label: "MHz", numeric: true },
  { key: "memory", label: "Memory" },
  { key: "os", label: "OS" },
  { key: "hwAvail", label: "HW Available" },
  { key: "published", label: "Published" },
];

function buildFields(suite) {
  const fields = BASE_FIELDS.map((f) => {
    if (f.key === "peakResult") return { ...f, label: suite.peakScoreLabel };
    if (f.key === "baseResult") return { ...f, label: suite.baseScoreLabel };
    return f;
  });
  // Insert extra fields before memory
  const memIdx = fields.findIndex((f) => f.key === "memory");
  fields.splice(memIdx, 0, ...suite.extraComparisonFields);
  return fields;
}

function formatValue(field, val, suite) {
  if (val == null) return "—";
  if (field.key === "benchmark") return suite.benchmarkLabels[val] ?? val;
  return val;
}

function formatDelta(a, b) {
  if (a == null || b == null) return null;
  const diff = a - b;
  const pct = b !== 0 ? ((diff / b) * 100).toFixed(1) : null;
  const sign = diff > 0 ? "+" : "";
  return { diff, sign, pct };
}

function DesktopGrid({ systems, fields, suite }) {
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

      {fields.map((field) => {
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
              {formatValue(field, valA, suite)}
              {delta && delta.diff !== 0 && (
                <span className="comparison-grid__delta">
                  ({delta.sign}
                  {delta.diff}
                  {delta.pct ? `, ${delta.sign}${delta.pct}%` : ""})
                </span>
              )}
            </div>
            <div className={classB}>{formatValue(field, valB, suite)}</div>
          </div>
        );
      })}
    </div>
  );
}

function MobileComparison({ systems, fields, suite }) {
  const [a, b] = systems;

  const numericFields = fields.filter((f) => f.numeric);

  return (
    <div>
      {systems.map((sys, i) => (
        <div key={sys.id} className="comparison-mobile-card">
          <h3>
            System {i + 1}: {sys.processor ?? "Unknown"}
          </h3>
          {fields.map((field) => (
            <div key={field.key} className="comparison-mobile-row">
              <span className="comparison-mobile-row__label">
                {field.label}
              </span>
              <span>{formatValue(field, sys[field.key], suite)}</span>
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

function exportToCsv(systems, fields, suite) {
  const [a, b] = systems;
  const header = [
    "Field",
    a.processor ?? "System A",
    b.processor ?? "System B",
  ];
  const rows = fields.map((f) => [
    f.label,
    f.key === "benchmark"
      ? (suite.benchmarkLabels[a[f.key]] ?? a[f.key] ?? "")
      : (a[f.key] ?? ""),
    f.key === "benchmark"
      ? (suite.benchmarkLabels[b[f.key]] ?? b[f.key] ?? "")
      : (b[f.key] ?? ""),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    `comparison-${a.processor ?? "A"}-vs-${b.processor ?? "B"}.csv`.replace(
      /\s+/g,
      "_",
    );
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportBothCharts(containerEl, filename) {
  const svgEls = containerEl.querySelectorAll("svg");
  if (svgEls.length < 2) return;
  const PAD = 16;

  const prepared = [prepareRadarSvg(svgEls[0]), prepareBarSvg(svgEls[1])];

  const totalW =
    prepared.reduce((s, p) => s + p.w, 0) + PAD * (prepared.length + 1);
  const totalH = Math.max(...prepared.map((p) => p.h)) + PAD * 2;

  const canvas = document.createElement("canvas");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalW, totalH);

  let loaded = 0;
  let x = PAD;
  prepared.forEach((p) => {
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(p.clone)], {
        type: "image/svg+xml",
      }),
    );
    const img = new Image();
    const offsetX = x;
    x += p.w + PAD;
    img.onload = () => {
      ctx.drawImage(img, offsetX, PAD);
      URL.revokeObjectURL(url);
      loaded += 1;
      if (loaded === prepared.length) {
        const anchor = document.createElement("a");
        anchor.href = canvas.toDataURL("image/png");
        anchor.download = filename;
        anchor.click();
      }
    };
    img.src = url;
  });
}

export default function ComparisonView({ systems, onClose }) {
  const suite = useSuite();
  const fields = buildFields(suite);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [copied, setCopied] = useState(false);
  const chartsRef = useRef(null);

  function copyTsv() {
    const [a, b] = systems;
    const header = [
      "Field",
      a.processor ?? "System A",
      b.processor ?? "System B",
    ];
    const rows = fields.map((f) => [
      f.label,
      f.key === "benchmark"
        ? (suite.benchmarkLabels[a[f.key]] ?? a[f.key] ?? "")
        : (a[f.key] ?? ""),
      f.key === "benchmark"
        ? (suite.benchmarkLabels[b[f.key]] ?? b[f.key] ?? "")
        : (b[f.key] ?? ""),
    ]);
    const tsv = [header, ...rows].map((r) => r.join("\t")).join("\n");
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="comparison-view">
      <div className="comparison-view__header">
        <h2>System Comparison</h2>
        <div className="comparison-view__actions">
          <button type="button" className="btn-export" onClick={copyTsv}>
            {copied ? "Copied!" : "Copy TSV"}
          </button>
          <button
            type="button"
            className="btn-export"
            onClick={() => exportToCsv(systems, fields, suite)}
          >
            Download CSV
          </button>
          <button
            type="button"
            className="btn-export"
            onClick={() =>
              exportBothCharts(
                chartsRef.current,
                `charts-${systems[0].processor ?? "A"}-vs-${systems[1].processor ?? "B"}.png`.replace(
                  /\s+/g,
                  "_",
                ),
              )
            }
          >
            Export Charts PNG
          </button>
          <button
            type="button"
            className="btn-export"
            onClick={() =>
              exportToPptx({
                systemA: systems[0],
                systemB: systems[1],
                chartsContainerEl: chartsRef.current,
                prepareRadarSvg,
                prepareBarSvg,
                suite,
              })
            }
          >
            Export PPTX
          </button>
          <button
            type="button"
            className="comparison-view__close"
            onClick={onClose}
          >
            Back to Results
          </button>
        </div>
      </div>

      <div className="comparison-charts" ref={chartsRef}>
        <RadarChart systems={systems} />
        <BarChart systems={systems} />
      </div>

      {isDesktop ? (
        <DesktopGrid systems={systems} fields={fields} suite={suite} />
      ) : (
        <MobileComparison systems={systems} fields={fields} suite={suite} />
      )}
    </div>
  );
}
