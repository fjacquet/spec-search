const CHART_METRICS = [
  { key: "peakResult", label: "Peak" },
  { key: "baseResult", label: "Base" },
  { key: "cores", label: "Cores" },
  { key: "processorMhz", label: "MHz" },
  { key: "chips", label: "Chips" },
  { key: "threadsPerCore", label: "Threads" },
];

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 110;
const RINGS = 4;

function polarToCart(angle, r) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

export default function RadarChart({ systems }) {
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
          {a.processor ?? "System A"}
        </span>
        <span className="radar-chart__legend-b">
          {b.processor ?? "System B"}
        </span>
      </div>
    </div>
  );
}
