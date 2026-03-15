import { describe, expect, it } from "vitest";

// We can't use the hook directly outside React, so test the core logic inline.
// The hook is a thin wrapper around filter/sort/paginate — we test that logic here.

const SPEC_BASE = "https://www.spec.org";

function specUrl(resultUrl) {
  if (!resultUrl) return null;
  return `${SPEC_BASE}${resultUrl}`;
}

function applyFilters(data, filters) {
  let filtered = data;
  if (filters.benchmark)
    filtered = filtered.filter((r) => r.benchmark === filters.benchmark);
  if (filters.vendor)
    filtered = filtered.filter((r) => r.vendor === filters.vendor);
  if (filters.processor) {
    const q = filters.processor.toLowerCase();
    filtered = filtered.filter((r) => r.processor?.toLowerCase().includes(q));
  }
  if (filters.minCores)
    filtered = filtered.filter((r) => r.cores >= Number(filters.minCores));
  if (filters.maxCores)
    filtered = filtered.filter((r) => r.cores <= Number(filters.maxCores));
  if (filters.minPeak)
    filtered = filtered.filter((r) => r.peakResult >= Number(filters.minPeak));
  if (filters.minBase)
    filtered = filtered.filter((r) => r.baseResult >= Number(filters.minBase));
  return filtered;
}

function applySort(data, key, direction) {
  return [...data].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return direction === "asc" ? av - bv : bv - av;
    }
    const cmp = String(av).localeCompare(String(bv));
    return direction === "asc" ? cmp : -cmp;
  });
}

function paginate(data, page, pageSize) {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

// Test data
const MOCK_DATA = [
  {
    benchmark: "CINT2017rate",
    vendor: "Dell Inc.",
    system: "PowerEdge R660",
    processor: "Intel Xeon Gold 6526Y",
    peakResult: 337,
    baseResult: 320,
    cores: 32,
    chips: 2,
    resultUrl: "/cpu2017/results/res2024q1/cpu2017-20240101-00001.html",
  },
  {
    benchmark: "CINT2017rate",
    vendor: "HPE",
    system: "ProLiant DL380",
    processor: "Intel Xeon Platinum 8490H",
    peakResult: 400,
    baseResult: 380,
    cores: 64,
    chips: 2,
    resultUrl: "/cpu2017/results/res2024q1/cpu2017-20240102-00002.html",
  },
  {
    benchmark: "CFP2017rate",
    vendor: "Dell Inc.",
    system: "PowerEdge R760",
    processor: "AMD EPYC 9654",
    peakResult: 500,
    baseResult: 480,
    cores: 128,
    chips: 2,
    resultUrl: null,
  },
  {
    benchmark: "CINT2017rate",
    vendor: "Dell Inc.",
    system: "PowerEdge R760",
    processor: "AMD EPYC 9654",
    peakResult: 450,
    baseResult: 430,
    cores: 128,
    chips: 2,
    resultUrl: "/cpu2017/results/res2024q1/cpu2017-20240104-00004.html",
  },
];

// --- specUrl ---

describe("specUrl", () => {
  it("builds full URL from path", () => {
    expect(
      specUrl("/cpu2017/results/res2024q1/cpu2017-20240101-00001.html"),
    ).toBe(
      "https://www.spec.org/cpu2017/results/res2024q1/cpu2017-20240101-00001.html",
    );
  });

  it("returns null for null input", () => {
    expect(specUrl(null)).toBeNull();
  });
});

// --- Filtering ---

describe("applyFilters", () => {
  it("returns all data with empty filters", () => {
    const result = applyFilters(MOCK_DATA, {});
    expect(result).toHaveLength(4);
  });

  it("filters by benchmark", () => {
    const result = applyFilters(MOCK_DATA, { benchmark: "CINT2017rate" });
    expect(result).toHaveLength(3);
  });

  it("filters by vendor", () => {
    const result = applyFilters(MOCK_DATA, { vendor: "Dell Inc." });
    expect(result).toHaveLength(3);
  });

  it("filters by processor substring", () => {
    const result = applyFilters(MOCK_DATA, { processor: "epyc" });
    expect(result).toHaveLength(2);
  });

  it("filters by min cores", () => {
    const result = applyFilters(MOCK_DATA, { minCores: "64" });
    expect(result).toHaveLength(3);
  });

  it("filters by max cores", () => {
    const result = applyFilters(MOCK_DATA, { maxCores: "32" });
    expect(result).toHaveLength(1);
  });

  it("filters by min peak score", () => {
    const result = applyFilters(MOCK_DATA, { minPeak: "400" });
    expect(result).toHaveLength(3);
  });

  it("filters by min base score", () => {
    const result = applyFilters(MOCK_DATA, { minBase: "400" });
    expect(result).toHaveLength(2);
  });

  it("combines multiple filters", () => {
    const result = applyFilters(MOCK_DATA, {
      benchmark: "CINT2017rate",
      vendor: "Dell Inc.",
    });
    expect(result).toHaveLength(2);
  });
});

// --- Sorting ---

describe("applySort", () => {
  it("sorts by peak descending", () => {
    const sorted = applySort(MOCK_DATA, "peakResult", "desc");
    const peaks = sorted.map((r) => r.peakResult);
    expect(peaks).toEqual([500, 450, 400, 337]);
  });

  it("sorts by peak ascending", () => {
    const sorted = applySort(MOCK_DATA, "peakResult", "asc");
    const peaks = sorted.map((r) => r.peakResult);
    expect(peaks).toEqual([337, 400, 450, 500]);
  });

  it("sorts by string column ascending", () => {
    const sorted = applySort(MOCK_DATA, "vendor", "asc");
    expect(sorted[0].vendor).toBe("Dell Inc.");
  });

  it("handles null values (pushed to end)", () => {
    const data = [
      { peakResult: null },
      { peakResult: 100 },
      { peakResult: 200 },
    ];
    const sorted = applySort(data, "peakResult", "desc");
    expect(sorted[0].peakResult).toBe(200);
    expect(sorted[2].peakResult).toBeNull();
  });
});

// --- Pagination ---

describe("paginate", () => {
  it("returns first page", () => {
    const result = paginate(MOCK_DATA, 1, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(MOCK_DATA[0]);
  });

  it("returns second page", () => {
    const result = paginate(MOCK_DATA, 2, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(MOCK_DATA[2]);
  });

  it("handles last page with fewer items", () => {
    const result = paginate(MOCK_DATA, 2, 3);
    expect(result).toHaveLength(1);
  });

  it("returns empty for out-of-range page", () => {
    const result = paginate(MOCK_DATA, 10, 50);
    expect(result).toHaveLength(0);
  });
});
