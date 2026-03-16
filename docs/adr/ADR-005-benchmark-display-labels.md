# ADR-005: Customer-Outcome Display Labels for Benchmark Categories

**Status**: Accepted
**Date**: 2026-03-16

## Context

SPEC CPU2017 benchmark categories use technical codes (`CINT2017`, `CFP2017`, `CINT2017rate`, `CFP2017rate`) that are opaque to users unfamiliar with SPEC naming conventions. Users sizing servers need to quickly understand what each benchmark measures without consulting external documentation.

## Decision

Add a display-only label mapping that translates SPEC codes into customer-outcome-focused names, while keeping original codes visible as reference (tooltips in table/cards, parenthetical in dropdowns).

| Code | Display Label | What It Tells the Customer |
|------|--------------|---------------------------|
| `CINT2017` | Integer Per-Core | Single-thread integer performance |
| `CFP2017` | FP Per-Core | Single-thread floating-point performance |
| `CINT2017rate` | Integer Multi-Core | Multi-core integer throughput |
| `CFP2017rate` | FP Multi-Core | Multi-core floating-point throughput |

The mapping lives as a static constant in both the frontend (`web/src/constants/benchmarks.js`) and MCP server (`server.py`), not in the data pipeline. The data layer continues to store raw SPEC codes.

## Rationale

- **"Per-Core" / "Multi-Core"** communicates the sizing dimension customers care about, whereas SPEC's "Speed" / "Rate" terminology requires domain knowledge
- **Display-only mapping** avoids data migration, preserves URL query parameters (`?benchmark=CINT2017rate`), and keeps filtering logic unchanged
- **Dual JS + Python constants** (rather than pipeline-generated) keeps the mapping simple — it's 4 static entries that rarely change
- **Original codes as reference** ensures power users and SPEC-literate customers can still identify the exact benchmark suite

## Alternatives Considered

- **SPEC jargon labels** ("Integer Speed", "FP Rate"): Rejected because "Speed" and "Rate" are SPEC-internal terms that don't convey meaning to customers
- **Pipeline-generated labels in facets.json**: Rejected because the MCP server doesn't consume facets.json, creating two code paths for the same mapping
- **Replacing codes in data**: Rejected because it would break backward compatibility with URL params, MCP tool parameters, and external integrations
