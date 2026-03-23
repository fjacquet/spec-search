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

const { buildSlideData, FIELDS } = await import("../components/exportPptx.js");

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
    const peakRow = tableRows.find(
      (row) => row[0] && row[0].text === "Peak Score",
    );
    expect(peakRow[3].text).toMatch(/^\+/);
    expect(peakRow[3].text).toContain("%");
  });

  it("computes negative delta when B > A", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B);
    const mhzRow = tableRows.find((row) => row[0] && row[0].text === "MHz");
    expect(mhzRow[3].text).toMatch(/^-/);
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
    const chipsRow = tableRows.find((row) => row[0] && row[0].text === "Chips");
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
