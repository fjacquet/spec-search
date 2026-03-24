"""Tests for the CSV-to-JSON data pipeline."""

import json
import os
import sys

import pytest

# Add scripts to path so we can import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from convert_csv import SUITES, extract_result_url, parse_numeric, process_row, slugify

# --- slugify ---


class TestSlugify:
    def test_simple(self):
        assert slugify("AMD EPYC 4245P") == "amd-epyc-4245p"

    def test_special_chars(self):
        assert slugify("Intel Xeon Gold 6526Y") == "intel-xeon-gold-6526y"

    def test_strips_leading_trailing(self):
        assert slugify("  AMD EPYC 9654  ") == "amd-epyc-9654"

    def test_multiple_spaces(self):
        assert slugify("Intel  Xeon   Platinum") == "intel-xeon-platinum"

    def test_slashes_and_parens(self):
        assert slugify("ARM Neoverse-N1 (2.6GHz)") == "arm-neoverse-n1-2-6ghz"


# --- parse_numeric ---


class TestParseNumeric:
    def test_integer(self):
        assert parse_numeric("42") == 42
        assert isinstance(parse_numeric("42"), int)

    def test_float(self):
        assert parse_numeric("21.5") == 21.5
        assert isinstance(parse_numeric("21.5"), float)

    def test_zero(self):
        assert parse_numeric("0") == 0

    def test_empty(self):
        assert parse_numeric("") is None

    def test_whitespace(self):
        assert parse_numeric("  3900  ") == 3900

    def test_invalid(self):
        assert parse_numeric("N/A") is None


# --- extract_result_url ---


class TestExtractResultUrl:
    def test_extracts_cpu2017_url(self):
        html = (
            '<A HREF="/cpu2017/results/res2025q2/cpu2017-20250407-47429.html">HTML</A> '
            '<A HREF="/cpu2017/results/res2025q2/cpu2017-20250407-47429.csv">CSV</A>'
        )
        pattern = SUITES["cpu2017"]["url_pattern"]
        assert extract_result_url(html, pattern) == "/cpu2017/results/res2025q2/cpu2017-20250407-47429.html"

    def test_extracts_jbb2015_url(self):
        html = (
            "http://www.spec.org/jbb2015/results/res2023q2/jbb2015-20230517-01040.html"
            '"<A HREF=""/jbb2015/results/res2023q2/jbb2015-20230517-01040.html"">HTML</A>"'
        )
        pattern = SUITES["jbb2015"]["url_pattern"]
        result = extract_result_url(html, pattern)
        assert result == "/jbb2015/results/res2023q2/jbb2015-20230517-01040.html"

    def test_no_match(self):
        pattern = SUITES["cpu2017"]["url_pattern"]
        assert extract_result_url("no links here", pattern) is None

    def test_empty(self):
        pattern = SUITES["cpu2017"]["url_pattern"]
        assert extract_result_url("", pattern) is None


# --- process_row (CPU2017) ---


class TestProcessRowCpu2017:
    def _make_row(self, **overrides):
        """Create a minimal valid CPU2017 CSV row dict."""
        base = {
            "Benchmark": "CINT2017",
            "Hardware Vendor\t": "Dell Inc.",
            "System": "PowerEdge R660",
            "Peak Result": "337",
            "Base Result": "320",
            "# Cores": "32",
            "# Chips ": "2",
            "# Enabled Threads Per Core": "1",
            "Processor ": "Intel Xeon Gold 6526Y",
            "Processor MHz": "2500",
            "Memory": "512 GB",
            "Operating System": "Ubuntu 22.04",
            "HW Avail": "Mar-2024",
            "Test Date": "Jan-2024",
            "Published": "Mar-2024",
            "Disclosures": '<A HREF="/cpu2017/results/res2024q1/cpu2017-20240101-00001.html">HTML</A>',
        }
        base.update(overrides)
        return base

    def test_basic_row(self):
        result = process_row(self._make_row(), SUITES["cpu2017"])
        assert result["benchmark"] == "CINT2017"
        assert result["vendor"] == "Dell Inc."
        assert result["peakResult"] == 337
        assert result["baseResult"] == 320
        assert result["cores"] == 32
        assert result["processor"] == "Intel Xeon Gold 6526Y"
        assert result["resultUrl"] == "/cpu2017/results/res2024q1/cpu2017-20240101-00001.html"

    def test_strips_whitespace_from_keys(self):
        row = self._make_row()
        result = process_row(row, SUITES["cpu2017"])
        assert result["vendor"] == "Dell Inc."

    def test_numeric_conversion(self):
        result = process_row(self._make_row(**{"Peak Result": "21.5"}), SUITES["cpu2017"])
        assert result["peakResult"] == 21.5
        assert isinstance(result["peakResult"], float)

    def test_skips_row_without_benchmark(self):
        result = process_row(self._make_row(Benchmark=""), SUITES["cpu2017"])
        assert result is None

    def test_skips_row_without_processor(self):
        row = self._make_row()
        row["Processor "] = ""
        result = process_row(row, SUITES["cpu2017"])
        assert result is None

    def test_none_value_handled(self):
        row = self._make_row()
        row["Memory"] = None
        result = process_row(row, SUITES["cpu2017"])
        assert result["memory"] is None


# --- process_row (JBB2015) ---


class TestProcessRowJbb2015:
    def _make_row(self, **overrides):
        """Create a minimal valid JBB2015 CSV row dict."""
        base = {
            "Benchmark": "JBB2015MULTI",
            "Company": "ASUSTeK Computer Inc.",
            "System": "RS520A-E12-RS12U",
            "Max-jOPS\t": "362000",
            "Critical-jOPS\t": "335166",
            "JVM": "Oracle Java SE 17.0.7",
            "JVM Vendor  ": "Oracle",
            "# of nodes": "1",
            "# cores": "128",
            "# chips": "1",
            "# of threads per core ": "2",
            "Processor": "AMD EPYC 9754",
            "CPU Speed": "2250",
            "Memory (GB)": "768",
            "Operating System": "SUSE Linux Enterprise Server 15 SP4",
            "Hardware Availability": "Jun-2023",
            "Test Date": "",
            "Published": "Jun-2023",
            "Disclosure": (
                'http://www.spec.org/jbb2015/results/res2023q2/'
                'jbb2015-20230517-01040.html"<A HREF=""'
                '/jbb2015/results/res2023q2/jbb2015-20230517-01040.html"">HTML</A>"'
            ),
        }
        base.update(overrides)
        return base

    def test_basic_row(self):
        result = process_row(self._make_row(), SUITES["jbb2015"])
        assert result["benchmark"] == "JBB2015MULTI"
        assert result["vendor"] == "ASUSTeK Computer Inc."
        assert result["peakResult"] == 362000
        assert result["baseResult"] == 335166
        assert result["cores"] == 128
        assert result["jvm"] == "Oracle Java SE 17.0.7"
        assert result["jvmVendor"] == "Oracle"
        assert result["nodes"] == 1
        assert result["processor"] == "AMD EPYC 9754"
        assert result["resultUrl"] == "/jbb2015/results/res2023q2/jbb2015-20230517-01040.html"

    def test_skips_row_without_processor(self):
        result = process_row(self._make_row(Processor=""), SUITES["jbb2015"])
        assert result is None


# --- Integration: full pipeline on sample CSV ---


class TestPipelineIntegration:
    @pytest.fixture()
    def sample_csvs(self, tmp_path):
        """Create minimal CSV files for integration testing."""
        datas_dir = tmp_path / "datas"
        datas_dir.mkdir()

        cpu_content = (
            'Benchmark,"Hardware Vendor\t",System,"Peak Result","Base Result",'
            '"# Cores","# Chips ","# Enabled Threads Per Core","Processor ",'
            '"Processor MHz",Memory,"Operating System","HW Avail","Test Date",'
            "Published,Disclosures\r\n"
            'CINT2017,"Dell Inc.","PowerEdge R660",337,320,32,2,1,'
            '"Intel Xeon Gold 6526Y",2500,"512 GB","Ubuntu 22.04","Mar-2024",'
            '"Jan-2024","Mar-2024",'
            '"<A HREF=""/cpu2017/results/res2024q1/cpu2017-20240101-00001.html"">HTML</A>"\r\n'
        )
        (datas_dir / "cpu2017-results.csv").write_text(cpu_content, encoding="utf-8-sig")

        jbb_content = (
            "Benchmark,Company,System,\"Max-jOPS\t\",\"Critical-jOPS\t\",JVM,\"JVM Vendor  \","
            "\"# of nodes\",\"# cores\",\"# chips\",\"# cores per chip\","
            "\"# of threads per core \",\"Total # of threads \",Processor,"
            "\"CPU Speed\",\"CPU Characteristics \",\"Primary Cache\","
            "\"Secondary Cache\",\"Tertiary Cache\",\"Memory (GB)\","
            "\"DIMMS \",\"Memory Details\",\"Disk \t\",\"File System \t\","
            "\"Operating System\",\"OS Vendor\",\"NICs\t\",\"PSU\t\","
            "\"Form factor\t\",\"Enclosure\t\",\"Hardware Availability\","
            "\"OS Availability\",\"JVM Availability\",\"SW Availability\","
            "License,\"Tested By\",\"Test Sponsor\",\"Test Date\",Published,"
            "\"Updated \",Disclosure,\"Disclosure URL\",Disclosures\r\n"
            "JBB2015MULTI,\"TestCo\",TestSys,100000,90000,\"TestJVM\",Oracle,1,64,1,64,2,128,"
            "\"AMD EPYC 9654\",2400,\"64 Core\",\"32 KB\",\"1 MB\",\"256 MB\",512,"
            "\"8 x 64 GB\",\"64 GB\",\"1 x SSD\",xfs,\"SUSE Linux\",SUSE,"
            "\"1 x NIC\",\"2 x 1600W\",2U,None,Jun-2023,Jun-2022,Apr-2023,Apr-2023,"
            "9016,TestCo,TestCo,,Jun-2023,,"
            "\"http://www.spec.org/jbb2015/results/res2023q2/"
            "jbb2015-20230517-01040.html\"\"<A HREF=\"\"/jbb2015/results/"
            "res2023q2/jbb2015-20230517-01040.html\"\">HTML</A>\"\",,"
            "\r\n"
        )
        (datas_dir / "jbb2015-results.csv").write_text(jbb_content, encoding="utf-8-sig")

        return datas_dir

    def test_full_pipeline(self, sample_csvs, tmp_path, monkeypatch):
        """Test the full pipeline end-to-end with sample CSVs."""
        import convert_csv

        output_dir = tmp_path / "output"

        monkeypatch.setattr(convert_csv, "DATAS_DIR", str(sample_csvs))
        monkeypatch.setattr(convert_csv, "BASE_OUTPUT_DIR", str(output_dir))

        convert_csv.main()

        # Check CPU2017 results
        cpu_results = json.loads((output_dir / "cpu2017" / "results.json").read_text())
        assert len(cpu_results) == 1
        assert cpu_results[0]["benchmark"] == "CINT2017"

        cpu_facets = json.loads((output_dir / "cpu2017" / "facets.json").read_text())
        assert "CINT2017" in cpu_facets["benchmarks"]

        # Check JBB2015 results
        jbb_results = json.loads((output_dir / "jbb2015" / "results.json").read_text())
        assert len(jbb_results) == 1
        assert jbb_results[0]["benchmark"] == "JBB2015MULTI"
        assert jbb_results[0]["peakResult"] == 100000
        assert jbb_results[0]["jvm"] == "TestJVM"
        assert jbb_results[0]["jvmVendor"] == "Oracle"
        assert jbb_results[0]["nodes"] == 1

        jbb_facets = json.loads((output_dir / "jbb2015" / "facets.json").read_text())
        assert "JBB2015MULTI" in jbb_facets["benchmarks"]
        assert "jvmVendors" in jbb_facets
        assert "Oracle" in jbb_facets["jvmVendors"]
