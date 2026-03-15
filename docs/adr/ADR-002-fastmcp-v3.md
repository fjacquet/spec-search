# ADR-002: FastMCP v3 for MCP Server

**Status**: Accepted
**Date**: 2026-03-15

## Context

The MCP server needs to expose search tools for AI assistants. Options: raw MCP SDK, FastMCP v2, or FastMCP v3.

## Decision

Use FastMCP v3 with its `@mcp.tool` decorator API and Pandas for data queries.

## Rationale

- Declarative `@mcp.tool` decorator generates JSON schemas from Python type hints automatically
- Pandas makes complex filtering, sorting, and aggregation trivial
- FastMCP v3 handles transport (stdio), error handling, and schema validation
- Much less boilerplate than raw MCP SDK

## Consequences

- Dependency on FastMCP v3 API (breaking changes possible in future major versions)
- Pandas adds ~30MB to the virtual environment
- Server loads the full CSV into memory (~50MB DataFrame) — acceptable for local use
