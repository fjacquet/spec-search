/** Mapping from raw SPEC benchmark codes to display labels. */
export const BENCHMARK_LABELS = {
  CINT2017: "Integer Per-Core",
  CFP2017: "FP Per-Core",
  CINT2017rate: "Integer Multi-Core",
  CFP2017rate: "FP Multi-Core",
};

/** Return the friendly label for a benchmark code, with fallback to the code itself. */
export function benchmarkLabel(code) {
  return BENCHMARK_LABELS[code] ?? code;
}
