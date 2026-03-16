/** Mapping from raw SPEC benchmark codes to display labels. */
export const BENCHMARK_LABELS = {
  CINT2017: "Integer Speed",
  CFP2017: "FP Speed",
  CINT2017rate: "Integer Rate",
  CFP2017rate: "FP Rate",
};

/** Return the friendly label for a benchmark code, with fallback to the code itself. */
export function benchmarkLabel(code) {
  return BENCHMARK_LABELS[code] ?? code;
}
