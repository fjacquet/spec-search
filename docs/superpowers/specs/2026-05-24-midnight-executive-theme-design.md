# Design: Adopt vatlas "Midnight Executive" theme across spec-search (web + pptx)

**Date:** 2026-05-24
**Status:** Approved (pending spec review)
**Goal:** Visual + structural consistency between spec-search and the vatlas project, for both the web app and the PowerPoint export.

## Problem

spec-search currently uses an ad-hoc Bootstrap-ish palette (`#0d6efd` blue, `#dc3545` red, `#198754` green, `#6c757d` gray) hardcoded independently in four places:

- `web/src/index.css` — `:root` CSS variables + inline hex in chart/comparison rules
- `web/src/components/BarChart.jsx` — inline hex in an embedded SVG `<style>` string
- `web/src/components/RadarChart.jsx` — same
- `web/src/components/exportPptx.js` — `COLOR_BLUE/RED/GREEN/GRAY` constants

There is no shared source of truth, no dark mode, no monospace treatment for the many numeric values, and a latent bug: `.suite-btn` references `var(--primary)`, which is never defined (only `--accent` exists), so the suite-button hover/active color is dead.

The sibling project **vatlas** already ships a deliberate, shared "Midnight Executive" theme spanning web + charts + pptx. We adopt it verbatim for full visual and architectural parity.

## Decisions (locked)

1. **Full architecture parity** with vatlas: one source of truth feeding web, charts, and pptx; dark mode included.
2. **Migrate spec-search web to Tailwind v4** and rewrite components to idiomatic utility-first Tailwind (the high-churn path, accepted). Tailwind must be used *fully* — `@theme` tokens, `dark:` variants, responsive variants — not hand-written CSS hidden behind `var()`.
3. **Semantic color mapping:** As-Is = navy `#3245b7`, To-Be = gold `#F9B935`; the Change/delta column uses util-low green ↑ / util-high red ↓ as factual status (the only verdict-adjacent colors, confined to the delta).
4. **3-state dark mode** (`auto` / `light` / `dark`), faithful to vatlas's `useTheme`.
5. **Fonts:** add a `--font-mono` stack ("JetBrains Mono", "Fira Code", ui-monospace) for numeric values on web; use Consolas for metric cells in pptx. Body stays system-ui (web) / Arial (pptx). No font bundling (mirrors vatlas).

## Architecture: single source of truth

```
web/src/index.css  @theme { …oklch tokens… }      ← SOURCE OF TRUTH (Tailwind v4)
        │
        ├─ Tailwind utilities → all web components (bg-primary-500, text-slate-700, dark:*, sm:*)
        │
        └─ web/src/theme/tokens.js   ← hand-synced sRGB-hex mirror (oklch kept in comments)
                ├─ chartColors  → BarChart.jsx / RadarChart.jsx  (embedded SVG <style>)
                └─ pptxColors   → exportPptx.js                  (hex WITHOUT leading #)
```

**Why charts/pptx consume a JS hex mirror instead of `var(--token)`:** both the SVG charts and the pptx tables are serialized to standalone artifacts (a detached SVG blob rasterized to PNG; a `.pptx` file). In those contexts there is no document/Tailwind runtime, so `var(--token)` and oklch do not resolve. `tokens.js` therefore exports concrete sRGB hex. This is the exact rationale vatlas uses for `echartsTheme.ts` (zrender cannot parse oklch) and `pptx/primitives/colors.ts`.

The `@theme` block in `index.css` remains the authoritative source; `tokens.js` is a hand-synced mirror with the oklch source value in a trailing comment per token, identical to vatlas's convention.

## Palette (ported verbatim from vatlas)

| Token | oklch (source of truth) | sRGB hex (mirror) |
|---|---|---|
| `primary-200` | `oklch(82% .08 270)` | `#b0c2f9` |
| `primary-300` | `oklch(70% .12 270)` | `#819ae9` |
| `primary-500` (navy, brand) | `oklch(45% .18 270)` | `#3245b7` |
| `primary-900` | `oklch(18% .08 270)` | ≈`#1e2761` |
| `accent-500` (gold, factual marker) | `oklch(78% .16 75)` | `#f9b935` |
| `ice` | `oklch(88% .04 240)` | ≈`#cadcfc` |
| `util-low` (green) | `oklch(64% .16 142)` | `#4aa342` |
| `util-mid` (orange) | `oklch(72% .18 65)` | `#ef8700` |
| `util-high` (red) | `oklch(58% .22 25)` | `#df202e` |
| `surface-50…900` | per vatlas | per vatlas |
| ink / inkMuted / paper | `#0f172a` / `#475569` / `#ffffff` | (pptx neutrals) |
| slate-200/400/500 | Tailwind defaults | `#e2e8f0` / `#94a3b8` / `#64748b` |

The full `@theme` token set (primary 50–950, ice, accent, util, surface 50–900, `--font-mono`) is copied 1:1 from `vatlas/src/index.css`.

## Semantic mapping

| Meaning | Light (screen + ALL exports) | Dark (screen only) |
|---|---|---|
| As-Is system | navy `primary-500` `#3245b7` | navy `primary-300` `#819ae9` |
| To-Be system | gold `accent-500` `#f9b935` | gold `accent-500` `#f9b935` |
| Delta ↑ improvement | `util-low` `#4aa342` | `util-low` `#4aa342` |
| Delta ↓ regression | `util-high` `#df202e` | `util-high` `#df202e` |
| Chart grid / axis / labels | slate-500 / slate-200 | slate-400 / surface-700 |

Status colors (green/red) appear **only** in the delta column — never as a verdict on a system, matching Midnight Executive's rule. Gold marks the To-Be series identity (a factual marker, not an editorial verdict).

**PPTX header contrast accommodation:** the To-Be column header label stays **ink** text (gold-on-light-header fails WCAG contrast). System identity in the deck is carried by the navy/gold `■` legend markers and (optionally) a thin colored top-rule per column — not by header text color. The As-Is header label likewise uses ink (or navy, which passes on the light header) rather than relying on color alone.

## Fonts

| Surface | Body | Numbers / metrics |
|---|---|---|
| Web | system-ui stack (unchanged — already matches vatlas) | `--font-mono`: "JetBrains Mono", "Fira Code", ui-monospace, monospace → applied via `font-mono` utility to benchmark scores, MHz, cores, threads, and the delta column |
| PPTX | Arial (unchanged) | Consolas for metric/numeric table cells (mirrors vatlas pptx `metric`) |

No `@font-face` bundling: the stacks declare web-safe/common fonts with `ui-monospace`/`monospace` fallbacks, identical to vatlas.

## Dark mode (ported from vatlas)

- **`web/src/hooks/useTheme.js`** — port of vatlas's `useTheme.ts` to plain JS (spec-search web is JSX/JS, not TS). 3-state `auto`/`light`/`dark`; persisted under `localStorage['spec-search-theme']`; `auto` follows `prefers-color-scheme` reactively; toggles `class="dark"` on `<html>`. Safari private-mode `localStorage` access is wrapped in try/catch (silent fallthrough), as in vatlas.
- **`web/src/components/ThemeToggle.jsx`** — port of vatlas's `ThemeToggle.tsx`, placed in the app header.
- **`web/public/theme-init.js`** — FOUC-prevention script that sets `class="dark"` before paint from `localStorage['spec-search-theme']` + `prefers-color-scheme`. Referenced via `<script src="/theme-init.js">` in `index.html` (account for the `base: "/spec-search/"` path).
- **`index.css`** — `@custom-variant dark (&:where(.dark, .dark *));` plus `html { color-scheme }` base rules, copied from vatlas.
- **Charts:** on-screen series swap to dark shades (As-Is navy-300, To-Be gold; grid slate-400/surface-700) via a resolved-theme prop. **Exported chart PNGs and the entire pptx deck always render the LIGHT palette on white** — the deck is Midnight Executive light regardless of screen theme, identical to vatlas.

## Idiomatic Tailwind rewrite

The current `index.css` is ~1,014 lines / ~165 BEM-style selectors with two `@media (max-width…)` blocks (767px, 479px). The rewrite:

- Converts BEM classes on `App.jsx` + all 9 components to utility classes on the JSX.
- Replaces `.dark .x { … }` override rules with `dark:` variants inline.
- Refactors the two desktop-first `@media (max-width)` blocks into **mobile-first** `sm:` / `md:` responsive variants.
- Keeps a thin `@layer components` for genuinely repeated multi-utility idioms only (e.g. `.panel`, `.label`, `.btn`, util-bar), mirroring vatlas's component layer — not a wholesale re-creation of the old stylesheet behind `var()`.
- The `--primary` bug disappears: `.suite-btn` becomes utilities referencing `primary-500`.

**Charts exception:** `BAR_CSS` / `RADAR_CSS` are embedded `<style>` strings serialized into standalone SVG for export, where Tailwind utilities do not apply. These stay as CSS strings but source every color/font from `tokens.js` (`chartColors`, `--font-mono` literal). The chart *container, legend, and surrounding JSX* are converted to Tailwind utilities like everything else.

## Tailwind v4 wiring

- `web/package.json` — add `tailwindcss@^4` and `@tailwindcss/vite@^4` (dev deps).
- `web/vite.config.js` — add `tailwindcss()` to `plugins` (keep existing `react()` and `base: "/spec-search/"`).
- `web/src/index.css` — prepend `@import "tailwindcss";`, add `@custom-variant dark`, `@theme { … }`, base layer, and the thin `@layer components`.

## Brand-asset recolor

Recolor spec-search's own product identity from Bootstrap blue to navy (spec-search keeps its logo — vatlas's "brand-free" rule concerns not embedding *client* logos in exports, which does not apply to spec-search's own product mark):

- `web/public/favicon.svg` — `#0d6efd`→`#3245b7`, `#0b5ed7`→ a darker navy (`primary-700`).
- `web/public/logo.svg` — same.
- `web/public/manifest.json` — `theme_color` `#0d6efd`→`#3245b7`.
- `web/index.html` — `<meta name="theme-color" content="#0d6efd">`→`#3245b7`.

## Components / files affected

**New:**
- `web/src/theme/tokens.js`
- `web/src/hooks/useTheme.js`
- `web/src/components/ThemeToggle.jsx`
- `web/public/theme-init.js`

**Tailwind wiring:** `web/package.json`, `web/vite.config.js`, `web/src/index.css`

**Rewritten to utilities:** `web/src/App.jsx` and all components in `web/src/components/` (FilterBar, ResultsTable, ResultsList, ResultCard, Pagination, ComparisonTray, ComparisonView, BarChart, RadarChart)

**Recolored (token-sourced):** `web/src/components/BarChart.jsx`, `RadarChart.jsx`, `exportPptx.js`

**Rebranded assets:** `web/public/favicon.svg`, `logo.svg`, `manifest.json`, `web/index.html`

## Testing

- `web/src/__tests__/exportPptx.test.js` asserts only text content (titles, labels, deltas) — **no color assertions** — so the palette swap does not break it. Verify it still passes after the Consolas/font and table-structure edits.
- `benchmarks.test.js` and `useSearch.test.js` are data/logic tests — unaffected by theming.
- No chart-rendering color tests exist today.
- `make ci` (lint + test + build) must pass. Biome formats the new utility-heavy JSX; verify Biome is content with long `className` strings (no rule changes expected).
- Manual visual check in both light and dark; confirm exported pptx + chart PNGs render the light palette on white.

## Out of scope

- No Content-Security-Policy meta tag (vatlas has one; that is a security concern, not theming).
- No PWA/service-worker changes beyond the `theme_color`/manifest recolor.
- No changes to the MCP server or the Python pipeline (theming is web + pptx only).
- No new palette tokens beyond what vatlas ships — we mirror, we do not extend.

## Success criteria

- spec-search web and pptx render the Midnight Executive palette identically to vatlas.
- A single source of truth (`@theme` → `tokens.js`) drives web, charts, and pptx; no orphan hex literals remain in components.
- Dark mode works (3-state, persisted, no FOUC); pptx/exports stay light.
- Numeric values use the mono font on web and Consolas in pptx.
- `make ci` passes; the dead `--primary` reference is gone.
