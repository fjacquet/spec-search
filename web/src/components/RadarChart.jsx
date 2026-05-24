import { useRef } from "react";
import { useSuite } from "../hooks/useSuite.js";
import { chartSeries, FONT_MONO } from "../theme/tokens.js";

export function radarCss(theme = "light") {
  const s = chartSeries[theme] ?? chartSeries.light;
  const rgba = (hex, a) => {
    const n = Number.parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  return `
  .radar-chart__ring { fill: none; stroke: ${s.grid}; stroke-width: 0.5; }
  .radar-chart__axis { stroke: ${s.grid}; stroke-width: 0.5; }
  .radar-chart__area-a { fill: ${rgba(s.asIs, 0.2)}; stroke: ${s.asIs}; stroke-width: 2; }
  .radar-chart__area-b { fill: ${rgba(s.toBe, 0.2)}; stroke: ${s.toBe}; stroke-width: 2; }
  .radar-chart__dot-a { fill: ${s.asIs}; }
  .radar-chart__dot-b { fill: ${s.toBe}; }
  .radar-chart__label { font-size: 11px; fill: ${s.label}; font-family: ${FONT_MONO}; }
`;
}

export function prepareRadarSvg(svgEl) {
  const w = svgEl.viewBox.baseVal.width || svgEl.clientWidth;
  const h = svgEl.viewBox.baseVal.height || svgEl.clientHeight;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("width", w);
  clone.setAttribute("height", h);
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = radarCss();
  clone.insertBefore(style, clone.firstChild);
  return { clone, w, h };
}

function exportPng(svgEl, filename) {
  const { clone, w, h } = prepareRadarSvg(svgEl);
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

const BASE_METRICS = [
  { key: "peakResult", label: null },
  { key: "baseResult", label: null },
  { key: "cores", label: "Cores" },
  { key: "processorMhz", label: "MHz" },
  { key: "chips", label: "Chips" },
  { key: "threadsPerCore", label: "Threads" },
];

function buildMetrics(suite) {
  return BASE_METRICS.map((m) => {
    if (m.key === "peakResult") return { ...m, label: suite.peakLabel };
    if (m.key === "baseResult") return { ...m, label: suite.baseLabel };
    return m;
  });
}

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 110;
const RINGS = 4;

function polarToCart(angle, r) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

export default function RadarChart({ systems, labelA, labelB }) {
  const suite = useSuite();
  const CHART_METRICS = buildMetrics(suite);
  const svgRef = useRef(null);
  const [a, b] = systems;
  const count = CHART_METRICS.length;
  const step = 360 / count;

  const maxValues = CHART_METRICS.map((m) =>
    Math.max(a[m.key] ?? 0, b[m.key] ?? 0, 1),
  );

  const pointsA = CHART_METRICS.map((m, i) => {
    const val = (a[m.key] ?? 0) / maxValues[i];
    return polarToCart(i * step, val * RADIUS);
  });

  const pointsB = CHART_METRICS.map((m, i) => {
    const val = (b[m.key] ?? 0) / maxValues[i];
    return polarToCart(i * step, val * RADIUS);
  });

  const polyA = pointsA.map((p) => `${p.x},${p.y}`).join(" ");
  const polyB = pointsB.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="radar-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="radar-chart__svg"
        role="img"
        aria-label="Radar chart comparing system metrics"
      >
        <title>Radar chart comparing system metrics</title>
        {/* Grid rings */}
        {[1, 2, 3, 4].map((level) => {
          const r = (level / RINGS) * RADIUS;
          const ring = CHART_METRICS.map((_, j) => polarToCart(j * step, r));
          return (
            <polygon
              key={`ring-${level}`}
              points={ring.map((p) => `${p.x},${p.y}`).join(" ")}
              className="radar-chart__ring"
            />
          );
        })}

        {/* Axis lines */}
        {CHART_METRICS.map((m) => {
          const end = polarToCart(CHART_METRICS.indexOf(m) * step, RADIUS);
          return (
            <line
              key={`axis-${m.key}`}
              x1={CX}
              y1={CY}
              x2={end.x}
              y2={end.y}
              className="radar-chart__axis"
            />
          );
        })}

        {/* Data polygons */}
        <polygon points={polyA} className="radar-chart__area-a" />
        <polygon points={polyB} className="radar-chart__area-b" />

        {/* Data points */}
        {CHART_METRICS.map((m, i) => (
          <circle
            key={`dot-a-${m.key}`}
            cx={pointsA[i].x}
            cy={pointsA[i].y}
            r="4"
            className="radar-chart__dot-a"
          />
        ))}
        {CHART_METRICS.map((m, i) => (
          <circle
            key={`dot-b-${m.key}`}
            cx={pointsB[i].x}
            cy={pointsB[i].y}
            r="4"
            className="radar-chart__dot-b"
          />
        ))}

        {/* Labels */}
        {CHART_METRICS.map((m) => {
          const pos = polarToCart(CHART_METRICS.indexOf(m) * step, RADIUS + 22);
          return (
            <text
              key={`label-${m.key}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="radar-chart__label"
            >
              {m.label}
            </text>
          );
        })}
      </svg>
      <div className="radar-chart__legend">
        <span className="radar-chart__legend-a">
          {labelA ?? a.processor ?? "System A"}
        </span>
        <span className="radar-chart__legend-b">
          {labelB ?? b.processor ?? "System B"}
        </span>
      </div>
      <button
        type="button"
        className="btn-export btn-export--chart"
        onClick={() =>
          exportPng(
            svgRef.current,
            `radar-${a.processor ?? "A"}-vs-${b.processor ?? "B"}.png`.replace(
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
