"""Tests for the MCP server tools (unit tests with mock DataFrames)."""

import pandas as pd
import pytest

import spec_search_mcp.data_loader as data_loader
from spec_search_mcp.server import compare_processors, get_statistics, get_top_results, search_benchmarks

CPU2017_DATA = pd.DataFrame(
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

CPU2026_DATA = pd.DataFrame(
    [
        {
            "benchmark": "CINT2026rate",
            "vendor": "Dell Inc.",
            "system": "PowerEdge M7725",
            "peakResult": 8.05,
            "baseResult": 8.05,
            "energyPeakResult": None,
            "energyBaseResult": None,
            "cores": 256,
            "chips": 2,
            "threadsPerCore": 2,
            "processor": "AMD EPYC 9755",
            "processorMhz": 2700,
            "l1Cache": "32 KB",
            "l2Cache": "1 MB",
            "l3Cache": "512 MB",
            "memory": "1536 GB",
            "storage": "tmpfs",
            "os": "Ubuntu 24.04.1 LTS",
            "fileSystem": "tmpfs",
            "compiler": "AOCC 5.1.0",
            "compilerCategory": "Vendor",
            "hwAvail": "Jan-2025",
            "swAvail": "Jan-2026",
            "testDate": "Feb-2026",
            "published": "May-2026",
            "resultUrl": "/cpu2026/results/res2026q2/cpu2026-20260210-00034.html",
        },
        {
            "benchmark": "CINT2026rate",
            "vendor": "Cisco Systems",
            "system": "UCS X410c M8",
            "peakResult": 6.89,
            "baseResult": 6.82,
            "energyPeakResult": 1.5,
            "energyBaseResult": 1.4,
            "cores": 344,
            "chips": 4,
            "threadsPerCore": 2,
            "processor": "Intel Xeon 6788P",
            "processorMhz": 2000,
            "l1Cache": "64 KB",
            "l2Cache": "2 MB",
            "l3Cache": "336 MB",
            "memory": "2 TB",
            "storage": "btrfs",
            "os": "SUSE Linux Enterprise Server 15 SP6",
            "fileSystem": "btrfs",
            "compiler": "Intel oneAPI 2026.0",
            "compilerCategory": "Vendor",
            "hwAvail": "May-2025",
            "swAvail": "Apr-2026",
            "testDate": "May-2026",
            "published": "Jun-2026",
            "resultUrl": "/cpu2026/results/res2026q2/cpu2026-20260602-00288.html",
        },
    ]
)

JBB2015_DATA = pd.DataFrame(
    [
        {
            "benchmark": "JBB2015MULTI",
            "vendor": "ASUSTeK Computer Inc.",
            "system": "RS520A-E12-RS12U",
            "peakResult": 362000.0,
            "baseResult": 335166.0,
            "cores": 128,
            "chips": 1,
            "threadsPerCore": 2,
            "processor": "AMD EPYC 9754",
            "processorMhz": 2250,
            "memory": "768",
            "os": "SUSE Linux Enterprise Server 15 SP4",
            "hwAvail": "Jun-2023",
            "testDate": None,
            "published": "Jun-2023",
            "resultUrl": "/jbb2015/results/res2023q2/jbb2015-20230517-01040.html",
            "jvm": "Oracle Java SE 17.0.7",
            "jvmVendor": "Oracle",
            "nodes": 1,
        },
        {
            "benchmark": "JBB2015MULTI",
            "vendor": "Dell Inc.",
            "system": "PowerEdge R760",
            "peakResult": 280000.0,
            "baseResult": 260000.0,
            "cores": 64,
            "chips": 1,
            "threadsPerCore": 2,
            "processor": "Intel Xeon Platinum 8490H",
            "processorMhz": 1900,
            "memory": "512",
            "os": "RHEL 9.3",
            "hwAvail": "Jul-2023",
            "testDate": None,
            "published": "Jul-2023",
            "resultUrl": "/jbb2015/results/res2023q3/jbb2015-20230701-01100.html",
            "jvm": "OpenJDK 17.0.8",
            "jvmVendor": "Red Hat",
            "nodes": 1,
        },
    ]
)


@pytest.fixture(autouse=True)
def mock_data(monkeypatch):
    """Replace load_data cache with mock DataFrames for all suites."""
    monkeypatch.setattr(
        data_loader,
        "_dfs",
        {"cpu2017": CPU2017_DATA, "jbb2015": JBB2015_DATA, "cpu2026": CPU2026_DATA},
    )


# --- search_benchmarks (CPU2017) ---


class TestSearchBenchmarksCpu2017:
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
        assert len(results) == 4

    def test_combined_filters(self):
        results = search_benchmarks(benchmark="CINT2017rate", vendor="Dell Inc.")
        assert len(results) == 2

    def test_benchmark_label_in_results(self):
        results = search_benchmarks(benchmark="CINT2017rate")
        assert all(r["benchmarkLabel"] == "Integer Multi-Core" for r in results)

    def test_benchmark_label_fp(self):
        results = search_benchmarks(benchmark="CFP2017rate")
        assert all(r["benchmarkLabel"] == "FP Multi-Core" for r in results)


# --- search_benchmarks (JBB2015) ---


class TestSearchBenchmarksJbb2015:
    def test_no_filters(self):
        results = search_benchmarks(suite="jbb2015")
        assert len(results) == 2

    def test_filter_benchmark(self):
        results = search_benchmarks(suite="jbb2015", benchmark="JBB2015MULTI")
        assert len(results) == 2

    def test_filter_vendor(self):
        results = search_benchmarks(suite="jbb2015", vendor="Dell Inc.")
        assert len(results) == 1

    def test_filter_processor(self):
        results = search_benchmarks(suite="jbb2015", processor="EPYC")
        assert len(results) == 1
        assert results[0]["processor"] == "AMD EPYC 9754"

    def test_benchmark_label(self):
        results = search_benchmarks(suite="jbb2015")
        assert all(r["benchmarkLabel"] == "Multi-JVM" for r in results)

    def test_jbb2015_extra_fields(self):
        results = search_benchmarks(suite="jbb2015", processor="EPYC")
        assert results[0]["jvm"] == "Oracle Java SE 17.0.7"
        assert results[0]["jvmVendor"] == "Oracle"
        assert results[0]["nodes"] == 1


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

    def test_jbb2015_top(self):
        results = get_top_results(suite="jbb2015", benchmark="JBB2015MULTI")
        assert len(results) == 2
        assert results[0]["peakResult"] >= results[1]["peakResult"]


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

    def test_jbb2015_compare(self):
        result = compare_processors("EPYC", "8490H", suite="jbb2015")
        assert result["processor1"]["matches"] == 1
        assert result["processor2"]["matches"] == 1


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
        assert labels["CINT2017rate"] == "Integer Multi-Core"
        assert labels["CFP2017rate"] == "FP Multi-Core"

    def test_filter_benchmark(self):
        results = get_statistics(benchmark="CINT2017rate", group_by="vendor")
        dell = next(r for r in results if r["vendor"] == "Dell Inc.")
        assert dell["count"] == 2

    def test_filter_vendor(self):
        results = get_statistics(vendor="Dell Inc.", group_by="benchmark")
        benchmarks = [r["benchmark"] for r in results]
        assert "CINT2017rate" in benchmarks

    def test_empty_result(self):
        results = get_statistics(benchmark="NONEXISTENT")
        assert results == []

    def test_jbb2015_stats(self):
        results = get_statistics(suite="jbb2015", group_by="vendor")
        vendors = [r["vendor"] for r in results]
        assert "ASUSTeK Computer Inc." in vendors
        assert "Dell Inc." in vendors


# --- search_benchmarks (CPU2026) ---


class TestSearchBenchmarksCpu2026:
    def test_no_filters(self):
        results = search_benchmarks(suite="cpu2026")
        assert len(results) == 2

    def test_benchmark_label(self):
        results = search_benchmarks(suite="cpu2026", benchmark="CINT2026rate")
        assert all(r["benchmarkLabel"] == "Integer Multi-Core" for r in results)

    def test_enrichment_fields_present(self):
        results = search_benchmarks(suite="cpu2026", processor="EPYC")
        assert results[0]["compilerCategory"] == "Vendor"
        assert results[0]["l3Cache"] == "512 MB"
        assert results[0]["energyPeakResult"] is None

    def test_sort_by_energy_peak(self):
        results = search_benchmarks(suite="cpu2026", sort_by="energy_peak", sort_order="desc")
        # Cisco (1.5) ranks above Dell (None); None sorts last
        assert results[0]["processor"] == "Intel Xeon 6788P"

    def test_energy_sort_falls_back_on_cpu2017(self):
        # cpu2017 has no energy columns; sort must not raise and falls back to peak
        results = search_benchmarks(suite="cpu2017", sort_by="energy_peak")
        assert len(results) == 4
