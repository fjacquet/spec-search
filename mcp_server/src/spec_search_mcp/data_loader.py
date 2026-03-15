"""Load and cache SPEC CPU2017 benchmark data from CSV."""

import gzip
import importlib.resources
import io
import os
import re

import pandas as pd

_CSV_OVERRIDE = os.environ.get("SPEC_SEARCH_CSV_PATH")

_df: pd.DataFrame | None = None

URL_PATTERN = re.compile(r'HREF="(/cpu2017/results/[^"]+\.html)"')


def _load_csv_dataframe() -> pd.DataFrame:
    """Locate and load the CSV: env var > bundled gzip > dev path."""
    if _CSV_OVERRIDE:
        return pd.read_csv(_CSV_OVERRIDE, encoding="utf-8-sig")

    # Bundled gzip in package (pip install / uvx)
    try:
        ref = importlib.resources.files("spec_search_mcp") / "data" / "cpu2017-results.csv.gz"
        with importlib.resources.as_file(ref) as gz_path:
            if gz_path.exists():
                with gzip.open(gz_path, "rt", encoding="utf-8-sig") as f:
                    return pd.read_csv(io.StringIO(f.read()))
    except (TypeError, FileNotFoundError):
        pass

    # Dev mode: uncompressed CSV relative to repo root
    for candidate in [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "datas", "cpu2017-results.csv"),
        os.path.join(os.path.dirname(__file__), "..", "..", "datas", "cpu2017-results.csv"),
    ]:
        if os.path.exists(candidate):
            return pd.read_csv(candidate, encoding="utf-8-sig")

    msg = "CSV data not found. Set SPEC_SEARCH_CSV_PATH env var or install the package with bundled data."
    raise FileNotFoundError(msg)


def _extract_url(html: str) -> str | None:
    if pd.isna(html):
        return None
    match = URL_PATTERN.search(str(html))
    return match.group(1) if match else None


def load_data() -> pd.DataFrame:
    """Load CSV, clean columns, cache as singleton."""
    global _df
    if _df is not None:
        return _df

    df = _load_csv_dataframe()

    # Strip whitespace/tabs from column names
    df.columns = df.columns.str.strip()

    # Extract result URL from Disclosures
    if "Disclosures" in df.columns:
        df["resultUrl"] = df["Disclosures"].apply(_extract_url)

    # Rename columns to camelCase
    rename_map = {
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
    }
    df = df.rename(columns=rename_map)

    # Keep only needed columns
    keep = list(rename_map.values()) + ["resultUrl"]
    df = df[[c for c in keep if c in df.columns]]

    # Cast numeric columns
    for col in ["peakResult", "baseResult", "cores", "chips", "threadsPerCore", "processorMhz"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Strip string columns
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].str.strip()

    _df = df
    return _df
