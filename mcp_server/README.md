# spec-search-mcp

MCP server for searching SPEC benchmark results across four suites — CPU2017, CPU2026, CPU2006 (retired), and JBB2015. Provides 4 tools for AI assistants to query 97,000+ benchmark entries.

Every tool takes a `suite` parameter: `cpu2017` (default), `cpu2026`, `cpu2006`, or `jbb2015`.

## Installation

```bash
pip install "spec-search-mcp @ git+https://github.com/fjacquet/spec-search.git#subdirectory=mcp_server"
```

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spec-search": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/fjacquet/spec-search.git#subdirectory=mcp_server", "spec-search-mcp"]
    }
  }
}
```

### With Claude Code

Add to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "spec-search": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/fjacquet/spec-search.git#subdirectory=mcp_server", "spec-search-mcp"]
    }
  }
}
```

### Environment Variable

Override the default bundled data with a custom CSV path:

```bash
export SPEC_SEARCH_CSV_PATH=/path/to/custom/cpu2017-results.csv
spec-search-mcp
```

## Tools

### `search_benchmarks`

Filter and sort SPEC benchmark results.

Parameters:
- `suite` — cpu2017 (default), cpu2026, cpu2006, or jbb2015
- `benchmark` — suite-specific code, e.g. CINT2017, CFP2017rate, CINT2006rate, or JBB2015MULTI
- `vendor` — Hardware vendor (exact match, case-insensitive)
- `processor` — Processor name (substring match, case-insensitive)
- `min_cores` / `max_cores` — Core count range
- `min_peak_result` / `min_base_result` — Minimum score thresholds
- `os_filter` — Operating system (substring match)
- `sort_by` — peak_result, base_result, cores, or processor_mhz
- `sort_order` — asc or desc
- `limit` — Max results (1-100, default 20)

### `get_top_results`

Top N benchmark results by score.

Parameters:
- `benchmark` (required) — Benchmark type
- `metric` — peak or base (default: peak)
- `limit` — Number of results (1-50, default 10)

### `compare_processors`

Side-by-side comparison of two processors.

Parameters:
- `processor1` / `processor2` (required) — Processor names (substring match)
- `benchmark` — Optional benchmark type filter

### `get_statistics`

Aggregated statistics for benchmark results.

Parameters:
- `benchmark` — Filter by benchmark type
- `vendor` — Filter by vendor
- `group_by` — vendor, processor, or benchmark (default: vendor)

Returns count, mean, median, and max for both peak and base scores.

## Package Details

- **Size**: ~2.5MB wheel (CSV data bundled as gzip)
- **Runtime deps**: FastMCP 3.x, Pandas 2.x
- **Python**: 3.12+
- **Transport**: stdio (default FastMCP behavior)

## Data Source

Benchmark data sourced from SPEC's published results for CPU2017, CPU2026, CPU2006, and JBB2015.
SPEC, CPU2006, CPU2017, and CPU2026 are trademarks of the Standard Performance Evaluation Corporation.

## License

MIT
