# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.1] - 2026-04-17

### Security

- Upgraded dev dependencies to clear new pip-audit advisories blocking CI
  (pygments 2.19.2→2.20.0 / CVE-2026-4539, pytest 9.0.2→9.0.3 / CVE-2025-71176,
  requests 2.32.5→2.33.1 / CVE-2026-25645). No runtime impact on the MCP wheel.

## [1.7.0] - 2026-04-17

### Changed

- Refreshed CPU2017 dataset from spec.org (results through Oct-2025)
- Record count: 46,139 → 46,254 (+115 new results)
- Processor coverage: 623 → 625 (adds recent Intel/AMD/Arm server SKUs)
- Regenerated bundled `cpu2017-results.csv.gz` shipped in the MCP wheel

## [1.0.1] - 2026-03-15

### Fixed

- Table filtering broken due to 3,379 duplicate React keys causing stale DOM nodes
- Added unique `id` field to each record in the data pipeline

### Changed

- MCP server restructured as pip-installable package (`spec-search-mcp`)
- Install from GitHub: `pip install "spec-search-mcp @ git+https://github.com/fjacquet/spec-search.git#subdirectory=mcp_server"`
- Bundled CSV data as gzip (2.5MB wheel) for standalone installs
- Switched JS linting from ESLint to Biome (faster, simpler config)
- Updated all GitHub Actions to latest versions (checkout v6, setup-python v6, setup-node v6, setup-uv v7, upload-artifact v7)

## [1.0.0] - 2026-03-15

### Added

- Web application: filterable, sortable SPEC CPU2017 results browser (React 19 + Vite 6)
- Data pipeline: CSV-to-JSON converter with per-processor index generation (623 processors, 52 vendors)
- MCP server: FastMCP-based tool server with search, top results, compare, and statistics tools
- Static JSON API: per-processor files for lightweight lookups by external apps (cluster-sizer)
- CI/CD: GitHub Actions workflow with lint, test, build, security audit, SBOM, and GH Pages deploy
- Linting: Ruff for Python, Biome for JavaScript
- Security: pip-audit, npm audit, Dependabot for automated dependency updates
- SBOM: CycloneDX generation for both Python and JavaScript dependencies
- Documentation: README with badges, PRD, architecture, 4 ADRs, changelog
- 64 tests: 21 pipeline + 24 MCP server + 19 web app
