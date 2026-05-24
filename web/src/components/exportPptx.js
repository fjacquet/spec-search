import { getSuite } from "../constants/suites.js";
import { pptxColors } from "../theme/tokens.js";

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

const COLOR_AS_IS = pptxColors.asIs; // navy (legend marker)
const COLOR_TO_BE = pptxColors.toBe; // gold (legend marker)
const COLOR_INK = pptxColors.ink;
const COLOR_INK_MUTED = pptxColors.inkMuted;
const COLOR_HEADER_BG = pptxColors.headerBg;
const COLOR_ALT_ROW = pptxColors.altRow;
const COLOR_DELTA_UP = pptxColors.deltaUp;
const COLOR_DELTA_DOWN = pptxColors.deltaDown;

/** Delta = To-Be minus As-Is: positive = improvement. */
function formatDelta(toBeVal, asIsVal) {
  if (toBeVal == null || asIsVal == null) return "\u2014";
  const diff = toBeVal - asIsVal;
  if (diff === 0) return "0%";
  const pct = asIsVal !== 0 ? ((diff / asIsVal) * 100).toFixed(1) : "\u221E";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function formatCellValue(field, val, suite) {
  if (val == null) return "—";
  if (field.key === "benchmark") return suite.benchmarkLabels[val] ?? val;
  return String(val);
}

/** Color based on To-Be vs As-Is: green = improvement, red = regression. */
function deltaColor(toBeVal, asIsVal) {
  if (toBeVal == null || asIsVal == null || toBeVal === asIsVal)
    return COLOR_INK_MUTED;
  return toBeVal > asIsVal ? COLOR_DELTA_UP : COLOR_DELTA_DOWN;
}

/** systemA = As-Is, systemB = To-Be. Delta = To-Be minus As-Is. */
export function buildSlideData(systemA, systemB, suite) {
  if (!suite) suite = getSuite("cpu2017");
  const fields = buildFields(suite);
  const nameA = systemA.processor ?? "System A";
  const nameB = systemB.processor ?? "System B";

  const title = `${nameA} (As-Is)  vs  ${nameB} (To-Be)`;
  const bm = systemA.benchmark ?? systemB.benchmark ?? "";
  const bmLabel = suite.benchmarkLabels[bm] ?? bm;
  const subtitle = `${suite.name} \u2014 ${bmLabel} \u2014 ${new Date().toLocaleDateString()}`;
  const filename = `comparison-${nameA}-vs-${nameB}.pptx`.replace(/\s+/g, "_");

  const headerRow = [
    {
      text: "Metric",
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: COLOR_INK,
        align: "left",
      },
    },
    {
      text: `As-Is: ${nameA}`,
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: COLOR_INK,
        align: "center",
      },
    },
    {
      text: `To-Be: ${nameB}`,
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: COLOR_INK,
        align: "center",
      },
    },
    {
      text: "Change",
      options: {
        bold: true,
        fill: COLOR_HEADER_BG,
        color: COLOR_INK,
        align: "center",
      },
    },
  ];

  const dataRows = fields.map((field, i) => {
    const valAsIs = systemA[field.key];
    const valToBe = systemB[field.key];
    const isAlt = i % 2 === 1;
    const rowFill = isAlt ? COLOR_ALT_ROW : pptxColors.paper;

    const deltaText = field.numeric ? formatDelta(valToBe, valAsIs) : "\u2014";
    const deltaCellColor = field.numeric
      ? deltaColor(valToBe, valAsIs)
      : COLOR_INK_MUTED;

    return [
      { text: field.label, options: { fill: rowFill, align: "left" } },
      {
        text: formatCellValue(field, valAsIs, suite),
        options: { fill: rowFill, align: "center", fontFace: "Consolas" },
      },
      {
        text: formatCellValue(field, valToBe, suite),
        options: { fill: rowFill, align: "center", fontFace: "Consolas" },
      },
      {
        text: deltaText,
        options: {
          fill: rowFill,
          align: "center",
          color: deltaCellColor,
          fontFace: "Consolas",
        },
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
  slide.bkgd = pptxColors.paper;

  // Title
  slide.addText(title, {
    x: 0.5,
    y: 0.15,
    w: 12.33,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: COLOR_INK,
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
    color: COLOR_INK_MUTED,
    align: "center",
    fontFace: "Arial",
  });

  // Navy line separator
  slide.addShape(pptx.shapes.LINE, {
    x: 0.5,
    y: 0.9,
    w: 12.33,
    h: 0,
    line: { color: COLOR_AS_IS, width: 2 },
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
      { text: "\u25A0 ", options: { color: COLOR_AS_IS, fontSize: 10 } },
      {
        text: `As-Is: ${nameA}     `,
        options: { color: COLOR_INK_MUTED, fontSize: 9 },
      },
      { text: "\u25A0 ", options: { color: COLOR_TO_BE, fontSize: 10 } },
      {
        text: `To-Be: ${nameB}`,
        options: { color: COLOR_INK_MUTED, fontSize: 9 },
      },
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
    border: { pt: 0.5, color: pptxColors.hairline },
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
    color: COLOR_INK_MUTED,
    align: "right",
    fontFace: "Arial",
  });

  await pptx.writeFile({ fileName: filename });
}
