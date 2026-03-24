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

const { buildSlideData } = await import("../components/exportPptx.js");
const { getSuite } = await import("../constants/suites.js");

const CPU2017_SUITE = getSuite("cpu2017");
const JBB2015_SUITE = getSuite("jbb2015");

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

describe("buildSlideData (CPU2017)", () => {
  it("returns table rows for all 14 base fields", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    // 1 header + 14 data rows
    expect(tableRows).toHaveLength(15);
  });

  it("header row has 4 columns: Metric, System A, System B, Delta", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    const header = tableRows[0];
    expect(header).toHaveLength(4);
    expect(header[0].text).toBe("Metric");
    expect(header[1].text).toBe("AMD EPYC 9754");
    expect(header[2].text).toBe("Intel Xeon w9-3595X");
    expect(header[3].text).toBe("Delta");
  });

  it("computes positive delta for peakResult (A > B)", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    const peakRow = tableRows.find(
      (row) => row[0] && row[0].text === "Peak Score",
    );
    expect(peakRow[3].text).toMatch(/^\+/);
    expect(peakRow[3].text).toContain("%");
  });

  it("computes negative delta when B > A", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    const mhzRow = tableRows.find((row) => row[0] && row[0].text === "MHz");
    expect(mhzRow[3].text).toMatch(/^-/);
  });

  it("shows dash for string fields delta", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    const processorRow = tableRows.find(
      (row) => row[0] && row[0].text === "Processor",
    );
    expect(processorRow[3].text).toBe("—");
  });

  it("shows 0% for equal numeric values", () => {
    const { tableRows } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    const chipsRow = tableRows.find((row) => row[0] && row[0].text === "Chips");
    expect(chipsRow[3].text).toBe("0%");
  });

  it("returns title with both processor names", () => {
    const { title } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    expect(title).toContain("AMD EPYC 9754");
    expect(title).toContain("Intel Xeon w9-3595X");
  });

  it("returns subtitle with benchmark label and suite name", () => {
    const { subtitle } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    expect(subtitle).toContain("Integer Multi-Core");
    expect(subtitle).toContain("SPEC CPU2017");
  });

  it("returns the expected filename", () => {
    const { filename } = buildSlideData(SYSTEM_A, SYSTEM_B, CPU2017_SUITE);
    expect(filename).toBe(
      "comparison-AMD_EPYC_9754-vs-Intel_Xeon_w9-3595X.pptx",
    );
  });
});

describe("buildSlideData (JBB2015)", () => {
  const JBB_A = {
    ...SYSTEM_A,
    benchmark: "JBB2015MULTI",
    peakResult: 362000,
    baseResult: 335166,
    jvm: "Oracle Java SE 17.0.7",
    jvmVendor: "Oracle",
    nodes: 1,
  };
  const JBB_B = {
    ...SYSTEM_B,
    benchmark: "JBB2015MULTI",
    peakResult: 280000,
    baseResult: 260000,
    jvm: "OpenJDK 17.0.8",
    jvmVendor: "Red Hat",
    nodes: 1,
  };

  it("includes extra JBB2015 fields in table rows", () => {
    const { tableRows } = buildSlideData(JBB_A, JBB_B, JBB2015_SUITE);
    // 1 header + 14 base + 3 extra (jvm, jvmVendor, nodes)
    expect(tableRows).toHaveLength(18);
  });

  it("uses Max jOPS label for peak score", () => {
    const { tableRows } = buildSlideData(JBB_A, JBB_B, JBB2015_SUITE);
    const peakRow = tableRows.find(
      (row) => row[0] && row[0].text === "Max jOPS",
    );
    expect(peakRow).toBeDefined();
  });

  it("subtitle contains SPECjbb2015", () => {
    const { subtitle } = buildSlideData(JBB_A, JBB_B, JBB2015_SUITE);
    expect(subtitle).toContain("SPECjbb2015");
    expect(subtitle).toContain("Multi-JVM");
  });
});
