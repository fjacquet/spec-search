#!/usr/bin/env python3
"""FastMCP server for SPEC CPU2017 benchmark search."""

from fastmcp import FastMCP

from spec_search_mcp.data_loader import load_data

mcp = FastMCP(
    name="spec-search",
    instructions=(
        "Search SPEC CPU2017 benchmark results. Use search_benchmarks for filtered queries, "
        "get_top_results for rankings, compare_processors for side-by-side comparison, "
        "and get_statistics for aggregated data."
    ),
)

VALID_BENCHMARKS = ["CINT2017", "CFP2017", "CINT2017rate", "CFP2017rate"]
BENCHMARK_LABELS = {
    "CINT2017": "Integer Speed",
    "CFP2017": "FP Speed",
    "CINT2017rate": "Integer Rate",
    "CFP2017rate": "FP Rate",
}
SORT_COLUMNS = {
    "peak_result": "peakResult",
    "base_result": "baseResult",
    "cores": "cores",
    "processor_mhz": "processorMhz",
}


def _df_to_records(df, limit: int = 20) -> list[dict]:
    """Convert DataFrame rows to list of dicts, dropping NaN."""
    records = df.head(limit).where(df.notna(), None).to_dict(orient="records")
    for r in records:
        bm = r.get("benchmark", "")
        r["benchmarkLabel"] = BENCHMARK_LABELS.get(bm, bm)
    return records


@mcp.tool
def search_benchmarks(
    benchmark: str | None = None,
    vendor: str | None = None,
    processor: str | None = None,
    min_cores: int | None = None,
    max_cores: int | None = None,
    min_peak_result: float | None = None,
    min_base_result: float | None = None,
    os_filter: str | None = None,
    sort_by: str = "peak_result",
    sort_order: str = "desc",
    limit: int = 20,
) -> list[dict]:
    """Search SPEC CPU2017 benchmark results with filters.

    Args:
        benchmark: Filter by benchmark type (CINT2017, CFP2017, CINT2017rate, CFP2017rate)
        vendor: Filter by hardware vendor (exact match, case-insensitive)
        processor: Filter by processor name (substring match, case-insensitive)
        min_cores: Minimum number of cores
        max_cores: Maximum number of cores
        min_peak_result: Minimum peak result score
        min_base_result: Minimum base result score
        os_filter: Filter by operating system (substring match)
        sort_by: Sort column (peak_result, base_result, cores, processor_mhz)
        sort_order: Sort direction (asc or desc)
        limit: Max results to return (1-100, default 20)
    """
    df = load_data()
    limit = max(1, min(limit, 100))

    if benchmark:
        df = df[df["benchmark"].str.upper() == benchmark.upper()]
    if vendor:
        df = df[df["vendor"].str.lower() == vendor.strip().lower()]
    if processor:
        df = df[df["processor"].str.lower().str.contains(processor.lower(), na=False)]
    if min_cores is not None:
        df = df[df["cores"] >= min_cores]
    if max_cores is not None:
        df = df[df["cores"] <= max_cores]
    if min_peak_result is not None:
        df = df[df["peakResult"] >= min_peak_result]
    if min_base_result is not None:
        df = df[df["baseResult"] >= min_base_result]
    if os_filter:
        df = df[df["os"].str.lower().str.contains(os_filter.lower(), na=False)]

    sort_col = SORT_COLUMNS.get(sort_by, "peakResult")
    ascending = sort_order.lower() == "asc"
    df = df.sort_values(sort_col, ascending=ascending, na_position="last")

    return _df_to_records(df, limit)


@mcp.tool
def get_top_results(
    benchmark: str,
    metric: str = "peak",
    limit: int = 10,
) -> list[dict]:
    """Get top benchmark results sorted by score.

    Args:
        benchmark: Benchmark type (CINT2017, CFP2017, CINT2017rate, CFP2017rate)
        metric: Score metric to rank by (peak or base)
        limit: Number of top results (1-50, default 10)
    """
    df = load_data()
    limit = max(1, min(limit, 50))

    df = df[df["benchmark"].str.upper() == benchmark.upper()]
    col = "peakResult" if metric.lower() == "peak" else "baseResult"
    df = df.sort_values(col, ascending=False, na_position="last")

    return _df_to_records(df, limit)


@mcp.tool
def compare_processors(
    processor1: str,
    processor2: str,
    benchmark: str | None = None,
) -> dict:
    """Compare two processors across benchmarks.

    Args:
        processor1: First processor name (substring match)
        processor2: Second processor name (substring match)
        benchmark: Optional benchmark type filter
    """
    df = load_data()

    if benchmark:
        df = df[df["benchmark"].str.upper() == benchmark.upper()]

    p1 = df[df["processor"].str.lower().str.contains(processor1.lower(), na=False)]
    p2 = df[df["processor"].str.lower().str.contains(processor2.lower(), na=False)]

    return {
        "processor1": {
            "query": processor1,
            "matches": len(p1),
            "results": _df_to_records(p1.sort_values("peakResult", ascending=False), 20),
        },
        "processor2": {
            "query": processor2,
            "matches": len(p2),
            "results": _df_to_records(p2.sort_values("peakResult", ascending=False), 20),
        },
    }


@mcp.tool
def get_statistics(
    benchmark: str | None = None,
    vendor: str | None = None,
    group_by: str = "vendor",
) -> list[dict]:
    """Get summary statistics for benchmark results.

    Args:
        benchmark: Filter by benchmark type
        vendor: Filter by vendor
        group_by: Group results by (vendor, processor, or benchmark)
    """
    df = load_data()

    if benchmark:
        df = df[df["benchmark"].str.upper() == benchmark.upper()]
    if vendor:
        df = df[df["vendor"].str.lower() == vendor.strip().lower()]

    group_col_map = {"vendor": "vendor", "processor": "processor", "benchmark": "benchmark"}
    group_col = group_col_map.get(group_by, "vendor")

    if group_col not in df.columns or df.empty:
        return []

    stats = (
        df.groupby(group_col)
        .agg(
            count=("peakResult", "count"),
            mean_peak=("peakResult", "mean"),
            median_peak=("peakResult", "median"),
            max_peak=("peakResult", "max"),
            mean_base=("baseResult", "mean"),
            median_base=("baseResult", "median"),
            max_base=("baseResult", "max"),
        )
        .round(1)
        .sort_values("max_peak", ascending=False)
        .head(50)
        .reset_index()
    )

    records = stats.to_dict(orient="records")
    for r in records:
        if "benchmark" in r:
            r["benchmarkLabel"] = BENCHMARK_LABELS.get(r["benchmark"], r["benchmark"])
    return records


def main():
    mcp.run()


if __name__ == "__main__":
    main()
