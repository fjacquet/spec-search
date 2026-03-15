# Product Requirements Document

## Problem

SPEC CPU2017 benchmark results are published on [spec.org](https://www.spec.org/cpu2017/results/) as large HTML tables. Searching, filtering, and comparing results across processors and vendors is cumbersome. Infrastructure engineers sizing servers need quick access to SPECrate scores to make informed hardware decisions.

## Users

- Infrastructure engineers comparing processor benchmarks for server sizing
- AI assistants (via MCP) helping users qualify server configurations
- External tools (e.g., cluster-sizer/Presizion) that need programmatic access to SPEC scores

## Solution

Three delivery channels for the same dataset (46,139 SPEC CPU2017 results):

### 1. Web Application

A client-side React app deployed on GitHub Pages that allows:
- Filtering by benchmark type (CINT2017, CFP2017, CINT2017rate, CFP2017rate)
- Filtering by vendor, processor (substring), core count range, and score range
- Sorting by any column (peak/base result, cores, MHz, etc.)
- Pagination (50 results per page)
- Direct links to spec.org result detail pages

### 2. MCP Server

A pip-installable FastMCP-based tool server (`spec-search-mcp`) exposing 4 tools:
- `search_benchmarks` — filtered search with sorting and pagination
- `get_top_results` — top N results by peak or base score
- `compare_processors` — side-by-side comparison of two processors
- `get_statistics` — aggregated stats grouped by vendor/processor/benchmark

Distributed as a Python package installable from the GitHub repo with bundled data (2.5MB gzip).

### 3. Static JSON API

Per-processor JSON files on GitHub Pages:
- `processors/index.json` — processor name to slug mapping
- `processors/<slug>.json` — all benchmark results for a given processor
- Consumed by cluster-sizer to auto-populate SPECint scores

## Non-Goals

- User accounts or authentication
- Data collection or write operations
- Hosting our own copy of benchmark data (we link to spec.org for details)
- Real-time data updates (CSV is refreshed manually)
