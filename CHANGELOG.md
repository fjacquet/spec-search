# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
