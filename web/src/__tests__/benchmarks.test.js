import { describe, expect, it } from "vitest";
import { BENCHMARK_LABELS, benchmarkLabel } from "../constants/benchmarks.js";

describe("benchmarkLabel", () => {
  it("maps known codes to friendly names", () => {
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

  it("exports all four benchmark labels", () => {
    expect(Object.keys(BENCHMARK_LABELS)).toHaveLength(4);
  });
});
