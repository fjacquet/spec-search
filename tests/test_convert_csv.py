"""Tests for the CSV-to-JSON data pipeline."""

import json
import os
import sys

import pytest

# Add scripts to path so we can import the module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from convert_csv import extract_result_url, parse_numeric, process_row, slugify

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
    def test_extracts_html_url(self):
        html = (
            '<A HREF="/cpu2017/results/res2025q2/cpu2017-20250407-47429.html">HTML</A> '
            '<A HREF="/cpu2017/results/res2025q2/cpu2017-20250407-47429.csv">CSV</A>'
        )
        assert extract_result_url(html) == "/cpu2017/results/res2025q2/cpu2017-20250407-47429.html"

    def test_no_match(self):
        assert extract_result_url("no links here") is None

    def test_empty(self):
        assert extract_result_url("") is None


# --- process_row ---


class TestProcessRow:
    def _make_row(self, **overrides):
        """Create a minimal valid CSV row dict."""
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
        result = process_row(self._make_row())
        assert result["benchmark"] == "CINT2017"
        assert result["vendor"] == "Dell Inc."
        assert result["peakResult"] == 337
        assert result["baseResult"] == 320
        assert result["cores"] == 32
        assert result["processor"] == "Intel Xeon Gold 6526Y"
        assert result["resultUrl"] == "/cpu2017/results/res2024q1/cpu2017-20240101-00001.html"

    def test_strips_whitespace_from_keys(self):
        row = self._make_row()
        # Key has trailing tab (like real CSV)
        result = process_row(row)
        assert result["vendor"] == "Dell Inc."

    def test_numeric_conversion(self):
        result = process_row(self._make_row(**{"Peak Result": "21.5"}))
        assert result["peakResult"] == 21.5
        assert isinstance(result["peakResult"], float)

    def test_skips_row_without_benchmark(self):
        result = process_row(self._make_row(Benchmark=""))
        assert result is None

    def test_skips_row_without_processor(self):
        row = self._make_row()
        row["Processor "] = ""
        result = process_row(row)
        assert result is None

    def test_none_value_handled(self):
        row = self._make_row()
        row["Memory"] = None
        result = process_row(row)
        assert result["memory"] is None


# --- Integration: full pipeline on sample CSV ---


class TestPipelineIntegration:
    @pytest.fixture()
    def sample_csv(self, tmp_path):
        """Create a minimal CSV file for integration testing."""
        csv_content = (
            'Benchmark,"Hardware Vendor\t",System,"Peak Result","Base Result",'
            '"# Cores","# Chips ","# Enabled Threads Per Core","Processor ",'
            '"Processor MHz",Memory,"Operating System","HW Avail","Test Date",'
            "Published,Disclosures\r\n"
            'CINT2017,"Dell Inc.","PowerEdge R660",337,320,32,2,1,'
            '"Intel Xeon Gold 6526Y",2500,"512 GB","Ubuntu 22.04","Mar-2024",'
            '"Jan-2024","Mar-2024",'
            '"<A HREF=""/cpu2017/results/res2024q1/cpu2017-20240101-00001.html"">HTML</A>"\r\n'
            'CFP2017rate,"AMD Corp.","EPYC Server",450.5,430.2,64,1,2,'
            '"AMD EPYC 9654",2400,"1024 GB","RHEL 9.3","Feb-2024",'
            '"Feb-2024","Apr-2024",'
            '"<A HREF=""/cpu2017/results/res2024q2/cpu2017-20240201-00002.html"">HTML</A>"\r\n'
        )
        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content, encoding="utf-8-sig")
        return csv_file

    def test_full_pipeline(self, sample_csv, tmp_path, monkeypatch):
        """Test the full pipeline end-to-end with a sample CSV."""
        import convert_csv

        output_dir = tmp_path / "output"
        processors_dir = output_dir / "processors"
        output_dir.mkdir()
        processors_dir.mkdir()

        monkeypatch.setattr(convert_csv, "CSV_PATH", str(sample_csv))
        monkeypatch.setattr(convert_csv, "OUTPUT_DIR", str(output_dir))
        monkeypatch.setattr(convert_csv, "PROCESSORS_DIR", str(processors_dir))

        convert_csv.main()

        # Check results.json
        results = json.loads((output_dir / "results.json").read_text())
        assert len(results) == 2
        assert results[0]["benchmark"] == "CINT2017"
        assert results[1]["benchmark"] == "CFP2017rate"

        # Check facets.json
        facets = json.loads((output_dir / "facets.json").read_text())
        assert "CINT2017" in facets["benchmarks"]
        assert "CFP2017rate" in facets["benchmarks"]
        assert len(facets["vendors"]) == 2
        assert len(facets["processors"]) == 2

        # Check processor index
        index = json.loads((processors_dir / "index.json").read_text())
        assert "Intel Xeon Gold 6526Y" in index
        assert index["Intel Xeon Gold 6526Y"] == "intel-xeon-gold-6526y"

        # Check per-processor file
        proc_file = processors_dir / "intel-xeon-gold-6526y.json"
        assert proc_file.exists()
        proc_data = json.loads(proc_file.read_text())
        assert proc_data["processor"] == "Intel Xeon Gold 6526Y"
        assert len(proc_data["results"]) == 1
        assert proc_data["results"][0]["peakResult"] == 337
