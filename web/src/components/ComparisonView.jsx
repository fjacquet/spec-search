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
  const memIdx = fields.findIndex((f) => f.key === "memory");
  fields.splice(memIdx, 0, ...suite.extraComparisonFields);
  return fields;
}

function formatValue(field, val, suite) {
  if (val == null) return "\u2014";
  if (field.key === "benchmark") return suite.benchmarkLabels[val] ?? val;
  return val;
}

/** Compute delta as To-Be minus As-Is: positive = improvement. */
function formatDelta(toBeVal, asIsVal) {
  if (toBeVal == null || asIsVal == null) return null;
  const diff = toBeVal - asIsVal;
  const pct = asIsVal !== 0 ? ((diff / asIsVal) * 100).toFixed(1) : null;
  const sign = diff > 0 ? "+" : "";
  return { diff, sign, pct };
}

function DesktopGrid({ systems, fields, suite }) {
  const [asIs, toBe] = systems;

  return (
    <div className="comparison-grid">
      <div className="comparison-grid__col-header" />
      <div className="comparison-grid__col-header">
        As-Is: {asIs.processor ?? "System A"}
      </div>
      <div className="comparison-grid__col-header">
        To-Be: {toBe.processor ?? "System B"}
      </div>
      <div className="comparison-grid__col-header">Change</div>

      {fields.map((field) => {
        const valAsIs = asIs[field.key];
        const valToBe = toBe[field.key];
        const delta = field.numeric ? formatDelta(valToBe, valAsIs) : null;

        let classAsIs = "comparison-grid__value";
        let classToBe = "comparison-grid__value";
        let changeClass = "comparison-grid__change";
        if (delta && delta.diff > 0) {
          classToBe += " comparison-grid__value--better";
          classAsIs += " comparison-grid__value--worse";
          changeClass += " comparison-grid__change--positive";
        } else if (delta && delta.diff < 0) {
          classToBe += " comparison-grid__value--worse";
          classAsIs += " comparison-grid__value--better";
          changeClass += " comparison-grid__change--negative";
        }

        return (
          <div key={field.key} style={{ display: "contents" }}>
            <div className="comparison-grid__label">{field.label}</div>
            <div className={classAsIs}>
              {formatValue(field, valAsIs, suite)}
            </div>
            <div className={classToBe}>
              {formatValue(field, valToBe, suite)}
            </div>
            <div className={changeClass}>
              {delta && delta.diff !== 0
                ? `${delta.sign}${delta.diff}${delta.pct ? ` (${delta.sign}${delta.pct}%)` : ""}`
                : field.numeric
                  ? "\u2014"
                  : "\u2014"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileComparison({ systems, fields, suite }) {
  const [asIs, toBe] = systems;
  const roles = ["As-Is", "To-Be"];
  const numericFields = fields.filter((f) => f.numeric);

  return (
    <div>
      {systems.map((sys, i) => (
        <div key={sys.id} className="comparison-mobile-card">
          <h3>
            {roles[i]}: {sys.processor ?? "Unknown"}
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
        <h3>Changes (To-Be vs As-Is)</h3>
        {numericFields.map((field) => {
          const delta = formatDelta(toBe[field.key], asIs[field.key]);
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
  const [asIs, toBe] = systems;
  const header = [
    "Field",
    `As-Is: ${asIs.processor ?? "System A"}`,
    `To-Be: ${toBe.processor ?? "System B"}`,
  ];
  const rows = fields.map((f) => [
    f.label,
    f.key === "benchmark"
      ? (suite.benchmarkLabels[asIs[f.key]] ?? asIs[f.key] ?? "")
      : (asIs[f.key] ?? ""),
    f.key === "benchmark"
      ? (suite.benchmarkLabels[toBe[f.key]] ?? toBe[f.key] ?? "")
      : (toBe[f.key] ?? ""),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    `comparison-${asIs.processor ?? "A"}-vs-${toBe.processor ?? "B"}.csv`.replace(
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

export default function ComparisonView({ systems, onClose, onSwap }) {
  const suite = useSuite();
  const fields = buildFields(suite);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [copied, setCopied] = useState(false);
  const chartsRef = useRef(null);

  const [asIs, toBe] = systems;
  const asIsLabel = `As-Is: ${asIs.processor ?? "System A"}`;
  const toBeLabel = `To-Be: ${toBe.processor ?? "System B"}`;

  function copyTsv() {
    const header = ["Field", asIsLabel, toBeLabel];
    const rows = fields.map((f) => [
      f.label,
      f.key === "benchmark"
        ? (suite.benchmarkLabels[asIs[f.key]] ?? asIs[f.key] ?? "")
        : (asIs[f.key] ?? ""),
      f.key === "benchmark"
        ? (suite.benchmarkLabels[toBe[f.key]] ?? toBe[f.key] ?? "")
        : (toBe[f.key] ?? ""),
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
          <button
            type="button"
            className="comparison-view__swap"
            onClick={onSwap}
            title="Swap As-Is and To-Be"
          >
            {"\u21C4"} Swap
          </button>
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
                `charts-${asIs.processor ?? "A"}-vs-${toBe.processor ?? "B"}.png`.replace(
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
                systemA: asIs,
                systemB: toBe,
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
        <RadarChart systems={systems} labelA={asIsLabel} labelB={toBeLabel} />
        <BarChart systems={systems} labelA={asIsLabel} labelB={toBeLabel} />
      </div>

      {isDesktop ? (
        <DesktopGrid systems={systems} fields={fields} suite={suite} />
      ) : (
        <MobileComparison systems={systems} fields={fields} suite={suite} />
      )}
    </div>
  );
}
