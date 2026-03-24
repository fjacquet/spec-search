"""Load and cache SPEC benchmark data from CSV (CPU2017 and JBB2015)."""

import gzip
import importlib.resources
import io
import os
import re

import pandas as pd

_CSV_OVERRIDE = os.environ.get("SPEC_SEARCH_CSV_PATH")

_dfs: dict[str, pd.DataFrame] = {}

VALID_SUITES = ["cpu2017", "jbb2015"]

CPU2017_URL_PATTERN = re.compile(r'HREF="(/cpu2017/results/[^"]+\.html)"')
JBB2015_URL_PATTERN = re.compile(r'(/jbb2015/results/[^"]+\.html)')

SUITE_CONFIGS = {
    "cpu2017": {
        "csv_filename": "cpu2017-results.csv",
        "rename_map": {
            "Benchmark": "benchmark",
            "Hardware Vendor": "vendor",
            "System": "system",
            "Peak Result": "peakResult",
            "Base Result": "baseResult",
            "# Cores": "cores",
            "# Chips": "chips",
            "# Enabled Threads Per Core": "threadsPerCore",
            "Processor": "processor",
            "Processor MHz": "processorMhz",
            "Memory": "memory",
            "Operating System": "os",
            "HW Avail": "hwAvail",
            "Test Date": "testDate",
            "Published": "published",
        },
        "url_column": "Disclosures",
        "url_pattern": CPU2017_URL_PATTERN,
        "numeric_cols": ["peakResult", "baseResult", "cores", "chips", "threadsPerCore", "processorMhz"],
        "extra_cols": [],
    },
    "jbb2015": {
        "csv_filename": "jbb2015-results.csv",
        "rename_map": {
            "Benchmark": "benchmark",
            "Company": "vendor",
            "System": "system",
            "Max-jOPS": "peakResult",
            "Critical-jOPS": "baseResult",
            "# cores": "cores",
            "# chips": "chips",
            "# of threads per core": "threadsPerCore",
            "Processor": "processor",
            "CPU Speed": "processorMhz",
            "Memory (GB)": "memory",
            "Operating System": "os",
            "Hardware Availability": "hwAvail",
            "Test Date": "testDate",
            "Published": "published",
            "JVM": "jvm",
            "JVM Vendor": "jvmVendor",
            "# of nodes": "nodes",
        },
        "url_column": "Disclosure",
        "url_pattern": JBB2015_URL_PATTERN,
        "numeric_cols": ["peakResult", "baseResult", "cores", "chips", "threadsPerCore", "processorMhz", "nodes"],
        "extra_cols": ["jvm", "jvmVendor", "nodes"],
    },
}


def _load_csv_dataframe(suite: str) -> pd.DataFrame:
    """Locate and load the CSV: env var > bundled gzip > dev path."""
    config = SUITE_CONFIGS[suite]
    csv_filename = config["csv_filename"]
    gz_filename = f"{csv_filename}.gz" if not csv_filename.endswith(".gz") else csv_filename

    if _CSV_OVERRIDE and suite == "cpu2017":
        return pd.read_csv(_CSV_OVERRIDE, encoding="utf-8-sig")

    # Bundled gzip in package (pip install / uvx)
    try:
        ref = importlib.resources.files("spec_search_mcp") / "data" / gz_filename
        with importlib.resources.as_file(ref) as gz_path:
            if gz_path.exists():
                with gzip.open(gz_path, "rt", encoding="utf-8-sig") as f:
                    return pd.read_csv(io.StringIO(f.read()))
    except (TypeError, FileNotFoundError):
        pass

    # Dev mode: uncompressed CSV relative to repo root
    for candidate in [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "datas", csv_filename),
        os.path.join(os.path.dirname(__file__), "..", "..", "datas", csv_filename),
    ]:
        if os.path.exists(candidate):
            return pd.read_csv(candidate, encoding="utf-8-sig")

    msg = f"CSV data for {suite} not found. Set SPEC_SEARCH_CSV_PATH env var or install the package with bundled data."
    raise FileNotFoundError(msg)


def _extract_url(html: str, pattern: re.Pattern) -> str | None:
    if pd.isna(html):
        return None
    match = pattern.search(str(html))
    return match.group(1) if match else None


def load_data(suite: str = "cpu2017") -> pd.DataFrame:
    """Load CSV, clean columns, cache as singleton per suite."""
    if suite not in VALID_SUITES:
        msg = f"Invalid suite: {suite}. Valid suites: {VALID_SUITES}"
        raise ValueError(msg)

    if suite in _dfs:
        return _dfs[suite]

    config = SUITE_CONFIGS[suite]
    df = _load_csv_dataframe(suite)

    # Strip whitespace/tabs from column names
    df.columns = df.columns.str.strip()

    # Extract result URL
    url_col = config["url_column"]
    url_pattern = config["url_pattern"]
    if url_col in df.columns:
        df["resultUrl"] = df[url_col].apply(lambda x: _extract_url(x, url_pattern))

    # Rename columns to camelCase
    rename_map = config["rename_map"]
    df = df.rename(columns=rename_map)

    # Keep only needed columns
    keep = list(rename_map.values()) + ["resultUrl"]
    df = df[[c for c in keep if c in df.columns]]

    # Cast numeric columns
    for col in config["numeric_cols"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Strip string columns
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()

    _dfs[suite] = df
    return _dfs[suite]
