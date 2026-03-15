# ADR-001: Monorepo with Separate Python Environments

**Status**: Accepted
**Date**: 2026-03-15

## Context

The project has three components: a Python data pipeline (`scripts/`), a Python MCP server (`mcp_server/`), and a JavaScript web app (`web/`). The MCP server has heavy dependencies (FastMCP, Pandas) that the pipeline does not need.

## Decision

Use a monorepo with two separate Python environments (root for pipeline, `mcp_server/` for server) and a Node.js project in `web/`. Each has its own dependency management (`pyproject.toml` + `uv.lock` or `package.json` + `package-lock.json`).

## Rationale

- Keeps pipeline lightweight (stdlib only) — no need to install Pandas just to convert CSV
- Each component can be tested and deployed independently
- Single repo simplifies CI and cross-component changes
- Makefile provides a unified entry point

## Consequences

- Two `uv sync` commands needed in CI (root and `mcp_server/`)
- Ruff config duplicated via `extend` in `mcp_server/pyproject.toml`
- Developers must remember which directory to run commands in
