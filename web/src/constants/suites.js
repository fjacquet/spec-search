/** Suite configurations for multi-benchmark support. */
export const SUITES = {
  cpu2017: {
    id: "cpu2017",
    name: "SPEC CPU2017",
    peakLabel: "Peak",
    baseLabel: "Base",
    peakScoreLabel: "Peak Score",
    baseScoreLabel: "Base Score",
    benchmarkLabels: {
      CINT2017: "Integer Per-Core",
      CFP2017: "FP Per-Core",
      CINT2017rate: "Integer Multi-Core",
      CFP2017rate: "FP Multi-Core",
    },
    extraColumns: [],
    extraComparisonFields: [],
    specBaseUrl: "https://www.spec.org",
  },
  jbb2015: {
    id: "jbb2015",
    name: "SPECjbb2015",
    peakLabel: "Max jOPS",
    baseLabel: "Critical jOPS",
    peakScoreLabel: "Max jOPS",
    baseScoreLabel: "Critical jOPS",
    benchmarkLabels: {
      JBB2015MULTI: "Multi-JVM",
      JBB2015COMP: "Composite",
      JBB2015DIST: "Distributed",
    },
    extraColumns: [
      { key: "jvm", label: "JVM" },
      { key: "jvmVendor", label: "JVM Vendor" },
      { key: "nodes", label: "Nodes", numeric: true },
    ],
    extraComparisonFields: [
      { key: "jvm", label: "JVM" },
      { key: "jvmVendor", label: "JVM Vendor" },
      { key: "nodes", label: "Nodes", numeric: true },
    ],
    specBaseUrl: "https://www.spec.org",
  },
};

export const SUITE_IDS = Object.keys(SUITES);
export const DEFAULT_SUITE = "cpu2017";

/** Get suite config by id, falling back to default. */
export function getSuite(id) {
  return SUITES[id] ?? SUITES[DEFAULT_SUITE];
}

/** Return the friendly label for a benchmark code within a suite. */
export function benchmarkLabel(code, suiteId) {
  const suite = getSuite(suiteId);
  return suite.benchmarkLabels[code] ?? code;
}
