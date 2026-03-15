# ADR-004: MCP Server as pip-installable Package from GitHub

**Status**: Accepted
**Date**: 2026-03-15

## Context

The MCP server needs to be easy to install for end users who want to add SPEC benchmark search to their AI assistant. Options: publish to PyPI, publish to GitHub Packages, or install directly from the GitHub repo.

## Decision

Package the MCP server as a pip-installable package (`spec-search-mcp`) using hatchling, with the CSV data bundled as gzip (2.5MB). Distribute directly from the GitHub repo — no PyPI or GitHub Packages registry needed.

Install command:
```bash
pip install "spec-search-mcp @ git+https://github.com/fjacquet/spec-search.git#subdirectory=mcp_server"
```

## Rationale

- No PyPI account setup or trusted publisher configuration needed
- GitHub repo IS the single source of truth — no sync between repo and registry
- 2.5MB gzip wheel is well within git and pip limits
- Users get the latest version by reinstalling from `main`
- `uvx --from git+...` works for zero-install one-shot usage
- Can always publish to PyPI later if adoption warrants it

## Consequences

- Users must have git installed (required by pip for `git+` URLs)
- No semantic version resolution via pip — always installs from HEAD unless pinned to a tag
- The 2.5MB gzip data file is tracked in git (acceptable for this size)
- Package uses `src/` layout with `importlib.resources` to locate bundled data
