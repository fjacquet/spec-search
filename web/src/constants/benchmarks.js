/** Backward-compatible re-export from suites.js. */
import { benchmarkLabel as _benchmarkLabel, SUITES } from "./suites.js";

export const BENCHMARK_LABELS = SUITES.cpu2017.benchmarkLabels;

/** Return the friendly label for a benchmark code, with fallback to the code itself. */
export function benchmarkLabel(code) {
  return _benchmarkLabel(code, "cpu2017");
}
