import { useRef } from "react";

const BAR_CSS = `
  .bar-chart__label { font-size: 11px; fill: #6c757d; font-family: sans-serif; }
  .bar-chart__bar-a { fill: #0d6efd; opacity: 0.85; }
  .bar-chart__bar-b { fill: #dc3545; opacity: 0.75; }
  .bar-chart__value { font-size: 10px; fill: #6c757d; font-family: sans-serif; }
`;

export function prepareBarSvg(svgEl) {
  const w = svgEl.viewBox.baseVal.width || svgEl.clientWidth;
  const h = svgEl.viewBox.baseVal.height || svgEl.clientHeight;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("width", w);
  clone.setAttribute("height", h);
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = BAR_CSS;
  clone.insertBefore(style, clone.firstChild);
  return { clone, w, h };
}

function exportPng(svgEl, filename) {
  const { clone, w, h } = prepareBarSvg(svgEl);
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml",
    }),
  );
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = filename;
    anchor.click();
  };
  img.src = url;
}

const BAR_METRICS = [
  { key: "peakResult", label: "Peak Score" },
  { key: "baseResult", label: "Base Score" },
  { key: "cores", label: "Cores" },
  { key: "processorMhz", label: "MHz" },
  { key: "chips", label: "Chips" },
];

const BAR_HEIGHT = 22;
const GAP = 8;
const LABEL_WIDTH = 90;
const MAX_BAR = 200;

export default function BarChart({ systems }) {
  const svgRef = useRef(null);
  const [a, b] = systems;

  const rows = BAR_METRICS.map((m) => {
    const valA = a[m.key] ?? 0;
    const valB = b[m.key] ?? 0;
    const max = Math.max(valA, valB, 1);
    return { ...m, valA, valB, max };
  });

  const rowHeight = BAR_HEIGHT * 2 + GAP;
  const height = rows.length * (rowHeight + GAP * 2) + 30;
  const width = LABEL_WIDTH + MAX_BAR + 80;

  return (
    <div className="bar-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="bar-chart__svg"
        role="img"
        aria-label="Bar chart comparing system metrics"
      >
        <title>Bar chart comparing system metrics</title>
        {rows.map((row, i) => {
          const y = i * (rowHeight + GAP * 2) + 20;
          const widthA = (row.valA / row.max) * MAX_BAR;
          const widthB = (row.valB / row.max) * MAX_BAR;

          return (
            <g key={row.key}>
              <text
                x={LABEL_WIDTH - 8}
                y={y + BAR_HEIGHT}
                textAnchor="end"
                dominantBaseline="central"
                className="bar-chart__label"
              >
                {row.label}
              </text>

              <rect
                x={LABEL_WIDTH}
                y={y}
                width={widthA}
                height={BAR_HEIGHT}
                rx="4"
                className="bar-chart__bar-a"
              />
              <text
                x={LABEL_WIDTH + widthA + 6}
                y={y + BAR_HEIGHT / 2}
                dominantBaseline="central"
                className="bar-chart__value"
              >
                {row.valA.toLocaleString()}
              </text>

              <rect
                x={LABEL_WIDTH}
                y={y + BAR_HEIGHT + 2}
                width={widthB}
                height={BAR_HEIGHT}
                rx="4"
                className="bar-chart__bar-b"
              />
              <text
                x={LABEL_WIDTH + widthB + 6}
                y={y + BAR_HEIGHT + 2 + BAR_HEIGHT / 2}
                dominantBaseline="central"
                className="bar-chart__value"
              >
                {row.valB.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="bar-chart__legend">
        <span className="bar-chart__legend-a">{a.processor ?? "System A"}</span>
        <span className="bar-chart__legend-b">{b.processor ?? "System B"}</span>
      </div>
      <button
        type="button"
        className="btn-export btn-export--chart"
        onClick={() =>
          exportPng(
            svgRef.current,
            `barchart-${a.processor ?? "A"}-vs-${b.processor ?? "B"}.png`.replace(
              /\s+/g,
              "_",
            ),
          )
        }
      >
        Export PNG
      </button>
    </div>
  );
}
