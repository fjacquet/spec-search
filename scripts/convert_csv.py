#!/usr/bin/env python3
"""Convert SPEC CPU2017 CSV to optimized JSON for web app and per-processor index."""

import csv
import json
import os
import re
import sys
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CSV_PATH = os.path.join(PROJECT_ROOT, "datas", "cpu2017-results.csv")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "web", "public", "data")
PROCESSORS_DIR = os.path.join(OUTPUT_DIR, "processors")

# Column mapping: CSV header (after stripping) → JSON key
COLUMN_MAP = {
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
    "Disclosures": "_disclosures",
}

NUMERIC_FIELDS = {"peakResult", "baseResult", "cores", "chips", "threadsPerCore", "processorMhz"}

URL_PATTERN = re.compile(r'HREF="(/cpu2017/results/[^"]+\.html)"')


def slugify(name: str) -> str:
    """Convert processor name to a filesystem-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def parse_numeric(value: str) -> float | int | None:
    """Parse a numeric string, returning int if whole, float otherwise, or None."""
    value = value.strip()
    if not value:
        return None
    try:
        f = float(value)
        if f == int(f):
            return int(f)
        return f
    except ValueError:
        return None


def extract_result_url(disclosures_html: str) -> str | None:
    """Extract the first HTML result URL from the Disclosures column."""
    match = URL_PATTERN.search(disclosures_html)
    if match:
        return match.group(1)
    return None


def process_row(raw_row: dict) -> dict | None:
    """Transform a raw CSV row into a cleaned JSON record."""
    # Strip whitespace/tabs from keys
    row = {k.strip(): v for k, v in raw_row.items()}

    record = {}
    for csv_col, json_key in COLUMN_MAP.items():
        value = (row.get(csv_col) or "").strip()

        if json_key == "_disclosures":
            record["resultUrl"] = extract_result_url(value)
            continue

        if json_key in NUMERIC_FIELDS:
            record[json_key] = parse_numeric(value)
        else:
            record[json_key] = value if value else None

    # Skip rows with no benchmark or processor
    if not record.get("benchmark") or not record.get("processor"):
        return None

    return record


def main():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV not found at {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(PROCESSORS_DIR, exist_ok=True)

    # Parse CSV
    results = []
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for raw_row in reader:
            record = process_row(raw_row)
            if record:
                results.append(record)

    print(f"Parsed {len(results)} records from CSV")

    # Write results.json
    results_path = os.path.join(OUTPUT_DIR, "results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, separators=(",", ":"), ensure_ascii=False)
    size_mb = os.path.getsize(results_path) / (1024 * 1024)
    print(f"Wrote {results_path} ({size_mb:.1f} MB)")

    # Build facets
    benchmarks = sorted(set(r["benchmark"] for r in results if r["benchmark"]))
    vendors = sorted(set(r["vendor"] for r in results if r["vendor"]))
    processors = sorted(set(r["processor"] for r in results if r["processor"]))

    facets = {
        "benchmarks": benchmarks,
        "vendors": vendors,
        "processors": processors,
    }
    facets_path = os.path.join(OUTPUT_DIR, "facets.json")
    with open(facets_path, "w", encoding="utf-8") as f:
        json.dump(facets, f, separators=(",", ":"), ensure_ascii=False)
    print(f"Wrote {facets_path} ({len(benchmarks)} benchmarks, {len(vendors)} vendors, {len(processors)} processors)")

    # Build per-processor index
    processor_groups = defaultdict(list)
    for r in results:
        if r["processor"]:
            processor_groups[r["processor"]].append(r)

    index = {}
    for proc_name, proc_results in processor_groups.items():
        slug = slugify(proc_name)
        index[proc_name] = slug

        proc_file = os.path.join(PROCESSORS_DIR, f"{slug}.json")
        proc_data = {
            "processor": proc_name,
            "results": proc_results,
        }
        with open(proc_file, "w", encoding="utf-8") as f:
            json.dump(proc_data, f, separators=(",", ":"), ensure_ascii=False)

    index_path = os.path.join(PROCESSORS_DIR, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False, sort_keys=True)
    print(f"Wrote {len(index)} processor files to {PROCESSORS_DIR}")

    print("Done!")


if __name__ == "__main__":
    main()
