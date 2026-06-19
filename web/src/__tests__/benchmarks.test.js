import { describe, expect, it } from "vitest";
import { BENCHMARK_LABELS, benchmarkLabel } from "../constants/benchmarks.js";
import {
  getSuite,
  SUITES,
  benchmarkLabel as suiteBenchmarkLabel,
} from "../constants/suites.js";

describe("benchmarkLabel (backward compat)", () => {
  it("maps known CPU2017 codes to friendly names", () => {
    expect(benchmarkLabel("CINT2017")).toBe("Integer Per-Core");
    expect(benchmarkLabel("CFP2017")).toBe("FP Per-Core");
    expect(benchmarkLabel("CINT2017rate")).toBe("Integer Multi-Core");
    expect(benchmarkLabel("CFP2017rate")).toBe("FP Multi-Core");
  });

  it("returns the code itself for unknown values", () => {
    expect(benchmarkLabel("UNKNOWN")).toBe("UNKNOWN");
  });

  it("returns undefined code as-is", () => {
    expect(benchmarkLabel(undefined)).toBeUndefined();
  });

  it("exports all four CPU2017 benchmark labels", () => {
    expect(Object.keys(BENCHMARK_LABELS)).toHaveLength(4);
  });
});

describe("suites config", () => {
  it("has cpu2017 and jbb2015 suites", () => {
    expect(SUITES.cpu2017).toBeDefined();
    expect(SUITES.jbb2015).toBeDefined();
  });

  it("getSuite returns correct suite", () => {
    expect(getSuite("cpu2017").name).toBe("SPEC CPU2017");
    expect(getSuite("jbb2015").name).toBe("SPECjbb2015");
  });

  it("getSuite falls back to default for unknown", () => {
    expect(getSuite("unknown").id).toBe("cpu2017");
  });

  it("jbb2015 has correct benchmark labels", () => {
    const jbb = getSuite("jbb2015");
    expect(jbb.benchmarkLabels.JBB2015MULTI).toBe("Multi-JVM");
    expect(jbb.benchmarkLabels.JBB2015COMP).toBe("Composite");
    expect(jbb.benchmarkLabels.JBB2015DIST).toBe("Distributed");
  });

  it("jbb2015 has extra columns", () => {
    const jbb = getSuite("jbb2015");
    expect(jbb.extraColumns).toHaveLength(3);
    expect(jbb.extraColumns.map((c) => c.key)).toEqual([
      "jvm",
      "jvmVendor",
      "nodes",
    ]);
  });

  it("has a cpu2026 suite", () => {
    expect(SUITES.cpu2026).toBeDefined();
    expect(getSuite("cpu2026").name).toBe("SPEC CPU2026");
  });

  it("cpu2026 has correct benchmark labels", () => {
    const c = getSuite("cpu2026");
    expect(c.benchmarkLabels.CINT2026).toBe("Integer Per-Core");
    expect(c.benchmarkLabels.CFP2026rate).toBe("FP Multi-Core");
  });

  it("cpu2026 exposes energy extra columns", () => {
    const keys = getSuite("cpu2026").extraColumns.map((col) => col.key);
    expect(keys).toContain("energyPeakResult");
    expect(keys).toContain("energyBaseResult");
  });
});

describe("suiteBenchmarkLabel", () => {
  it("resolves CPU2017 labels with suite param", () => {
    expect(suiteBenchmarkLabel("CINT2017", "cpu2017")).toBe("Integer Per-Core");
  });

  it("resolves JBB2015 labels with suite param", () => {
    expect(suiteBenchmarkLabel("JBB2015MULTI", "jbb2015")).toBe("Multi-JVM");
  });

  it("resolves CPU2026 labels with suite param", () => {
    expect(suiteBenchmarkLabel("CINT2026rate", "cpu2026")).toBe(
      "Integer Multi-Core",
    );
  });
});
