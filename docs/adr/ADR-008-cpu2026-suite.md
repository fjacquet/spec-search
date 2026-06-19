# ADR-008: Add SPEC CPU2026 suite

**Status**: Accepted
**Date**: 2026-06-19

## Context

SPEC published CPU2026 results as a CSV dump. CPU2026's columns are a superset
of CPU2017's, and the app already supports multiple suites via a registry
pattern (see ADR-003). CPU2026 introduces energy-efficiency metrics and richer
hardware/toolchain detail (cache levels, compiler, storage).

## Decision

Add `cpu2026` as a registry entry in each layer (pipeline `SUITES`, MCP
`SUITE_CONFIGS`/`VALID_SUITES`, web `SUITES`) — no new abstractions. Surface
the full enrichment set in the data and the comparison view; show a curated
four extra columns in the main results table to keep it readable. Treat the
energy `0` sentinel ("not measured") as `null` in the data layer so it renders
as "—" and sorts last. Keep `cpu2017` as the default suite because CPU2026 is
still sparse (~279 rows).

## Rationale

- **Registry-only change** — no new abstractions; the same `extra_cols` /
  `extraColumns` / `extra_facet_fields` machinery introduced for `jbb2015`
  handles cpu2026 enrichment without modification.
- **Energy as display-only metric** — energy is sortable but not a first-class
  filter while most results report `0`; normalizing `0` → `null` keeps the UI
  clean via the existing `?? "—"` idiom.
- **Default unchanged** — CPU2017 (~46K rows) remains the default; CPU2026 is
  accessible via the suite selector.

## Consequences

- Adding future suites remains a config-only change.
- Energy is displayed and sortable but not yet a first-class filter (deferred
  while most results report `0`).
- The omitted detail columns (pointer size, provenance, etc.) can be surfaced
  later with one-line config additions.
