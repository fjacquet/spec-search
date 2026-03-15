# spec-search-mcp

MCP server for searching SPEC CPU2017 benchmark results. Provides 4 tools for AI assistants to query 46,000+ benchmark entries.

## Installation

```bash
pip install spec-search-mcp
# or
uvx spec-search-mcp
```

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spec-search": {
      "command": "spec-search-mcp"
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
      "args": ["spec-search-mcp"]
    }
  }
}
```

## Tools

- **`search_benchmarks`** — Filter by benchmark type, vendor, processor, core count, score ranges. Sort and paginate results.
- **`get_top_results`** — Top N results by peak or base score for a given benchmark.
- **`compare_processors`** — Side-by-side comparison of two processors across benchmarks.
- **`get_statistics`** — Summary stats (count, mean, median, max) grouped by vendor, processor, or benchmark.

## Data Source

Benchmark data sourced from [SPEC CPU2017 Published Results](https://www.spec.org/cpu2017/results/).
SPEC and CPU2017 are trademarks of the Standard Performance Evaluation Corporation.

## License

MIT
