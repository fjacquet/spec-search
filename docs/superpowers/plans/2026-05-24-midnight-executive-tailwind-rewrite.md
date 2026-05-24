# Midnight Executive Theme — Idiomatic Tailwind Rewrite (Plan 2 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Prerequisite:** Plan 1 (theme foundation) must be merged first — Tailwind v4, `@theme` tokens, `tokens.js`, dark mode, recolored charts/pptx all already exist.

**Goal:** Convert `App.jsx` + all 9 web components from ~165 hand-written BEM selectors to idiomatic utility-first Tailwind with `dark:` and responsive variants, deleting the legacy CSS as each component migrates — so spec-search fully "uses Tailwind," matching vatlas's idiom.

**Architecture:** Per-component migration. Each component's `className` strings become Tailwind utilities; repeated multi-utility idioms collapse into a thin `@layer components` (`.panel`, `.btn`, `.btn-primary`, `.field`, `.num`) mirroring vatlas's component layer. The two desktop-first `@media (max-width)` blocks are refactored mobile-first (`md:` for the 768px breakpoint, `min-[480px]:` for the phone-only tweaks). As each component lands, its old rules are deleted from `index.css`; the final task removes the now-orphan `:root`/`.dark` CSS-variable block (Plan 1's bridge), leaving `index.css` = `@import` + `@custom-variant` + `@theme` + `@layer base` + `@layer components`.

**Tech Stack:** React 19, Tailwind CSS v4, Vite, Vitest, Biome. Verification per component = `npm run build` + `npm run lint` + visual (light & dark) — visual CSS changes aren't unit-testable; the existing data/logic tests (`useSearch`, `benchmarks`, `exportPptx`) must keep passing throughout.

> **Conversion recipe (applies to every component task):**
> 1. Read the component's current JSX and the matching CSS rules in `index.css`.
> 2. Replace each `className="bem-name"` with the utilities from the task's mapping table. Conditional BEM modifiers (`--active`, `--selected`) become conditional class expressions.
> 3. Add `dark:` variants where the mapping shows them (replacing what the Plan 1 `.dark` var-overrides did for this element).
> 4. Delete the now-dead CSS rules for those classes from `index.css` (including their entries inside the `@media` blocks).
> 5. `npm run build` + `npm run lint` (fix formatting), visual check light & dark, commit.

---

## Task 1: Add the `@layer base` + `@layer components` idioms

**Files:**
- Modify: `web/src/index.css` (append after the `@theme` block; do NOT delete legacy rules yet)

- [ ] **Step 1: Add base + component layers**

Append to `web/src/index.css` (after `@theme { … }`, before the legacy `:root`):
```css
@layer base {
  body {
    @apply bg-white text-slate-900 antialiased dark:bg-surface-900 dark:text-slate-100;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
  }
}

@layer components {
  .panel {
    @apply rounded-lg border border-slate-200 bg-white dark:border-surface-700 dark:bg-surface-800;
  }
  .btn {
    @apply cursor-pointer rounded border border-slate-200 bg-white px-3 py-2 text-sm
      hover:bg-slate-100 disabled:cursor-default disabled:opacity-40
      dark:border-surface-700 dark:bg-surface-800 dark:hover:bg-surface-700;
  }
  .btn-primary {
    @apply border-primary-500 bg-primary-500 text-white hover:bg-primary-700
      dark:border-primary-300 dark:bg-primary-300 dark:text-surface-900;
  }
  .field {
    @apply rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm
      dark:border-surface-700 dark:bg-surface-800;
  }
  .num {
    @apply text-right font-mono tabular-nums;
  }
}
```

- [ ] **Step 2: Verify**

Run: `cd web && rtk npm run build`
Expected: build succeeds; the legacy `body { … }` rule (in the Plan 1 `:root` block) is now harmlessly duplicated by the base layer — visual unchanged.

- [ ] **Step 3: Commit**

```bash
rtk git add web/src/index.css && rtk git commit -m "feat(web): add Tailwind base + component layers (panel/btn/field/num)"
```

---

## Task 2: `App.jsx` (header / shell / status bar)

**Files:**
- Modify: `web/src/App.jsx`
- Modify: `web/src/index.css` (delete the migrated rules)

- [ ] **Step 1: Convert classNames** using this mapping (sources: `index.css` lines for `.app`, `.app-header`, `.app-logo`, `.suite-*`, `.subtitle`, `.status-bar`, `.loading`, and their `@media` entries):

| BEM class | Tailwind utilities |
|---|---|
| `loading` | `flex h-[200px] items-center justify-center text-lg text-slate-500 dark:text-slate-400` |
| `app` | `mx-auto max-w-[1400px] p-2 md:p-4 min-[480px]:p-3` (base = phone 0.5rem, `min-[480px]` = 0.75rem, `md` = 1rem) |
| `app--with-tray` | `pb-20 md:pb-20` plus phone `pb-[140px]` → `pb-[140px] md:pb-20` |
| `app-header` | `mb-4 flex items-baseline gap-4 border-b-2 border-slate-200 pb-4 dark:border-surface-700 max-[479px]:flex-col max-[479px]:gap-1` |
| `app-logo` | `h-10 w-10 shrink-0 max-[479px]:h-8 max-[479px]:w-8` |
| header `h1` | `text-2xl font-bold max-[479px]:text-xl` |
| `subtitle` | `text-sm text-slate-500 dark:text-slate-400` |
| `suite-selector` | `ml-auto flex gap-1` |
| `suite-btn` | `cursor-pointer rounded border border-slate-200 bg-transparent px-3 py-1 text-xs text-slate-500 transition-colors hover:border-primary-500 hover:text-primary-500 dark:border-surface-700 dark:text-slate-400` |
| `suite-btn--active` | append when active: `border-primary-500 bg-primary-500 text-white dark:bg-primary-300 dark:text-surface-900` |
| `status-bar` | `mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 max-[479px]:flex-col max-[479px]:items-start max-[479px]:gap-1` |

For `suite-btn--active`, use a conditional: ``className={`suite-btn-base ${active ? "suite-btn-active-utils" : ""}`}`` — inline the utility strings above.

- [ ] **Step 2: Delete migrated CSS** — remove from `index.css`: `.app`, `.app-header`, `.app-logo`, `.app-header h1`, `.app-header .subtitle`, `.suite-selector`, `.suite-btn`, `.suite-btn:hover`, `.suite-btn--active`, `.status-bar`, `.loading`, `.app--with-tray`, and their entries in both `@media` blocks.

- [ ] **Step 3: Verify + commit**

Run: `cd web && rtk npm run build && rtk npm run lint`
Visual: header navy, suite buttons toggle, dark mode correct, phone layout stacks.
```bash
rtk git add web/src/App.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate App shell/header to Tailwind utilities"
```

---

## Task 3: `FilterBar.jsx`

**Files:** Modify `web/src/components/FilterBar.jsx`, `web/src/index.css`

- [ ] **Step 1: Convert classNames:**

| BEM class | Tailwind utilities |
|---|---|
| `filter-bar` | `mb-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-surface-700 dark:bg-surface-800 md:flex-row md:flex-wrap md:gap-3 md:p-4` |
| `filter-group` | `flex flex-col gap-1 max-[767px]:w-full` |
| `filter-group label` | `text-xs font-semibold uppercase text-slate-500 dark:text-slate-400` |
| `filter-group select/input` | `field max-[767px]:min-h-11 max-[767px]:w-full max-[767px]:text-base` (number → `w-[90px] max-[767px]:w-auto`; text → `w-[200px] max-[767px]:w-full`) |
| `filter-range` | `flex items-center gap-1 max-[767px]:gap-2` |
| `filter-actions` | `flex items-end max-[767px]:w-full` |
| `btn-clear` | `btn max-[767px]:min-h-11 max-[767px]:w-full max-[767px]:text-base` |
| `filter-toggle` | `hidden` (default) |
| `filter-bar--collapsible` wrapper | apply collapsible utilities conditionally; the toggle: `flex min-h-11 w-full cursor-pointer items-center justify-between border-none bg-transparent px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100` |
| `chevron` | `transition-transform` + collapsed: `-rotate-90` |
| `filter-content` | `flex flex-col gap-2 overflow-hidden opacity-100 transition-all` + collapsed: `max-h-0 opacity-0`; expanded: `max-h-[600px]` |
| `filter-badge` | `ml-2 rounded-[10px] bg-primary-500 px-1.5 py-0.5 text-[0.7rem] text-white dark:bg-primary-300 dark:text-surface-900` |

- [ ] **Step 2: Delete the migrated rules** (`.filter-bar`, `.filter-group*`, `.filter-range`, `.filter-actions`, `.btn-clear*`, `.filter-toggle`, `.filter-bar--collapsible*`, `.filter-bar--collapsed*`, `.chevron`, `.filter-content`, `.filter-badge`, and their `@media` entries).

- [ ] **Step 3: Verify + commit**

Run: `cd web && rtk npm run build && rtk npm run lint` — visual check (desktop row, mobile stacked, collapse animation).
```bash
rtk git add web/src/components/FilterBar.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate FilterBar to Tailwind utilities"
```

---

## Task 4: `ResultsTable.jsx`

**Files:** Modify `web/src/components/ResultsTable.jsx`, `web/src/index.css`

- [ ] **Step 1: Convert classNames:**

| BEM class | Tailwind utilities |
|---|---|
| `table-container` | `overflow-x-auto rounded-lg border border-slate-200 dark:border-surface-700` |
| `results-table` | `w-full border-collapse text-[0.85rem] max-[479px]:text-xs` |
| `results-table th` | `sticky top-0 cursor-pointer select-none whitespace-nowrap border-b-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold hover:text-primary-500 dark:border-surface-700 dark:bg-surface-800 max-[479px]:px-2 max-[479px]:py-1.5` |
| `sort-indicator` | `ml-1 text-[0.7rem]` |
| `results-table td` | `whitespace-nowrap border-b border-slate-200 px-3 py-2 dark:border-surface-700 max-[479px]:px-2 max-[479px]:py-1.5` |
| row hover | `hover:bg-primary-50 dark:hover:bg-surface-700` on `<tr>` |
| `num` | `num` (component class) |
| table `a` | `text-primary-500 no-underline hover:underline dark:text-primary-300` |
| `checkbox-cell` | `w-10 text-center` |
| checkbox input | `h-[18px] w-[18px] cursor-pointer accent-primary-500` |
| `row--selected` | `bg-primary-50 dark:bg-surface-700` |

- [ ] **Step 2: Delete** `.table-container`, `.results-table*` (th/td/hover/num/a/checkbox-cell/row--selected), `.sort-indicator`, and `@media` entries.

- [ ] **Step 3: Verify + commit**

```bash
rtk git add web/src/components/ResultsTable.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate ResultsTable to Tailwind utilities"
```

---

## Task 5: `ResultsList.jsx` + `ResultCard.jsx` (mobile list)

**Files:** Modify `web/src/components/ResultsList.jsx`, `web/src/components/ResultCard.jsx`, `web/src/index.css`

- [ ] **Step 1: ResultsList mapping:**

| BEM class | Tailwind utilities |
|---|---|
| `results-list` | `flex flex-col gap-2` |
| `sort-controls` | `mb-3 flex items-center gap-2` |
| `sort-controls label` | `text-xs font-semibold uppercase text-slate-500 dark:text-slate-400` |
| `sort-controls select` | `field min-h-11 flex-1` |
| `sort-direction-btn` | `btn min-h-11 min-w-11 hover:btn-primary` → use `btn` + active hover: `hover:border-primary-500 hover:bg-primary-500 hover:text-white` |

- [ ] **Step 2: ResultCard mapping:**

| BEM class | Tailwind utilities |
|---|---|
| `result-card` | `block w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-left text-inherit transition-[border-color,box-shadow] hover:border-primary-500 dark:border-surface-700 dark:bg-surface-800` |
| `result-card--selected` | `border-l-4 border-l-primary-500 bg-primary-50 dark:bg-surface-700` |
| `result-card--disabled` | `cursor-default opacity-50 hover:border-slate-200` |
| `result-card__processor` | `mb-0.5 text-[0.95rem] font-bold` |
| `result-card__system` | `mb-1.5 text-xs text-slate-500 dark:text-slate-400` |
| `result-card__scores` | `mb-1 flex gap-4 text-sm` |
| `result-card__scores strong` | `text-primary-500 dark:text-primary-300` |
| `result-card__details` | `mb-1 text-xs text-slate-500 dark:text-slate-400` |
| `result-card__meta` | `flex gap-3 text-xs text-slate-500 dark:text-slate-400` |
| `result-card__benchmark` | `font-semibold text-slate-900 dark:text-slate-100` |
| `result-card__meta a` | `text-primary-500 no-underline hover:underline dark:text-primary-300` |

- [ ] **Step 3: Delete** `.results-list`, `.sort-controls*`, `.sort-direction-btn*`, `.result-card*` rules.

- [ ] **Step 4: Verify + commit**

```bash
rtk git add web/src/components/ResultsList.jsx web/src/components/ResultCard.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate ResultsList + ResultCard to Tailwind utilities"
```

---

## Task 6: `Pagination.jsx`

**Files:** Modify `web/src/components/Pagination.jsx`, `web/src/index.css`

- [ ] **Step 1: Convert:**

| BEM class | Tailwind utilities |
|---|---|
| `pagination` | `mt-4 flex flex-wrap items-center justify-center gap-2 p-3 max-[767px]:gap-1` |
| `pagination button` | `btn hover:btn-primary max-[767px]:min-h-11 max-[767px]:min-w-11` → use `btn` + `enabled:hover:border-primary-500 enabled:hover:bg-primary-500 enabled:hover:text-white` |
| `page-info` | `text-sm text-slate-500 dark:text-slate-400 max-[767px]:order-first max-[767px]:mb-1 max-[767px]:w-full max-[767px]:text-center` |

- [ ] **Step 2: Delete** `.pagination*`, `.page-info` rules + `@media` entries.

- [ ] **Step 3: Verify + commit**

```bash
rtk git add web/src/components/Pagination.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate Pagination to Tailwind utilities"
```

---

## Task 7: `ComparisonTray.jsx`

**Files:** Modify `web/src/components/ComparisonTray.jsx`, `web/src/index.css`

- [ ] **Step 1: Convert:**

| BEM class | Tailwind utilities |
|---|---|
| `comparison-tray` | `fixed inset-x-0 bottom-0 z-[100] flex items-center gap-4 border-t-2 border-primary-500 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] dark:bg-surface-900 max-[767px]:flex-col max-[767px]:gap-2 max-[767px]:px-3 max-[767px]:py-2` |
| `comparison-tray__systems` | `flex flex-1 gap-2 overflow-hidden text-[0.85rem] max-[767px]:w-full max-[767px]:flex-col` |
| `comparison-tray__chip` | `max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-200 bg-slate-50 px-2 py-1 dark:border-surface-700 dark:bg-surface-800 max-[767px]:max-w-none` |
| `comparison-tray__actions` | `max-[767px]:flex max-[767px]:w-full max-[767px]:gap-2` |
| tray button (base) | `btn whitespace-nowrap px-4 py-2 max-[767px]:min-h-11 max-[767px]:flex-1` |
| `comparison-tray__compare` | `btn-primary` (override base) |
| `comparison-tray__clear` | base `btn` |

- [ ] **Step 2: Delete** `.comparison-tray*` rules + `@media` entries.

- [ ] **Step 3: Verify + commit**

```bash
rtk git add web/src/components/ComparisonTray.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate ComparisonTray to Tailwind utilities"
```

---

## Task 8: `ComparisonView.jsx` (grid + mobile cards + delta section)

**Files:** Modify `web/src/components/ComparisonView.jsx`, `web/src/index.css`

- [ ] **Step 1: Convert:**

| BEM class | Tailwind utilities |
|---|---|
| `comparison-view` | `py-4` |
| `comparison-view__header` | `mb-6 flex items-center justify-between border-b-2 border-slate-200 pb-4 dark:border-surface-700` |
| `comparison-view__header h2` | `text-xl` |
| `comparison-view__actions` | `flex flex-wrap items-center gap-2` |
| `comparison-view__close` | `btn` |
| `comparison-view__swap` | `cursor-pointer rounded border border-primary-500 bg-transparent px-4 py-2 text-sm text-primary-500 hover:bg-primary-500 hover:text-white dark:border-primary-300 dark:text-primary-300` |
| `btn-export` | `btn` |
| `btn-export--chart` | `mx-auto mt-2 block px-3 py-1.5 text-xs` (combine with `btn`) |
| `comparison-grid` | `grid grid-cols-[140px_1fr_1fr_120px] overflow-hidden rounded-lg border border-slate-200 dark:border-surface-700 max-[767px]:flex max-[767px]:flex-col` |
| `comparison-grid__label` | `border-b border-slate-200 bg-slate-50 px-3 py-2 text-[0.85rem] font-semibold text-slate-500 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-400` |
| `comparison-grid__value` | `border-b border-slate-200 px-3 py-2 text-[0.85rem] dark:border-surface-700` |
| `comparison-grid__value--better` | `font-semibold text-util-low` |
| `comparison-grid__value--worse` | `text-util-high` |
| `comparison-grid__change` | `num border-b border-slate-200 px-3 py-2 text-center text-[0.85rem] text-slate-500 dark:border-surface-700 dark:text-slate-400` |
| `comparison-grid__change--positive` | `font-semibold text-util-low` |
| `comparison-grid__change--negative` | `font-semibold text-util-high` |
| `comparison-grid__col-header` | `border-b-2 border-slate-200 bg-slate-50 px-3 py-3 text-[0.9rem] font-bold dark:border-surface-700 dark:bg-surface-800` |
| `comparison-charts` | `mb-8 grid grid-cols-2 gap-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-surface-700 dark:bg-surface-800 max-[767px]:grid-cols-1 max-[767px]:gap-4 max-[767px]:p-4` |
| `comparison-mobile-card` | `mb-3 rounded-lg border border-slate-200 p-3 dark:border-surface-700` |
| `comparison-mobile-card h3` | `mb-2 border-b border-slate-200 pb-1.5 text-[0.95rem] dark:border-surface-700` |
| `comparison-mobile-row` | `flex justify-between py-1 text-[0.85rem]` |
| `comparison-mobile-row__label` | `font-semibold text-slate-500 dark:text-slate-400` |
| `comparison-delta-section` | `rounded-lg border border-primary-500 bg-primary-50 p-3 dark:bg-surface-800` |
| `comparison-delta-section h3` | `mb-2 text-[0.9rem] text-primary-500 dark:text-primary-300` |

Note: `--better`/`--positive` now map to `text-util-low` and `--worse`/`--negative` to `text-util-high` — the same green/red as the delta column, sourced from `@theme` (no raw `#dc3545`).

- [ ] **Step 2: Delete** all `.comparison-view*`, `.comparison-grid*`, `.comparison-charts`, `.comparison-mobile-*`, `.comparison-delta-section*`, `.btn-export*` rules + their `@media` entries.

- [ ] **Step 3: Verify + commit**

Visual: grid on desktop, stacked mobile cards < 768px, delta section navy border, better/worse green/red in both modes.
```bash
rtk git add web/src/components/ComparisonView.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate ComparisonView to Tailwind utilities"
```

---

## Task 9: Chart containers/legends (SVG internals stay)

**Files:** Modify `web/src/components/BarChart.jsx`, `web/src/components/RadarChart.jsx`, `web/src/index.css`

The injected SVG `<style>` (`barCss`/`radarCss` from Plan 1) keeps targeting `.bar-chart__bar-a` etc. — those internal classes and their hex come from `tokens.js` and must NOT become utilities. Only the React container + legend markup migrates.

- [ ] **Step 1: Convert container/legend classNames:**

| BEM class | Tailwind utilities |
|---|---|
| `bar-chart` / `radar-chart` | `flex flex-col items-center` (bar adds `justify-center`) |
| `bar-chart__svg` | `w-full max-w-[400px]` |
| `radar-chart__svg` | `w-full max-w-[320px]` |
| `bar-chart__legend` / `radar-chart__legend` | `mt-3 flex gap-6 text-xs font-semibold max-[767px]:flex-col max-[767px]:items-center max-[767px]:gap-1` |
| legend item As-Is | render a swatch: `<span className="mr-1.5 inline-block h-3 w-3 rounded-[3px] bg-primary-500 align-middle dark:bg-primary-300" />` |
| legend item To-Be | swatch `bg-accent-500` |

Replace the `::before` swatch CSS approach with an explicit `<span>` swatch element in the JSX (utility-driven), since Tailwind doesn't generate `::before` content swatches idiomatically here.

- [ ] **Step 2: Delete** from `index.css`: `.bar-chart`, `.bar-chart__svg`, `.bar-chart__legend`, `.bar-chart__legend-a/b::before`, the on-screen `.bar-chart__bar-*`/`__label`/`__value` rules (now fully driven by injected `barCss()`), and the equivalent `.radar-chart*` rules + `@media` entries. (The injected `<style>` supplies all SVG-internal styling.)

- [ ] **Step 3: Verify + commit**

Visual: charts unchanged (navy/gold), legends show navy/gold swatches, mobile legends stack. Re-run `cd web && npx vitest run src/components/chartColors.test.js` (still passes — `barCss`/`radarCss` untouched).
```bash
rtk git add web/src/components/BarChart.jsx web/src/components/RadarChart.jsx web/src/index.css && rtk git commit -m "refactor(web): migrate chart containers/legends to Tailwind utilities"
```

---

## Task 10: Remove the legacy CSS-variable bridge

**Files:** Modify `web/src/index.css`

By now every component uses utilities; the Plan 1 `:root`/`.dark` var block and the `body { var(--bg) }` rule are orphaned.

- [ ] **Step 1: Confirm no `var(--…)` consumers remain**

Run: `cd web && rtk grep "var(--" src`
Expected: no matches in `src/**` (charts use `tokens.js`; components use utilities). If any remain, migrate them before deleting.

- [ ] **Step 2: Delete the legacy block** — remove the `:root { … }`, `.dark { … }` (the var-override one), `html { color-scheme }`, `html.dark { … }`, and the legacy `body { background: var(--bg); … }` rules. `index.css` should now contain only: `@import "tailwindcss"`, `@custom-variant dark`, `@theme { … }`, `@layer base { … }`, `@layer components { … }`.

- [ ] **Step 3: Verify**

Run: `cd web && rtk npm run build && rtk npm run lint`
Expected: build + lint pass; app visually identical in light & dark. Confirm `index.css` is now ~80–100 lines (down from ~1014).

- [ ] **Step 4: Commit**

```bash
rtk git add web/src/index.css && rtk git commit -m "refactor(web): drop legacy CSS-var bridge; index.css is now tokens + layers only"
```

---

## Task 11: Docs in sync + full CI

**Files:** Modify `docs/CHANGELOG.md`, `docs/adr/ADR-006-midnight-executive-theme.md`, `docs/architecture.md`

- [ ] **Step 1: Update the CHANGELOG**

In the `## [Unreleased]` section added in Plan 1, append under `### Changed`:
```markdown
- Migrated the entire web UI from hand-written BEM CSS (~1014 lines) to
  idiomatic utility-first Tailwind v4 (`dark:`/responsive variants, a thin
  `@layer components` for `panel`/`btn`/`field`/`num`). `index.css` is now
  tokens + layers only.
```

- [ ] **Step 2: Update ADR-006**

Append to the `## Consequences` section of `docs/adr/ADR-006-midnight-executive-theme.md`:
```markdown
- Completed: web components fully migrated to Tailwind utilities (Plan 2);
  `index.css` reduced to `@import` + `@theme` + `@layer base/components`.
  No raw color literals remain outside `tokens.js` and the `@theme` block.
```

- [ ] **Step 3: Update architecture.md**

If `docs/architecture.md` describes the web layer, note: "Web styling is utility-first Tailwind v4; palette tokens in `index.css @theme` (single source of truth), mirrored to `web/src/theme/tokens.js` for charts + PPTX. See ADR-006."

- [ ] **Step 4: Full CI**

Run (repo root): `rtk make ci`
Expected: lint + test + build all pass (Python + web). All web suites green.

- [ ] **Step 5: Commit**

```bash
rtk git add docs/CHANGELOG.md docs/adr/ADR-006-midnight-executive-theme.md docs/architecture.md && rtk git commit -m "docs: record completion of Tailwind utility migration (Plan 2)"
```

---

## Self-Review

**Spec coverage (Plan 2 portion of the spec):**
- Idiomatic Tailwind rewrite of `App.jsx` + 9 components → Tasks 2–9. ✓
- `dark:` variants replacing `.dark .x` rules → every task's mapping. ✓
- Desktop-first `@media` → mobile-first (`md:` for 767px, `min-[480px]:`/`max-[479px]:` and `max-[767px]:` for the rest) → Tasks 2–9. ✓
- Thin `@layer components` for repeated idioms → Task 1. ✓
- Legacy CSS deleted; `index.css` = tokens + layers only → Tasks 2–10. ✓
- `--better`/`--worse` use `@theme` util colors, no raw hex → Task 8. ✓
- Docs in sync → Task 11. ✓

**Placeholder scan:** Mappings are concrete utility strings; the per-task recipe (read JSX → swap classNames → add dark: → delete CSS → verify) is explicit. No "TBD"/"handle later".

**Type/name consistency:** Component-layer classes (`panel`, `btn`, `btn-primary`, `field`, `num`) defined in Task 1 and referenced consistently in Tasks 3–8. `barCss`/`radarCss` (from Plan 1) untouched in Task 9. ✓

**Risk note — exact breakpoints:** The legacy `@media (max-width: 767px)` and `(max-width: 479px)` are preserved exactly via Tailwind's `max-[767px]:` / `max-[479px]:` arbitrary variants (and `md:` where a mobile-first phrasing is cleaner). This keeps pixel-identical responsive behavior rather than snapping to Tailwind's default `sm`(640)/`md`(768) — `md` (768px) ≈ the 767px breakpoint and is used where it reads better; `min-[480px]:` covers the 480px phone boundary. Verify both breakpoints visually in Task steps.

**Verification reality:** Visual CSS correctness isn't unit-testable; each task relies on `build` + `lint` + manual light/dark visual checks. The data/logic test suites (`useSearch`, `benchmarks`, `exportPptx`, `tokens`, `useTheme`, `ThemeToggle`, `chartColors`) must stay green across all tasks — run `make ci` in Task 11.
```
