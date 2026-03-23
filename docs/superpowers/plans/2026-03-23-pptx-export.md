# PPTX Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Export PPTX" button to the comparison view that generates a single-slide PowerPoint file with charts and comparison table.

**Architecture:** New `exportPptx.js` module with a single async function. Reuses existing SVG→Canvas→PNG pipeline for chart images. PptxGenJS generates the slide client-side with embedded PNGs and a programmatic table. Dynamic import keeps initial bundle unaffected.

**Tech Stack:** PptxGenJS (client-side PPTX generation), existing React/Vite app

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `web/package.json` | Modify | Add `pptxgenjs` dependency |
| `web/src/components/exportPptx.js` | Create | PPTX generation logic |
| `web/src/__tests__/exportPptx.test.js` | Create | Unit tests for PPTX export |
| `web/src/components/ComparisonView.jsx` | Modify | Add "Export PPTX" button |

---

### Task 1: Install pptxgenjs dependency

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install pptxgenjs**

```bash
cd web && npm install pptxgenjs
```

- [ ] **Step 2: Verify installation**

```bash
cd web && node -e "import('pptxgenjs').then(m => console.log('OK:', typeof m.default))"
```

Expected: `OK: function`

- [ ] **Step 3: Commit**

```bash
git add web/package.json web/package-lock.json
git commit -m "chore: add pptxgenjs dependency for PPTX export"
```

---

### Task 2: Write exportPptx module with tests (TDD)

**Files:**
- Create: `web/src/components/exportPptx.js`
- Create: `web/src/__tests__/exportPptx.test.js`

- [ ] **Step 1: Write the test file**

```javascript
import { describe, expect, it, vi } from "vitest";

// Mock pptxgenjs before importing the module under test
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockAddText = vi.fn();
const mockAddImage = vi.fn();
const mockAddTable = vi.fn();
const mockAddShape = vi.fn();
const mockAddSlide = vi.fn().mockReturnValue({
  addText: mockAddText,
  addImage: mockAddImage,
  addTable: mockAddTable,
  addShape: mockAddShape,
});

vi.mock("pptxgenjs", () => {
  return {
    default: class MockPptxGenJS {
      shapes = { LINE: "LINE" };
      addSlide = mockAddSlide;
      writeFile = mockWriteFile;
    },
  };
});

const { buildSlideData, FIELDS } = await import(
  "../components/exportPptx.js"
);

const SYSTEM_A = {
  processor: "AMD EPYC 9754",
  vendor: "Supermicro",
  system: "SuperServer SYS-1029P",
  benchmark: "CINT2017rate",
  peakResult: 1280,
  baseResult: 1190,
  cores: 128,
  chips: 1,
  threadsPerCore: 2,
  processorMhz: 2250,
  memory: "384 GB DDR5-4800",
  os: "Ubuntu 24.04 LTS",
  hwAvail: "Mar-2025",
  published: "May-2025",
};

const SYSTEM_B = {
  processor: "Intel Xeon w9-3595X",
  vendor: "Dell",
  system: "Precision 7960",
  benchmark: "CINT2017rate",
  peakResult: 920,
  baseResult: 870,
  cores: 60,
  chips: 1,
  threadsPerCore: 2,
  processorMhz: 3900,
  memory: "512 GB DDR5-5600",
  os: "SLES 15 SP6",
  hwAvail: "Jan-2025",
  published: "Apr-2025",
};

describe("FIELDS", () => {
  it("contains 14 comparison fields", () => {
    expect(FIELDS).toHaveLength(14);
  });

  it("marks numeric fields correctly", () => {
    const numericKeys = FIELDS.filter((f) => f.numeric).map((f) => f.key);
    expect(numericKeys).toEqual([
      "peakResult",
      "baseResult",
      "cores",
      "chips",
      "threadsPerCore",
      "processorMhz",
    ]);
  });
});

describe("buildSlideData", () => {
  it("returns table rows for all 14 fields", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B);
    // 1 header + 14 data rows
    expect(tableRows).toHaveLength(15);
  });

  it("header row has 4 columns: Metric, System A, System B, Delta", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B);
    const header = tableRows[0];
    expect(header).toHaveLength(4);
    expect(header[0].text).toBe("Metric");
    expect(header[1].text).toBe("AMD EPYC 9754");
    expect(header[2].text).toBe("Intel Xeon w9-3595X");
    expect(header[3].text).toBe("Delta");
  });

  it("computes positive delta for peakResult (A > B)", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B);
    // peakResult is field index 4 (0-based in FIELDS), row index 5 (header + 4 string fields)
    const peakRow = tableRows.find(
      (row) => row[0] && row[0].text === "Peak Score",
    );
    expect(peakRow[3].text).toMatch(/^\+/); // starts with +
    expect(peakRow[3].text).toContain("%");
  });

  it("computes negative delta when B > A", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B);
    const mhzRow = tableRows.find((row) => row[0] && row[0].text === "MHz");
    expect(mhzRow[3].text).toMatch(/^-/); // starts with -
  });

  it("shows dash for string fields delta", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B);
    const processorRow = tableRows.find(
      (row) => row[0] && row[0].text === "Processor",
    );
    expect(processorRow[3].text).toBe("—");
  });

  it("shows 0% for equal numeric values", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B);
    const chipsRow = tableRows.find(
      (row) => row[0] && row[0].text === "Chips",
    );
    expect(chipsRow[3].text).toBe("0%");
  });

  it("returns title with both processor names", () => {
    const { title } = buildSlideData(SYSTEM_A, SYSTEM_B);
    expect(title).toContain("AMD EPYC 9754");
    expect(title).toContain("Intel Xeon w9-3595X");
  });

  it("returns subtitle with benchmark label", () => {
    const { subtitle } = buildSlideData(SYSTEM_A, SYSTEM_B);
    expect(subtitle).toContain("Integer Multi-Core");
  });

  it("returns the expected filename", () => {
    const { filename } = buildSlideData(SYSTEM_A, SYSTEM_B);
    expect(filename).toBe(
      "comparison-AMD_EPYC_9754-vs-Intel_Xeon_w9-3595X.pptx",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/__tests__/exportPptx.test.js
```

Expected: FAIL — `../components/exportPptx.js` does not exist

- [ ] **Step 3: Write the exportPptx module**

Create `web/src/components/exportPptx.js`:

```javascript
import { benchmarkLabel } from "../constants/benchmarks.js";

export const FIELDS = [
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

function formatCellValue(field, val) {
  if (val == null) return "—";
  if (field.key === "benchmark") return benchmarkLabel(val);
  return String(val);
}

function deltaColor(a, b) {
  if (a == null || b == null || a === b) return COLOR_GRAY;
  return a > b ? COLOR_GREEN : COLOR_RED;
}

export function buildSlideData(systemA, systemB) {
  const nameA = systemA.processor ?? "System A";
  const nameB = systemB.processor ?? "System B";

  const title = `${nameA}  vs  ${nameB}`;
  const subtitle = `SPEC CPU2017 — ${benchmarkLabel(systemA.benchmark ?? systemB.benchmark ?? "")} — ${new Date().toLocaleDateString()}`;
  const filename =
    `comparison-${nameA}-vs-${nameB}.pptx`.replace(/\s+/g, "_");

  const headerRow = [
    { text: "Metric", options: { bold: true, fill: COLOR_HEADER_BG, color: "333333", align: "left" } },
    { text: nameA, options: { bold: true, fill: COLOR_HEADER_BG, color: COLOR_BLUE, align: "center" } },
    { text: nameB, options: { bold: true, fill: COLOR_HEADER_BG, color: COLOR_RED, align: "center" } },
    { text: "Delta", options: { bold: true, fill: COLOR_HEADER_BG, color: "333333", align: "center" } },
  ];

  const dataRows = FIELDS.map((field, i) => {
    const valA = systemA[field.key];
    const valB = systemB[field.key];
    const isAlt = i % 2 === 1;
    const rowFill = isAlt ? COLOR_ALT_ROW : "FFFFFF";

    const deltaText = field.numeric ? formatDelta(valA, valB) : "—";
    const deltaCellColor = field.numeric ? deltaColor(valA, valB) : COLOR_GRAY;

    return [
      { text: field.label, options: { fill: rowFill, align: "left" } },
      { text: formatCellValue(field, valA), options: { fill: rowFill, align: "center" } },
      { text: formatCellValue(field, valB), options: { fill: rowFill, align: "center" } },
      { text: deltaText, options: { fill: rowFill, align: "center", color: deltaCellColor } },
    ];
  });

  return { title, subtitle, filename, tableRows: [headerRow, ...dataRows] };
}

function svgToBase64Png(svgEl, prepareFn) {
  return new Promise((resolve) => {
    const { clone, w, h } = prepareFn(svgEl);
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
      resolve(canvas.toDataURL("image/png"));
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
}) {
  const svgEls = chartsContainerEl.querySelectorAll("svg");
  if (svgEls.length < 2) return;

  const [radarBase64, barBase64] = await Promise.all([
    svgToBase64Png(svgEls[0], prepareRadarSvg),
    svgToBase64Png(svgEls[1], prepareBarSvg),
  ]);

  const { title, subtitle, filename, tableRows } = buildSlideData(
    systemA,
    systemB,
  );

  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33" x 7.5"
  pptx.author = "spec-search";
  pptx.title = title;

  const slide = pptx.addSlide();
  slide.bkgd = "FFFFFF";

  // Title
  slide.addText(title, {
    x: 0.5, y: 0.15, w: 12.33, h: 0.45,
    fontSize: 18, bold: true, color: "222222",
    align: "center", fontFace: "Arial",
  });

  // Subtitle
  slide.addText(subtitle, {
    x: 0.5, y: 0.55, w: 12.33, h: 0.3,
    fontSize: 10, color: COLOR_GRAY,
    align: "center", fontFace: "Arial",
  });

  // Blue line separator
  slide.addShape(pptx.shapes.LINE, {
    x: 0.5, y: 0.9, w: 12.33, h: 0,
    line: { color: COLOR_BLUE, width: 2 },
  });

  // Radar chart image (left)
  slide.addImage({
    data: radarBase64,
    x: 0.5, y: 1.0, w: 5.9, h: 2.8,
    sizing: { type: "contain", w: 5.9, h: 2.8 },
  });

  // Bar chart image (right)
  slide.addImage({
    data: barBase64,
    x: 6.8, y: 1.0, w: 5.9, h: 2.8,
    sizing: { type: "contain", w: 5.9, h: 2.8 },
  });

  // Legend
  const nameA = systemA.processor ?? "System A";
  const nameB = systemB.processor ?? "System B";
  slide.addText([
    { text: "■ ", options: { color: COLOR_BLUE, fontSize: 10 } },
    { text: `${nameA}     `, options: { color: COLOR_GRAY, fontSize: 9 } },
    { text: "■ ", options: { color: COLOR_RED, fontSize: 10 } },
    { text: nameB, options: { color: COLOR_GRAY, fontSize: 9 } },
  ], {
    x: 0.5, y: 3.85, w: 12.33, h: 0.25,
    align: "center", fontFace: "Arial",
  });

  // Table
  slide.addTable(tableRows, {
    x: 0.5, y: 4.15, w: 12.33,
    colW: [2.5, 3.8, 3.8, 2.23],
    fontSize: 8, fontFace: "Arial",
    border: { pt: 0.5, color: "DDDDDD" },
    margin: [2, 4, 2, 4],
  });

  // Footer
  slide.addText("Source: SPEC CPU®2017 Published Results — spec.org", {
    x: 0.5, y: 7.1, w: 12.33, h: 0.25,
    fontSize: 7, color: "999999",
    align: "right", fontFace: "Arial",
  });

  await pptx.writeFile({ fileName: filename });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/__tests__/exportPptx.test.js
```

Expected: All 8 tests PASS

- [ ] **Step 5: Run linter**

```bash
cd web && npx biome check src/components/exportPptx.js src/__tests__/exportPptx.test.js
```

Fix any issues reported by Biome.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/exportPptx.js web/src/__tests__/exportPptx.test.js
git commit -m "feat: add exportPptx module with table builder and tests"
```

---

### Task 3: Wire Export PPTX button into ComparisonView

**Files:**
- Modify: `web/src/components/ComparisonView.jsx:1-5` (imports)
- Modify: `web/src/components/ComparisonView.jsx:238-263` (actions bar)

- [ ] **Step 1: Add import for exportToPptx**

At line 5 of `ComparisonView.jsx`, after the RadarChart import, add:

```javascript
import { exportToPptx } from "./exportPptx.js";
```

- [ ] **Step 2: Add the Export PPTX button to the actions bar**

In the `comparison-view__actions` div (after the "Export Charts PNG" button at line 263, before the "Back to Results" button), add:

```jsx
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
    })
  }
>
  Export PPTX
</button>
```

- [ ] **Step 3: Run linter**

```bash
cd web && npx biome check src/components/ComparisonView.jsx
```

- [ ] **Step 4: Run all tests to verify nothing is broken**

```bash
cd web && npx vitest run
```

Expected: All tests pass (benchmarks, useSearch, exportPptx)

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ComparisonView.jsx
git commit -m "feat: add Export PPTX button to comparison view

Closes #7"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start dev server**

```bash
cd web && npm run dev
```

- [ ] **Step 2: Test the export**

1. Open the app in a browser
2. Search for any two processors
3. Add both to the comparison tray
4. Click "Compare"
5. Click "Export PPTX"
6. Open the downloaded `.pptx` file in PowerPoint, Keynote, or LibreOffice Impress
7. Verify: title with processor names, radar chart image, bar chart image, legend, comparison table with 14 rows and deltas, footer

- [ ] **Step 3: Run full CI check**

```bash
make ci
```

Expected: lint + test + build all pass

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A && git commit -m "fix: address PPTX export issues from manual testing"
```
