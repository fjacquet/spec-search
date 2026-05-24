# ADR-006: Adopt vatlas "Midnight Executive" theme (web + PPTX)

**Status**: Accepted
**Date**: 2026-05-24

## Context

spec-search used an ad-hoc Bootstrap-ish palette hardcoded in four places
(index.css, BarChart, RadarChart, exportPptx), with no shared source of
truth, no dark mode, and a dead `var(--primary)` reference. The sibling
project vatlas ships a deliberate "Midnight Executive" palette shared across
web, charts, and PPTX. We want visual + structural consistency between the
two products.

## Decision

Adopt Midnight Executive verbatim. Single source of truth = Tailwind v4
`@theme` oklch tokens in `web/src/index.css`, mirrored as concrete sRGB hex
in `web/src/theme/tokens.js` for the SVG charts and PPTX export (which
serialize to standalone artifacts where var()/oklch cannot resolve — the
same rationale vatlas uses for its echarts/pptx color modules). The gold
accent is pinned to the exact hex `#f9b935` in `@theme` so on-screen, chart,
and PPTX gold render identically.

Semantics: As-Is = navy `#3245b7`, To-Be = gold `#f9b935`; green/red confined
to the delta column (factual status, never a verdict). PPTX headers use ink
text (gold-on-light fails contrast); system identity via legend markers.
3-state dark mode (auto/light/dark) on screen; PPTX and chart exports stay
light on white.

## Consequences

- Web migrates to Tailwind v4 (component utility rewrite tracked in a follow-up plan).
- Numeric values use a mono font (JetBrains Mono web / Consolas PPTX).
- Charts/pptx must consume `tokens.js`, never raw hex literals.
- Completed: the full web UI (App + 9 components) is now idiomatic utility-first
  Tailwind. `index.css` retains only `@theme`, `@layer base/components`, the CSS
  reset, and a small chart-SVG-internal block — the live `<svg>` needs real CSS
  (the export path injects `barCss()`/`radarCss()` from `tokens.js` into a
  standalone clone). That block uses concrete hex kept in sync with `tokens.js`
  plus `.dark` variants. The legacy `:root`/`.dark` CSS-variable bridge is gone.

## Alternatives Considered

- **Keep Bootstrap ad-hoc palette**: Rejected because it had no dark mode, no
  shared tokens, and a broken `var(--primary)` reference. Inconsistent with vatlas.
- **Custom palette (not vatlas-derived)**: Rejected because visual consistency
  between spec-search and vatlas is a product requirement.
- **CSS custom properties everywhere (no tokens.js mirror)**: Rejected because
  SVG chart components and PPTX export serialize to standalone artifacts where
  `var()` and oklch cannot resolve at runtime.
