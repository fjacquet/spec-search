# ADR-003: Pre-generated JSON from CSV

**Status**: Accepted
**Date**: 2026-03-15

## Context

The source data is a 47MB CSV with 46,139 rows and 35 columns. The web app needs to search and filter this data in the browser. Shipping the raw CSV to clients would be slow and require client-side CSV parsing.

## Decision

Pre-convert CSV to optimized JSON at build time using `scripts/convert_csv.py`. Produce three outputs:
1. `results.json` — full dataset with 16 selected fields (~20MB, ~3MB gzipped)
2. `facets.json` — unique values for dropdown filters
3. `processors/*.json` — one file per processor for lightweight API lookups

## Rationale

- JSON is native to JavaScript — no parsing library needed in the browser
- Selecting 16 of 35 columns reduces payload by ~40%
- Per-processor index enables O(1) lookups for external consumers (cluster-sizer)
- Facets file eliminates the need to scan 46K rows to build filter dropdowns
- Build-time generation means zero runtime cost

## Consequences

- JSON files are gitignored and regenerated in CI from the source CSV
- Adding new fields requires updating both the pipeline and consumer code
- The 20MB `results.json` is large but compresses well with gzip (~3MB transfer)
