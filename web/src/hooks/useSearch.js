import { useMemo } from "react";

const SPEC_BASE = "https://www.spec.org";

export function useSearch(data, filters, sortConfig, page, pageSize) {
  return useMemo(() => {
    if (!data || data.length === 0) {
      return { filtered: [], total: 0, pageData: [], totalPages: 0 };
    }

    let filtered = data;

    if (filters.benchmark) {
      filtered = filtered.filter((r) => r.benchmark === filters.benchmark);
    }
    if (filters.vendor) {
      filtered = filtered.filter((r) => r.vendor === filters.vendor);
    }
    if (filters.processor) {
      const q = filters.processor.toLowerCase();
      filtered = filtered.filter((r) => r.processor?.toLowerCase().includes(q));
    }
    if (filters.minCores) {
      const min = Number(filters.minCores);
      filtered = filtered.filter((r) => r.cores >= min);
    }
    if (filters.maxCores) {
      const max = Number(filters.maxCores);
      filtered = filtered.filter((r) => r.cores <= max);
    }
    if (filters.minPeak) {
      const min = Number(filters.minPeak);
      filtered = filtered.filter((r) => r.peakResult >= min);
    }
    if (filters.minBase) {
      const min = Number(filters.minBase);
      filtered = filtered.filter((r) => r.baseResult >= min);
    }

    // Sort
    const { key, direction } = sortConfig;
    filtered = [...filtered].sort((a, b) => {
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

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    return { filtered, total, pageData, totalPages };
  }, [data, filters, sortConfig, page, pageSize]);
}

export function specUrl(resultUrl) {
  if (!resultUrl) return null;
  return `${SPEC_BASE}${resultUrl}`;
}
