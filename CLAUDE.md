# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`spec-search` is a **SPEC CPU benchmark explorer** (CPU2017, CPU2026, JBB2015). It has three
components in one repo:

- **Data pipeline** (root, Python/uv) — ingests and normalizes SPEC result data into `datas/`.
- **`mcp_server/`** (`spec-search-mcp`, Python/uv) — an MCP server exposing benchmark search tools.
- **`web/`** (Vite + Biome, no TypeScript) — the browser app, deployed to GitHub Pages.

## Commands

The root `Makefile` orchestrates all three components (CI runs these targets):

- `make ci` — full gate: `lint test build`.
- `make lint` — `lint-python` (ruff) + `lint-js` (biome, in `web/`).
- `make test` — `test-pipeline` + `test-mcp` + `test-web`.
- `make data` — build the normalized dataset; `make build` depends on it.
- `make serve` — serve the web app locally; `make mcp` — run the MCP server.
- `make sbom` — CycloneDX SBOM.

Web app (run inside `web/`): `npm run dev` (Vite), `npm run build`, `npm run test:run` (vitest),
`npm run lint` (biome). `typecheck` is a passthrough (no TypeScript).

Run a single test: pipeline/MCP `uv run pytest tests/<file>::<test>`; web `npx vitest run <file>`.

## CI/CD

Thin callers to `fjacquet/ci@v1`, scoped to the web app via `working-directory: web`:
- `ci.yml` → `web-ci.yml@v1` (`working-directory: web`)
- `security.yml` → `web-security.yml@v1` (`working-directory: web`)
- `release.yml` — builds both `mcp_server` and `web`.

Note: the Python data pipeline and `mcp_server/` do not yet have dedicated CI beyond the
Makefile targets; the `@v1` callers cover the `web/` app.

## Key paths

- `datas/` — normalized benchmark data; `scripts/` — pipeline helpers.
- `mcp_server/src/` — MCP server; `web/src/` — frontend; `tests/` — root pipeline tests.
