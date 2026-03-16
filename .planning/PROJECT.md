# spec-search

## What This Is

SPEC CPU2017 benchmark explorer with three delivery channels: a React web UI for interactive exploration, an MCP server for AI assistants, and a static JSON API for programmatic integration (used by Presizion/cluster-sizer). Serves ~46K benchmark records.

## Core Value

Users can quickly find and compare SPEC CPU2017 benchmark results across processors, vendors, and systems.

## Current Milestone: v1.1 Mobile UX + System Comparison

**Goal:** Make the web app usable on mobile devices and add a system comparison feature.

**Target features:**
- Responsive CSS with mobile breakpoints
- Card-based layout for results on mobile
- Collapsible filter panel on mobile
- System comparison (select 2 results, same benchmark, side-by-side view)
- Shareable comparison URLs

## Requirements

### Validated

- v1.0 Search: filter by benchmark, vendor, processor, cores, scores
- v1.0 Sort: clickable column headers with asc/desc toggle
- v1.0 Pagination: 50 results per page
- v1.0 URL deep links: filters persisted in query params
- v1.0 Static JSON API: per-processor files for cluster-sizer
- v1.0 MCP server: 4 tools (search, top results, compare, statistics)

### Active

- [ ] Responsive layout for mobile devices
- [ ] Card-based results on mobile
- [ ] Collapsible filters on mobile
- [ ] System comparison (2 systems, same benchmark)
- [ ] Comparison view with delta highlighting
- [ ] Shareable comparison URLs

### Out of Scope

- MCP server changes — not needed for this milestone
- Pipeline changes — Presizion API must remain stable
- TypeScript migration — separate effort
- Dark mode — future milestone

## Context

- Web app is React 19 + Vite 6, plain CSS, no UI framework
- ~46K benchmark records loaded client-side as JSON
- External dependency: Presizion (cluster-sizer) consumes `processors/*.json`
- MCP server has `compare_processors` tool but web UI has no comparison feature

## Constraints

- **Backward compatibility**: `processors/*.json` API must not change
- **Lightweight**: No heavy UI framework additions (keep plain CSS)
- **Same benchmark**: Comparison only allowed between results with matching benchmark type

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Plain CSS (no Tailwind) | Keep lightweight, consistent with existing approach | -- Pending |
| Same-benchmark comparison only | Scores across benchmarks aren't comparable | -- Pending |
| Card layout on mobile | Table with 12 columns is unusable on small screens | -- Pending |

---
*Last updated: 2026-03-16 after milestone v1.1 initialization*
