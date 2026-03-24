import { getSuite } from "../constants/suites.js";

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

const COLOR_BLUE = "0D6EFD";
const COLOR_RED = "DC3545";
const COLOR_GREEN = "198754";
const COLOR_GRAY = "6C757D";
const COLOR_HEADER_BG = "F0F0F0";
const COLOR_ALT_ROW = "FAFAFA";

function formatDelta(a, b) {
  if (a == null || b == null) return "—";
  const diff = a - b;
  if (diff === 0) return "0%";
  const pct = b !== 0 ? ((diff / b) * 100).toFixed(1) : "∞";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function formatCellValue(field, val, suite) {
  if (val == null) return "—";
  if (field.key === "benchmark") return suite.benchmarkLabels[val] ?? val;
  return String(val);
}

function deltaColor(a, b) {
  if (a == null || b == null || a === b) return COLOR_GRAY;
  return a > b ? COLOR_GREEN : COLOR_RED;
}

export function buildSlideData(systemA, systemB, suite) {
  if (!suite) suite = getSuite("cpu2017");
  const fields = buildFields(suite);
  const nameA = systemA.processor ?? "System A";
  const nameB = systemB.processor ?? "System B";

  const title = `${nameA}  vs  ${nameB}`;
  const bm = systemA.benchmark ?? systemB.benchmark ?? "";
  const bmLabel = suite.benchmarkLabels[bm] ?? bm;
  const subtitle = `${suite.name} — ${bmLabel} — ${new Date().toLocaleDateString()}`;
  const filename = `comparison-${nameA}-vs-${nameB}.pptx`.replace(/\s+/g, "_");

  const headerRow = [
    {
      text: "Metric",
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: "333333",
        align: "left",
      },
    },
    {
      text: nameA,
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: COLOR_BLUE,
        align: "center",
      },
    },
    {
      text: nameB,
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: COLOR_RED,
        align: "center",
      },
    },
    {
      text: "Delta",
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: "333333",
        align: "center",
      },
    },
  ];

  const dataRows = fields.map((field, i) => {
    const valA = systemA[field.key];
    const valB = systemB[field.key];
    const isAlt = i % 2 === 1;
    const rowFill = isAlt ? COLOR_ALT_ROW : "FFFFFF";

    const deltaText = field.numeric ? formatDelta(valA, valB) : "—";
    const deltaCellColor = field.numeric ? deltaColor(valA, valB) : COLOR_GRAY;

    return [
      { text: field.label, options: { fill: rowFill, align: "left" } },
      {
        text: formatCellValue(field, valA, suite),
        options: { fill: rowFill, align: "center" },
      },
      {
        text: formatCellValue(field, valB, suite),
        options: { fill: rowFill, align: "center" },
      },
      {
        text: deltaText,
        options: { fill: rowFill, align: "center", color: deltaCellColor },
      },
    ];
  });

  return { title, subtitle, filename, tableRows: [headerRow, ...dataRows] };
}

function svgToBase64Png(svgEl, prepareFn) {
  return new Promise((resolve) => {
    const { clone, w, h } = prepareFn(svgEl);
    const scale = 2;
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], {
        type: "image/svg+xml",
      }),
    );
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ data: canvas.toDataURL("image/png"), aspect: w / h });
    };
    img.src = url;
  });
}

export async function exportToPptx({
  systemA,
  systemB,
  chartsContainerEl,
  prepareRadarSvg,
  prepareBarSvg,
  suite,
}) {
  const svgEls = chartsContainerEl.querySelectorAll("svg");
  if (svgEls.length < 2) return;

  const [radarResult, barResult] = await Promise.all([
    svgToBase64Png(svgEls[0], prepareRadarSvg),
    svgToBase64Png(svgEls[1], prepareBarSvg),
  ]);

  const { title, subtitle, filename, tableRows } = buildSlideData(
    systemA,
    systemB,
    suite,
  );

  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "spec-search";
  pptx.title = title;

  const slide = pptx.addSlide();
  slide.bkgd = "FFFFFF";

  // Title
  slide.addText(title, {
    x: 0.5,
    y: 0.15,
    w: 12.33,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: "222222",
    align: "center",
    fontFace: "Arial",
  });

  // Subtitle
  slide.addText(subtitle, {
    x: 0.5,
    y: 0.55,
    w: 12.33,
    h: 0.3,
    fontSize: 10,
    color: COLOR_GRAY,
    align: "center",
    fontFace: "Arial",
  });

  // Blue line separator
  slide.addShape(pptx.shapes.LINE, {
    x: 0.5,
    y: 0.9,
    w: 12.33,
    h: 0,
    line: { color: COLOR_BLUE, width: 2 },
  });

  // Chart placement: radar (square) gets left ~40%, bar (wider) gets right ~60%
  const chartMaxH = 2.8;
  const slideContentW = 12.33;
  const chartGap = 0.4;

  // Radar chart — square aspect ratio, sized to max height
  const radarH = chartMaxH;
  const radarW = radarH * radarResult.aspect;
  const radarX = 0.5 + (slideContentW * 0.4 - radarW) / 2;
  slide.addImage({
    data: radarResult.data,
    x: radarX,
    y: 1.0,
    w: radarW,
    h: radarH,
  });

  // Bar chart — wider aspect ratio, fill the right 60%
  const barZoneW = slideContentW * 0.6 - chartGap;
  let barW = chartMaxH * barResult.aspect;
  let barH = chartMaxH;
  if (barW > barZoneW) {
    barW = barZoneW;
    barH = barW / barResult.aspect;
  }
  const barX = 0.5 + slideContentW * 0.4 + chartGap + (barZoneW - barW) / 2;
  const barY = 1.0 + (chartMaxH - barH) / 2;
  slide.addImage({
    data: barResult.data,
    x: barX,
    y: barY,
    w: barW,
    h: barH,
  });

  // Legend
  const nameA = systemA.processor ?? "System A";
  const nameB = systemB.processor ?? "System B";
  slide.addText(
    [
      { text: "■ ", options: { color: COLOR_BLUE, fontSize: 10 } },
      { text: `${nameA}     `, options: { color: COLOR_GRAY, fontSize: 9 } },
      { text: "■ ", options: { color: COLOR_RED, fontSize: 10 } },
      { text: nameB, options: { color: COLOR_GRAY, fontSize: 9 } },
    ],
    {
      x: 0.5,
      y: 3.85,
      w: 12.33,
      h: 0.25,
      align: "center",
      fontFace: "Arial",
    },
  );

  // Table
  slide.addTable(tableRows, {
    x: 0.5,
    y: 4.15,
    w: 12.33,
    colW: [2.5, 3.8, 3.8, 2.23],
    fontSize: 8,
    fontFace: "Arial",
    border: { pt: 0.5, color: "DDDDDD" },
    margin: [2, 4, 2, 4],
  });

  // Footer
  const footerText = suite
    ? `Source: ${suite.name} Published Results \u2014 spec.org`
    : "Source: SPEC CPU\u00AE2017 Published Results \u2014 spec.org";
  slide.addText(footerText, {
    x: 0.5,
    y: 7.1,
    w: 12.33,
    h: 0.25,
    fontSize: 7,
    color: "999999",
    align: "right",
    fontFace: "Arial",
  });

  await pptx.writeFile({ fileName: filename });
}
