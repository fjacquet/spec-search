#!/usr/bin/env python3
"""Convert SPEC benchmark CSVs to optimized JSON for web app and per-processor index.

Supports multiple benchmark suites (CPU2017, JBB2015). Each suite produces its own
output directory under web/public/data/{suite_id}/.
"""

import csv
import json
import os
import re
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATAS_DIR = os.path.join(PROJECT_ROOT, "datas")
BASE_OUTPUT_DIR = os.path.join(PROJECT_ROOT, "web", "public", "data")

# --- Suite configurations ---

SUITES = {
    "cpu2017": {
        "csv_filename": "cpu2017-results.csv",
        "column_map": {
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
        },
        "url_pattern": re.compile(r'HREF="(/cpu2017/results/[^"]+\.html)"'),
        "url_source_column": "Disclosures",
        "numeric_fields": {"peakResult", "baseResult", "cores", "chips", "threadsPerCore", "processorMhz"},
        "extra_facet_fields": {},
    },
    "jbb2015": {
        "csv_filename": "jbb2015-results.csv",
        "column_map": {
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
            "Disclosure": "_disclosures",
            "JVM": "jvm",
            "JVM Vendor": "jvmVendor",
            "# of nodes": "nodes",
        },
        "url_pattern": re.compile(r'(/jbb2015/results/[^"]+\.html)'),
        "url_source_column": "Disclosure",
        "numeric_fields": {"peakResult", "baseResult", "cores", "chips", "threadsPerCore", "processorMhz", "nodes"},
        "extra_facet_fields": {"jvmVendors": "jvmVendor"},
    },
}


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


def extract_result_url(disclosures_html: str, url_pattern: re.Pattern) -> str | None:
    """Extract the first result URL from a disclosures/disclosure column."""
    match = url_pattern.search(disclosures_html)
    if match:
        return match.group(1)
    return None


def process_row(raw_row: dict, suite_config: dict) -> dict | None:
    """Transform a raw CSV row into a cleaned JSON record."""
    column_map = suite_config["column_map"]
    numeric_fields = suite_config["numeric_fields"]
    url_pattern = suite_config["url_pattern"]
    url_source = suite_config["url_source_column"]

    # Strip whitespace/tabs from keys
    row = {k.strip(): v for k, v in raw_row.items()}

    record = {}
    for csv_col, json_key in column_map.items():
        value = (row.get(csv_col) or "").strip()

        if json_key == "_disclosures":
            # Try the configured source column first, then fall back to raw value
            disc_value = (row.get(url_source) or "").strip()
            if not disc_value:
                disc_value = value
            record["resultUrl"] = extract_result_url(disc_value, url_pattern)
            continue

        if json_key in numeric_fields:
            record[json_key] = parse_numeric(value)
        else:
            record[json_key] = value if value else None

    # Skip rows with no benchmark or processor
    if not record.get("benchmark") or not record.get("processor"):
        return None

    return record


def process_suite(suite_id: str, suite_config: dict) -> None:
    """Process a single suite: read CSV, write JSON outputs."""
    csv_path = os.path.join(DATAS_DIR, suite_config["csv_filename"])
    if not os.path.exists(csv_path):
        print(f"Skipping {suite_id}: CSV not found at {csv_path}")
        return

    output_dir = os.path.join(BASE_OUTPUT_DIR, suite_id)
    processors_dir = os.path.join(output_dir, "processors")
    os.makedirs(processors_dir, exist_ok=True)

    # Parse CSV
    results = []
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, raw_row in enumerate(reader):
            record = process_row(raw_row, suite_config)
            if record:
                record["id"] = idx
                results.append(record)

    print(f"[{suite_id}] Parsed {len(results)} records from CSV")

    # Write results.json
    results_path = os.path.join(output_dir, "results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, separators=(",", ":"), ensure_ascii=False)
    size_mb = os.path.getsize(results_path) / (1024 * 1024)
    print(f"[{suite_id}] Wrote {results_path} ({size_mb:.1f} MB)")

    # Build facets
    benchmarks = sorted(set(r["benchmark"] for r in results if r["benchmark"]))
    vendors = sorted(set(r["vendor"] for r in results if r["vendor"]))
    processors = sorted(set(r["processor"] for r in results if r["processor"]))

    facets = {
        "benchmarks": benchmarks,
        "vendors": vendors,
        "processors": processors,
    }

    # Add suite-specific extra facets
    for facet_key, field_name in suite_config.get("extra_facet_fields", {}).items():
        facets[facet_key] = sorted(set(r[field_name] for r in results if r.get(field_name)))

    facets_path = os.path.join(output_dir, "facets.json")
    with open(facets_path, "w", encoding="utf-8") as f:
        json.dump(facets, f, separators=(",", ":"), ensure_ascii=False)
    print(
        f"[{suite_id}] Wrote {facets_path} "
        f"({len(benchmarks)} benchmarks, {len(vendors)} vendors, {len(processors)} processors)"
    )

    # Build per-processor index
    processor_groups = defaultdict(list)
    for r in results:
        if r["processor"]:
            processor_groups[r["processor"]].append(r)

    index = {}
    for proc_name, proc_results in processor_groups.items():
        slug = slugify(proc_name)
        index[proc_name] = slug

        proc_file = os.path.join(processors_dir, f"{slug}.json")
        proc_data = {
            "processor": proc_name,
            "results": proc_results,
        }
        with open(proc_file, "w", encoding="utf-8") as f:
            json.dump(proc_data, f, separators=(",", ":"), ensure_ascii=False)

    index_path = os.path.join(processors_dir, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False, sort_keys=True)
    print(f"[{suite_id}] Wrote {len(index)} processor files to {processors_dir}")


def main():
    for suite_id, suite_config in SUITES.items():
        process_suite(suite_id, suite_config)
    print("Done!")


if __name__ == "__main__":
    main()
