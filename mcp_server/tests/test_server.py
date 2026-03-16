"""Tests for the MCP server tools (unit tests with a mock DataFrame)."""

import pandas as pd
import pytest

import spec_search_mcp.data_loader as data_loader
from spec_search_mcp.server import compare_processors, get_statistics, get_top_results, search_benchmarks


@pytest.fixture(autouse=True)
def mock_data(monkeypatch):
    """Replace load_data with a small in-memory DataFrame."""
    df = pd.DataFrame(
        [
            {
                "benchmark": "CINT2017rate",
                "vendor": "Dell Inc.",
                "system": "PowerEdge R660",
                "peakResult": 337.0,
                "baseResult": 320.0,
                "cores": 32,
                "chips": 2,
                "threadsPerCore": 1,
                "processor": "Intel Xeon Gold 6526Y",
                "processorMhz": 2500,
                "memory": "512 GB",
                "os": "Ubuntu 22.04",
                "hwAvail": "Mar-2024",
                "testDate": "Jan-2024",
                "published": "Mar-2024",
                "resultUrl": "/cpu2017/results/res2024q1/cpu2017-20240101-00001.html",
            },
            {
                "benchmark": "CINT2017rate",
                "vendor": "HPE",
                "system": "ProLiant DL380",
                "peakResult": 400.0,
                "baseResult": 380.0,
                "cores": 64,
                "chips": 2,
                "threadsPerCore": 2,
                "processor": "Intel Xeon Platinum 8490H",
                "processorMhz": 1900,
                "memory": "1024 GB",
                "os": "RHEL 9.3",
                "hwAvail": "Feb-2024",
                "testDate": "Dec-2023",
                "published": "Feb-2024",
                "resultUrl": "/cpu2017/results/res2024q1/cpu2017-20240102-00002.html",
            },
            {
                "benchmark": "CFP2017rate",
                "vendor": "Dell Inc.",
                "system": "PowerEdge R760",
                "peakResult": 500.0,
                "baseResult": 480.0,
                "cores": 128,
                "chips": 2,
                "threadsPerCore": 2,
                "processor": "AMD EPYC 9654",
                "processorMhz": 2400,
                "memory": "1024 GB",
                "os": "Ubuntu 22.04",
                "hwAvail": "Jan-2024",
                "testDate": "Nov-2023",
                "published": "Jan-2024",
                "resultUrl": "/cpu2017/results/res2024q1/cpu2017-20240103-00003.html",
            },
            {
                "benchmark": "CINT2017rate",
                "vendor": "Dell Inc.",
                "system": "PowerEdge R760",
                "peakResult": 450.0,
                "baseResult": 430.0,
                "cores": 128,
                "chips": 2,
                "threadsPerCore": 2,
                "processor": "AMD EPYC 9654",
                "processorMhz": 2400,
                "memory": "1024 GB",
                "os": "RHEL 9.3",
                "hwAvail": "Jan-2024",
                "testDate": "Nov-2023",
                "published": "Jan-2024",
                "resultUrl": "/cpu2017/results/res2024q1/cpu2017-20240104-00004.html",
            },
        ]
    )
    monkeypatch.setattr(data_loader, "_df", df)


# --- search_benchmarks ---


class TestSearchBenchmarks:
    def test_no_filters(self):
        results = search_benchmarks()
        assert len(results) == 4

    def test_filter_benchmark(self):
        results = search_benchmarks(benchmark="CINT2017rate")
        assert len(results) == 3
        assert all(r["benchmark"] == "CINT2017rate" for r in results)

    def test_filter_vendor(self):
        results = search_benchmarks(vendor="Dell Inc.")
        assert len(results) == 3

    def test_filter_processor_substring(self):
        results = search_benchmarks(processor="EPYC")
        assert len(results) == 2
        assert all("EPYC" in r["processor"] for r in results)

    def test_filter_min_cores(self):
        results = search_benchmarks(min_cores=64)
        assert len(results) == 3
        assert all(r["cores"] >= 64 for r in results)

    def test_filter_max_cores(self):
        results = search_benchmarks(max_cores=32)
        assert len(results) == 1

    def test_filter_min_peak(self):
        results = search_benchmarks(min_peak_result=400.0)
        assert len(results) == 3

    def test_filter_os(self):
        results = search_benchmarks(os_filter="ubuntu")
        assert len(results) == 2

    def test_sort_ascending(self):
        results = search_benchmarks(sort_by="peak_result", sort_order="asc")
        peaks = [r["peakResult"] for r in results]
        assert peaks == sorted(peaks)

    def test_sort_descending(self):
        results = search_benchmarks(sort_by="peak_result", sort_order="desc")
        peaks = [r["peakResult"] for r in results]
        assert peaks == sorted(peaks, reverse=True)

    def test_limit(self):
        results = search_benchmarks(limit=2)
        assert len(results) == 2

    def test_limit_clamped(self):
        results = search_benchmarks(limit=200)
        assert len(results) == 4  # only 4 rows in mock data

    def test_combined_filters(self):
        results = search_benchmarks(benchmark="CINT2017rate", vendor="Dell Inc.")
        assert len(results) == 2

    def test_benchmark_label_in_results(self):
        results = search_benchmarks(benchmark="CINT2017rate")
        assert all(r["benchmarkLabel"] == "Integer Rate" for r in results)

    def test_benchmark_label_fp(self):
        results = search_benchmarks(benchmark="CFP2017rate")
        assert all(r["benchmarkLabel"] == "FP Rate" for r in results)


# --- get_top_results ---


class TestGetTopResults:
    def test_top_peak(self):
        results = get_top_results(benchmark="CINT2017rate", metric="peak", limit=2)
        assert len(results) == 2
        assert results[0]["peakResult"] >= results[1]["peakResult"]

    def test_top_base(self):
        results = get_top_results(benchmark="CINT2017rate", metric="base", limit=3)
        assert len(results) == 3
        bases = [r["baseResult"] for r in results]
        assert bases == sorted(bases, reverse=True)

    def test_benchmark_filter(self):
        results = get_top_results(benchmark="CFP2017rate")
        assert len(results) == 1
        assert results[0]["benchmark"] == "CFP2017rate"


# --- compare_processors ---


class TestCompareProcessors:
    def test_compare(self):
        result = compare_processors("6526Y", "EPYC")
        assert result["processor1"]["query"] == "6526Y"
        assert result["processor1"]["matches"] == 1
        assert result["processor2"]["query"] == "EPYC"
        assert result["processor2"]["matches"] == 2

    def test_compare_with_benchmark(self):
        result = compare_processors("6526Y", "EPYC", benchmark="CINT2017rate")
        assert result["processor1"]["matches"] == 1
        assert result["processor2"]["matches"] == 1

    def test_no_match(self):
        result = compare_processors("NonExistent", "EPYC")
        assert result["processor1"]["matches"] == 0
        assert len(result["processor1"]["results"]) == 0


# --- get_statistics ---


class TestGetStatistics:
    def test_group_by_vendor(self):
        results = get_statistics(group_by="vendor")
        vendors = [r["vendor"] for r in results]
        assert "Dell Inc." in vendors
        assert "HPE" in vendors

    def test_group_by_benchmark(self):
        results = get_statistics(group_by="benchmark")
        benchmarks = [r["benchmark"] for r in results]
        assert "CINT2017rate" in benchmarks
        assert "CFP2017rate" in benchmarks

    def test_benchmark_label_in_statistics(self):
        results = get_statistics(group_by="benchmark")
        labels = {r["benchmark"]: r["benchmarkLabel"] for r in results}
        assert labels["CINT2017rate"] == "Integer Rate"
        assert labels["CFP2017rate"] == "FP Rate"

    def test_filter_benchmark(self):
        results = get_statistics(benchmark="CINT2017rate", group_by="vendor")
        # Should only include CINT2017rate data
        dell = next(r for r in results if r["vendor"] == "Dell Inc.")
        assert dell["count"] == 2

    def test_filter_vendor(self):
        results = get_statistics(vendor="Dell Inc.", group_by="benchmark")
        assert all(True for r in results)  # just check no error
        benchmarks = [r["benchmark"] for r in results]
        assert "CINT2017rate" in benchmarks

    def test_empty_result(self):
        results = get_statistics(benchmark="NONEXISTENT")
        assert results == []
