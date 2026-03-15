"""Load and cache SPEC CPU2017 benchmark data from CSV."""

import os
import re

import pandas as pd

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "datas", "cpu2017-results.csv")

_df: pd.DataFrame | None = None

URL_PATTERN = re.compile(r'HREF="(/cpu2017/results/[^"]+\.html)"')


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

    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")

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
