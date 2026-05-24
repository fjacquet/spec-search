# Midnight Executive Theme — Foundation Implementation Plan (Plan 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring spec-search's web app and pptx export onto vatlas's "Midnight Executive" palette and fonts, with a single source of truth and 3-state dark mode — without yet rewriting components to utilities (that is Plan 2).

**Architecture:** Install Tailwind v4 and define the palette as `@theme` oklch tokens in `index.css` (the source of truth). Mirror those tokens as concrete sRGB hex in a new `tokens.js` for the SVG charts and pptx (which serialize to standalone artifacts where `var()`/oklch can't resolve). Recolor the *existing* hand-written CSS by remapping its `:root` variables to the new palette + adding a `.dark` variable-override block, so every legacy component recolors and gains dark mode immediately. Port vatlas's `useTheme`/`ThemeToggle`/`theme-init` (TS→JS, i18n stripped).

**Tech Stack:** React 19, Vite (web/vite.config.js), Tailwind CSS v4 (`@tailwindcss/vite`), pptxgenjs 4, Vitest, Biome. Commands via `make` from repo root; `npm` inside `web/`.

---

## File Structure

**New files:**
- `web/src/theme/tokens.js` — sRGB-hex mirror of the `@theme` palette; exports `COLORS`, `FONT_MONO`, `chartSeries`, `pptxColors`. Sole color source for charts + pptx.
- `web/src/theme/tokens.test.js` — asserts the mirror's key values + `pptxColors` have no leading `#`.
- `web/src/hooks/useTheme.js` — 3-state (`auto`/`light`/`dark`) theme hook, port of vatlas.
- `web/src/hooks/useTheme.test.js` — preference resolution + persistence + `<html>` class.
- `web/src/components/ThemeToggle.jsx` — 3-button toggle, port of vatlas (no i18n).
- `web/src/components/ThemeToggle.test.jsx` — renders 3 buttons; click sets preference.
- `web/public/theme-init.js` — FOUC pre-paint dark-class script.

**Modified files:**
- `web/package.json` — add `tailwindcss`, `@tailwindcss/vite` (devDependencies).
- `web/vite.config.js` — add `tailwindcss()` plugin.
- `web/src/index.css` — prepend `@import`/`@custom-variant`/`@theme`/base; remap `:root` vars to the new palette; add `.dark` var-override block; fix `--primary`.
- `web/index.html` — add `<script src="theme-init.js">`; `theme-color` meta → navy.
- `web/src/components/BarChart.jsx` — series/label colors + mono font from `tokens.js`; accept `theme` prop for dark series.
- `web/src/components/RadarChart.jsx` — same.
- `web/src/components/exportPptx.js` — replace `COLOR_*` with `pptxColors`; Consolas metric cells; navy/gold legend; ink header labels.
- `web/src/__tests__/exportPptx.test.js` — add color/marker assertions.
- `web/src/App.jsx` — mount `<ThemeToggle/>` in the header.
- `web/public/favicon.svg`, `web/public/logo.svg`, `web/public/manifest.json` — recolor blue→navy.

---

## Task 1: Install & wire Tailwind v4 (palette tokens live, app still works)

**Files:**
- Modify: `web/package.json`
- Modify: `web/vite.config.js`
- Modify: `web/src/index.css:1` (prepend block)

- [ ] **Step 1: Add Tailwind deps**

Run (from `web/`):
```bash
cd web && npm install -D tailwindcss@^4 @tailwindcss/vite@^4
```
Expected: `package.json` devDependencies gains `tailwindcss` and `@tailwindcss/vite`; `npm` exits 0.

- [ ] **Step 2: Add the Vite plugin**

Edit `web/vite.config.js` to:
```js
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/spec-search/",
});
```

- [ ] **Step 3: Prepend Tailwind import + @theme tokens to index.css**

Insert at the very top of `web/src/index.css`, **above** the existing `:root {` (do not delete anything below yet):
```css
@import "tailwindcss";

/* Class-strategy dark variant: `dark:bg-X` activates under an ancestor
 * with class="dark". public/theme-init.js sets it before paint. */
@custom-variant dark (&:where(.dark, .dark *));

/* spec-search — Midnight Executive palette (ported verbatim from vatlas;
 * single source of truth, matches web/src/theme/tokens.js + the PPTX export). */
@theme {
  --color-primary-50: oklch(96% 0.02 270);
  --color-primary-100: oklch(91% 0.04 270);
  --color-primary-200: oklch(82% 0.08 270);
  --color-primary-300: oklch(70% 0.12 270);
  --color-primary-400: oklch(58% 0.16 270);
  --color-primary-500: oklch(45% 0.18 270);
  --color-primary-600: oklch(36% 0.16 270);
  --color-primary-700: oklch(28% 0.14 270);
  --color-primary-800: oklch(22% 0.12 270);
  --color-primary-900: oklch(18% 0.08 270);
  --color-primary-950: oklch(12% 0.05 270);

  --color-ice: oklch(88% 0.04 240);
  --color-accent-500: oklch(78% 0.16 75);

  --color-util-low: oklch(64% 0.16 142);
  --color-util-mid: oklch(72% 0.18 65);
  --color-util-high: oklch(58% 0.22 25);

  --color-surface-50: oklch(98% 0.005 260);
  --color-surface-100: oklch(95% 0.008 260);
  --color-surface-200: oklch(88% 0.01 260);
  --color-surface-700: oklch(28% 0.02 260);
  --color-surface-800: oklch(20% 0.02 260);
  --color-surface-900: oklch(15% 0.02 260);

  --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}
```

- [ ] **Step 4: Verify the build still works**

Run (from repo root):
```bash
cd web && rtk npm run build
```
Expected: build succeeds (Tailwind processes `@theme`; existing `:root` CSS still present so layout is unchanged).

- [ ] **Step 5: Commit**

```bash
rtk git add web/package.json web/package-lock.json web/vite.config.js web/src/index.css && rtk git commit -m "build(web): add Tailwind v4 + Midnight Executive @theme tokens"
```

---

## Task 2: `tokens.js` — single hex mirror of the palette (TDD)

**Files:**
- Create: `web/src/theme/tokens.js`
- Test: `web/src/theme/tokens.test.js`

- [ ] **Step 1: Write the failing test**

`web/src/theme/tokens.test.js`:
```js
import { describe, expect, it } from "vitest";
import { COLORS, FONT_MONO, chartSeries, pptxColors } from "./tokens.js";

describe("Midnight Executive tokens", () => {
  it("As-Is = navy primary-500, To-Be = gold accent", () => {
    expect(COLORS.primary500).toBe("#3245b7");
    expect(COLORS.accent500).toBe("#f9b935");
  });

  it("delta status colors are util-low/high", () => {
    expect(COLORS.utilLow).toBe("#4aa342");
    expect(COLORS.utilHigh).toBe("#df202e");
  });

  it("light chart series uses navy/gold; dark lightens As-Is", () => {
    expect(chartSeries.light.asIs).toBe("#3245b7");
    expect(chartSeries.light.toBe).toBe("#f9b935");
    expect(chartSeries.dark.asIs).toBe("#819ae9");
  });

  it("mono stack leads with JetBrains Mono", () => {
    expect(FONT_MONO).toMatch(/^"JetBrains Mono"/);
  });

  it("pptx colors are bare hex (no leading #)", () => {
    for (const v of Object.values(pptxColors)) {
      expect(v).not.toMatch(/#/);
      expect(v).toMatch(/^[0-9a-f]{6}$/);
    }
    expect(pptxColors.asIs).toBe("3245b7");
    expect(pptxColors.toBe).toBe("f9b935");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/theme/tokens.test.js`
Expected: FAIL — cannot resolve `./tokens.js`.

- [ ] **Step 3: Write the implementation**

`web/src/theme/tokens.js`:
```js
/**
 * Midnight Executive palette — single hand-synced mirror of the @theme oklch
 * tokens in src/index.css (the source of truth). Charts and the PPTX export
 * serialize to standalone artifacts (detached SVG -> PNG; .pptx) where
 * var()/oklch do not resolve, so they consume these concrete sRGB hex values.
 * sRGB hex = accurate OKLCH->sRGB conversion of the index.css values; the
 * oklch source is kept in the trailing comment per token. Keep in sync.
 */

/** With leading '#': web / SVG consumers. */
export const COLORS = {
  primary200: "#b0c2f9", // oklch(82% .08 270)
  primary300: "#819ae9", // oklch(70% .12 270)
  primary500: "#3245b7", // oklch(45% .18 270) — As-Is / brand
  accent500: "#f9b935", //  oklch(78% .16 75)  — To-Be / factual marker
  utilLow: "#4aa342", //    oklch(64% .16 142) — delta improvement
  utilMid: "#ef8700", //    oklch(72% .18 65)
  utilHigh: "#df202e", //   oklch(58% .22 25)  — delta regression
  ink: "#0f172a",
  inkMuted: "#475569",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  surface700: "#232933", // oklch(28% .02 260)
  surface800: "#11161f", // oklch(20% .02 260)
  paper: "#ffffff",
};

export const FONT_MONO = '"JetBrains Mono", "Fira Code", ui-monospace, monospace';

/**
 * Chart series by resolved theme. `light` is used for BOTH the light screen
 * AND every export (PNG/pptx render on white). `dark` is on-screen only —
 * As-Is lightens to navy-300; gold reads on dark unchanged.
 */
export const chartSeries = {
  light: {
    asIs: COLORS.primary500,
    toBe: COLORS.accent500,
    grid: COLORS.slate200,
    axis: COLORS.slate500,
    label: COLORS.inkMuted,
  },
  dark: {
    asIs: COLORS.primary300,
    toBe: COLORS.accent500,
    grid: COLORS.surface700,
    axis: COLORS.slate400,
    label: COLORS.slate400,
  },
};

const bare = (hex) => hex.replace("#", "");

/** PPTX (pptxgenjs) convention: hex WITHOUT a leading '#'. */
export const pptxColors = {
  asIs: bare(COLORS.primary500), //  navy
  toBe: bare(COLORS.accent500), //   gold
  deltaUp: bare(COLORS.utilLow), //  green
  deltaDown: bare(COLORS.utilHigh), // red
  ink: bare(COLORS.ink),
  inkMuted: bare(COLORS.inkMuted),
  headerBg: "f1f5f9", // surface-100 tint
  altRow: "f8fafc",
  paper: "ffffff",
  hairline: bare(COLORS.slate200),
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/theme/tokens.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
rtk git add web/src/theme/tokens.js web/src/theme/tokens.test.js && rtk git commit -m "feat(web): add Midnight Executive token mirror (tokens.js)"
```

---

## Task 3: Recolor legacy CSS variables + add dark overrides (fixes `--primary`)

**Files:**
- Modify: `web/src/index.css` (the `:root {` block at the former lines 1–11, now below the `@theme` block; the two `#dc3545` literals at the comparison-grid rules)

This recolors every existing component immediately and gives them dark mode, ahead of the Plan 2 utility rewrite.

- [ ] **Step 1: Remap `:root` to the Midnight Executive palette**

Replace the existing `:root { … }` block with:
```css
:root {
  --bg: #ffffff;
  --bg-secondary: #f8fafc; /* slate-50 */
  --text: #0f172a; /* ink */
  --text-secondary: #475569; /* inkMuted */
  --border: #e2e8f0; /* slate-200 */
  --primary: #3245b7; /* navy primary-500 (was undefined — bug fix) */
  --accent: #3245b7; /* navy primary-500 */
  --accent-hover: #2a3a9c; /* darker navy (hover) */
  --row-hover: #eef2ff; /* primary-50 tint */
  --success: #4aa342; /* util-low green */
  --danger: #df202e; /* util-high red */
}

/* Dark mode for legacy (CSS-var) components — Plan 2 migrates these to
 * Tailwind `dark:` utilities; until then this var-override block drives it. */
.dark {
  --bg: #11161f; /* surface-800 */
  --bg-secondary: #232933; /* surface-700 */
  --text: #f1f5f9; /* slate-100 */
  --text-secondary: #94a3b8; /* slate-400 */
  --border: #232933; /* surface-700 */
  --accent: #819ae9; /* navy primary-300 (reads on dark) */
  --accent-hover: #b0c2f9; /* primary-200 */
  --row-hover: #1e2540; /* dark navy tint */
}

html {
  color-scheme: light;
}
html.dark {
  color-scheme: dark;
}
body {
  background: var(--bg);
  color: var(--text);
}
```

- [ ] **Step 2: Replace the two hard-coded regression reds**

In `web/src/index.css`, the rules `.comparison-grid__value--worse` and `.comparison-grid__change--negative` use `color: #dc3545;`. Change both to:
```css
  color: var(--danger);
```

- [ ] **Step 3: Verify build + visual**

Run: `cd web && rtk npm run build`
Expected: build succeeds.
Run: `cd web && rtk npm run dev` and open the app — header/buttons/links are navy (not Bootstrap blue); the dead suite-button hover color now works (navy). Add `class="dark"` to `<html>` in devtools → background goes dark, text light.

- [ ] **Step 4: Commit**

```bash
rtk git add web/src/index.css && rtk git commit -m "feat(web): remap legacy CSS vars to Midnight Executive + dark overrides; fix --primary"
```

---

## Task 4: `useTheme.js` hook (TDD)

**Files:**
- Create: `web/src/hooks/useTheme.js`
- Test: `web/src/hooks/useTheme.test.js`

- [ ] **Step 1: Write the failing test**

`web/src/hooks/useTheme.test.js`:
```js
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "./useTheme.js";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.stubGlobal("matchMedia", (q) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe("useTheme", () => {
  it("defaults to auto -> resolves light when OS is light", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe("auto");
    expect(result.current.resolved).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("setting dark adds the html class and persists", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPreference("dark"));
    expect(result.current.resolved).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("spec-search-theme")).toBe("dark");
  });

  it("auto removes the stored key", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPreference("dark"));
    act(() => result.current.setPreference("auto"));
    expect(localStorage.getItem("spec-search-theme")).toBe(null);
  });
});
```

- [ ] **Step 2: Verify it fails (and add the test dep if missing)**

Run: `cd web && npx vitest run src/hooks/useTheme.test.js`
Expected: FAIL — `@testing-library/react` not found OR `useTheme.js` missing. If the library is missing, install it:
```bash
cd web && npm install -D @testing-library/react
```
Re-run; expected FAIL on missing `./useTheme.js`.

- [ ] **Step 3: Write the implementation** (port of vatlas `useTheme.ts`, TS→JS, key `spec-search-theme`)

`web/src/hooks/useTheme.js`:
```js
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "spec-search-theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const isPreference = (v) => v === "auto" || v === "light" || v === "dark";

const readStoredPreference = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // Safari private mode throws on localStorage access. Fall through.
  }
  return "auto";
};

const persistPreference = (pref) => {
  try {
    if (pref === "auto") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Same Safari private-mode caveat — silent failure is acceptable.
  }
};

const applyClass = (resolved) => {
  const cls = document.documentElement.classList;
  if (resolved === "dark") cls.add("dark");
  else cls.remove("dark");
};

const osPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia(MEDIA_QUERY).matches;

const computeResolved = (pref) => {
  if (pref === "light" || pref === "dark") return pref;
  return osPrefersDark() ? "dark" : "light";
};

/**
 * 3-state theme preference (`auto`/`light`/`dark`) backed by
 * localStorage['spec-search-theme']. `auto` follows the OS reactively.
 * The PPTX deck and chart exports stay light regardless — this only drives
 * the on-screen <html class="dark"> toggle.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const [resolved, setResolved] = useState(() =>
    computeResolved(readStoredPreference()),
  );

  useEffect(() => {
    const next = computeResolved(preference);
    setResolved(next);
    applyClass(next);
    persistPreference(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== "auto") return;
    const mq = window.matchMedia(MEDIA_QUERY);
    const handler = (e) => {
      const next = e.matches ? "dark" : "light";
      setResolved(next);
      applyClass(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setPreference = useCallback((p) => {
    if (isPreference(p)) setPreferenceState(p);
  }, []);

  return { preference, resolved, setPreference };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/hooks/useTheme.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
rtk git add web/src/hooks/useTheme.js web/src/hooks/useTheme.test.js web/package.json web/package-lock.json && rtk git commit -m "feat(web): add useTheme 3-state dark-mode hook"
```

---

## Task 5: FOUC script + index.html wiring + theme-color

**Files:**
- Create: `web/public/theme-init.js`
- Modify: `web/index.html`

- [ ] **Step 1: Create the FOUC script**

`web/public/theme-init.js`:
```js
// FOUC-prevention for spec-search's dark-mode toggle: set the dark class
// before first paint from localStorage['spec-search-theme'] + OS preference.
(() => {
  let pref = null;
  try {
    pref = localStorage.getItem("spec-search-theme");
  } catch (_) {}
  const resolved =
    pref === "light" || pref === "dark"
      ? pref
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  if (resolved === "dark") document.documentElement.classList.add("dark");
})();
```

- [ ] **Step 2: Wire it + recolor theme-color in index.html**

In `web/index.html`: change `<meta name="theme-color" content="#0d6efd" />` to `content="#3245b7"`, and add, just before `</head>`:
```html
    <script src="theme-init.js"></script>
```
(Relative `src` — respects `base: "/spec-search/"`. `public/` files are served at the base root.)

- [ ] **Step 3: Verify**

Run: `cd web && rtk npm run build`
Expected: build succeeds; `dist/theme-init.js` present.
In `rtk npm run dev`: set `localStorage['spec-search-theme']='dark'`, reload → no flash of light before dark applies.

- [ ] **Step 4: Commit**

```bash
rtk git add web/public/theme-init.js web/index.html && rtk git commit -m "feat(web): FOUC theme-init script + navy theme-color"
```

---

## Task 6: `ThemeToggle.jsx` + mount in header (TDD)

**Files:**
- Create: `web/src/components/ThemeToggle.jsx`
- Test: `web/src/components/ThemeToggle.test.jsx`
- Modify: `web/src/App.jsx` (header — mount the toggle next to `.suite-selector`)

- [ ] **Step 1: Write the failing test**

`web/src/components/ThemeToggle.test.jsx`:
```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle.jsx";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.stubGlobal("matchMedia", (q) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

describe("ThemeToggle", () => {
  it("renders Auto / Light / Dark options", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Auto" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Light" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Dark" })).toBeDefined();
  });

  it("clicking Dark applies the dark class", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `cd web && npx vitest run src/components/ThemeToggle.test.jsx`
Expected: FAIL — `./ThemeToggle.jsx` missing.

- [ ] **Step 3: Write the implementation** (port of vatlas, i18n removed, plain labels; uses Tailwind utilities)

`web/src/components/ThemeToggle.jsx`:
```jsx
import { useTheme } from "../hooks/useTheme.js";

const PREFERENCES = [
  { key: "auto", label: "Auto" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

function Glyph({ pref }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (pref === "light")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  if (pref === "dark")
    return (
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

/** 3-state theme toggle (Auto / Light / Dark). */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <fieldset
      aria-label="Theme"
      className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5 text-xs dark:border-surface-700 dark:bg-surface-900"
    >
      <legend className="sr-only">Theme</legend>
      {PREFERENCES.map(({ key, label }) => {
        const active = preference === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setPreference(key)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
              active
                ? "bg-primary-100 text-primary-900 dark:bg-primary-700 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Glyph pref={key} />
            <span>{label}</span>
          </button>
        );
      })}
    </fieldset>
  );
}
```

- [ ] **Step 4: Verify it passes**

Run: `cd web && npx vitest run src/components/ThemeToggle.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Mount in the header**

In `web/src/App.jsx`, add the import near the other component imports:
```jsx
import { ThemeToggle } from "./components/ThemeToggle.jsx";
```
Then render `<ThemeToggle />` inside the header, immediately after the `.suite-selector` element (around `App.jsx:209`), so it sits at the right of the header row.

- [ ] **Step 6: Verify build + visual**

Run: `cd web && rtk npm run build`
Expected: build succeeds; the toggle appears in the header and flips light/dark live.

- [ ] **Step 7: Commit**

```bash
rtk git add web/src/components/ThemeToggle.jsx web/src/components/ThemeToggle.test.jsx web/src/App.jsx && rtk git commit -m "feat(web): add 3-state ThemeToggle to header"
```

---

## Task 7: Recolor charts from tokens + mono font + dark series (TDD)

**Files:**
- Modify: `web/src/components/BarChart.jsx` (the `BAR_CSS` string at lines 4–9)
- Modify: `web/src/components/RadarChart.jsx` (the `RADAR_CSS` string at lines 4–12)
- Test: `web/src/components/chartColors.test.js` (new)

The SVG `<style>` strings are serialized for export — they must hold concrete hex from `tokens.js`, not utilities. Build the CSS string from `chartSeries` so the *exported* PNG always uses the light palette (white bg). On-screen, pass the resolved theme to swap series (optional; defaults to light).

- [ ] **Step 1: Write the failing test**

`web/src/components/chartColors.test.js`:
```js
import { describe, expect, it } from "vitest";
import { COLORS } from "../theme/tokens.js";
import { barCss } from "./BarChart.jsx";
import { radarCss } from "./RadarChart.jsx";

describe("chart palette", () => {
  it("light bar chart: As-Is navy, To-Be gold, mono labels", () => {
    const css = barCss("light");
    expect(css).toContain(COLORS.primary500); // As-Is
    expect(css).toContain(COLORS.accent500); // To-Be
    expect(css).toContain("JetBrains Mono");
    expect(css).not.toContain("#0d6efd");
    expect(css).not.toContain("#dc3545");
  });

  it("dark bar chart lightens As-Is to navy-300", () => {
    expect(barCss("dark")).toContain(COLORS.primary300);
  });

  it("light radar chart: As-Is navy, To-Be gold", () => {
    const css = radarCss("light");
    expect(css).toContain(COLORS.primary500);
    expect(css).toContain(COLORS.accent500);
    expect(css).not.toContain("#0d6efd");
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `cd web && npx vitest run src/components/chartColors.test.js`
Expected: FAIL — `barCss`/`radarCss` not exported.

- [ ] **Step 3: Refactor BarChart.jsx to build CSS from tokens**

In `web/src/components/BarChart.jsx`, replace the top-of-file `const BAR_CSS = \`…\`;` with an exported builder, and import the tokens:
```jsx
import { useRef } from "react";
import { useSuite } from "../hooks/useSuite.js";
import { chartSeries, FONT_MONO } from "../theme/tokens.js";

/** CSS injected into the serialized SVG (export needs concrete hex, not
 * Tailwind utilities). `theme` defaults to light so exports stay on white. */
export function barCss(theme = "light") {
  const s = chartSeries[theme] ?? chartSeries.light;
  return `
  .bar-chart__label { font-size: 11px; fill: ${s.label}; font-family: ${FONT_MONO}; }
  .bar-chart__bar-a { fill: ${s.asIs}; opacity: 0.85; }
  .bar-chart__bar-b { fill: ${s.toBe}; opacity: 0.85; }
  .bar-chart__value { font-size: 10px; fill: ${s.label}; font-family: ${FONT_MONO}; }
`;
}
```
Then update every reference to `BAR_CSS` in this file to call `barCss()` (e.g. in `prepareBarSvg`, set `style.textContent = barCss();`). If the on-screen component currently injects `BAR_CSS`, inject `barCss()` likewise. (Keep the existing `prepareBarSvg` export signature unchanged for `exportPptx.js`.)

- [ ] **Step 4: Refactor RadarChart.jsx the same way**

In `web/src/components/RadarChart.jsx`, replace `const RADAR_CSS = \`…\`;` with:
```jsx
import { useRef } from "react";
import { useSuite } from "../hooks/useSuite.js";
import { chartSeries, COLORS, FONT_MONO } from "../theme/tokens.js";

export function radarCss(theme = "light") {
  const s = chartSeries[theme] ?? chartSeries.light;
  const rgba = (hex, a) => {
    const n = Number.parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  return `
  .radar-chart__ring { fill: none; stroke: ${s.grid}; stroke-width: 0.5; }
  .radar-chart__axis { stroke: ${s.grid}; stroke-width: 0.5; }
  .radar-chart__area-a { fill: ${rgba(s.asIs, 0.2)}; stroke: ${s.asIs}; stroke-width: 2; }
  .radar-chart__area-b { fill: ${rgba(s.toBe, 0.2)}; stroke: ${s.toBe}; stroke-width: 2; }
  .radar-chart__dot-a { fill: ${s.asIs}; }
  .radar-chart__dot-b { fill: ${s.toBe}; }
  .radar-chart__label { font-size: 11px; fill: ${s.label}; font-family: ${FONT_MONO}; }
`;
}
```
Update all `RADAR_CSS` references to `radarCss()`. (The `COLORS` import is available if a literal is needed; remove it if unused to satisfy Biome.)

- [ ] **Step 5: Recolor the on-screen legend swatches in index.css**

In `web/src/index.css`, the legend `::before` swatches are hard-coded. Change:
- `.radar-chart__legend-a::before` and `.bar-chart__legend-a::before` `background:` → `#3245b7` (navy, As-Is)
- `.radar-chart__legend-b::before` and `.bar-chart__legend-b::before` `background:` → `#f9b935` (gold, To-Be)

(The `.radar-chart__area-*` / `__dot-*` / `__bar-*` rules in index.css are overridden by the injected `<style>`; leaving them is harmless, but for cleanliness update their hex to match navy/gold too.)

- [ ] **Step 6: Verify tests + build**

Run: `cd web && npx vitest run src/components/chartColors.test.js && rtk npm run build`
Expected: PASS (3 tests); build succeeds. In the app, compare-view radar/bar charts show navy (As-Is) vs gold (To-Be) with mono numeric labels.

- [ ] **Step 7: Commit**

```bash
rtk git add web/src/components/BarChart.jsx web/src/components/RadarChart.jsx web/src/components/chartColors.test.js web/src/index.css && rtk git commit -m "feat(web): recolor charts to navy/gold from tokens, mono labels"
```

---

## Task 8: Recolor the PPTX export from tokens (TDD)

**Files:**
- Modify: `web/src/components/exportPptx.js`
- Test: `web/src/__tests__/exportPptx.test.js` (extend)

- [ ] **Step 1: Add color/marker assertions to the existing test**

`buildSlideData(systemA, systemB, suite)` returns `{ title, subtitle, filename, tableRows }`. Add a new test in `web/src/__tests__/exportPptx.test.js` (reuse the existing fixture pattern in that file for `systemA`/`systemB`/`suite`):
```js
import { pptxColors } from "../theme/tokens.js";

it("uses navy As-Is / gold To-Be in header, ink labels, util delta colors", () => {
  const { tableRows } = buildSlideData(systemA, systemB, suite);
  const header = tableRows[0];
  // As-Is/To-Be identity carried by marker glyph color; header text is ink
  // (gold-on-light fails contrast).
  expect(header[1].options.color).toBe(pptxColors.ink);
  expect(header[2].options.color).toBe(pptxColors.ink);

  // The numeric delta cells are util-low (improve) or util-high (regress).
  const dataRows = tableRows.slice(1);
  const colors = dataRows.map((r) => r[3].options.color);
  const palette = new Set([
    pptxColors.deltaUp,
    pptxColors.deltaDown,
    pptxColors.inkMuted,
  ]);
  for (const c of colors) expect(palette.has(c)).toBe(true);
});
```
(Reference the existing fixtures already declared in this test file; if they are scoped inside a `describe`, place the new `it` in the same block.)

- [ ] **Step 2: Verify it fails**

Run: `cd web && npx vitest run src/__tests__/exportPptx.test.js`
Expected: FAIL — header colors are still `COLOR_BLUE`/`COLOR_RED`; delta uses `COLOR_GRAY`/`COLOR_GREEN`/`COLOR_RED`.

- [ ] **Step 3: Replace the color constants + treatments**

In `web/src/components/exportPptx.js`:

Replace the constant block (lines 31–36):
```js
import { getSuite } from "../constants/suites.js";
import { pptxColors } from "../theme/tokens.js";

const COLOR_AS_IS = `#${pptxColors.asIs}`.slice(1); // navy (legend marker)
const COLOR_TO_BE = pptxColors.toBe; // gold (legend marker)
const COLOR_INK = pptxColors.ink;
const COLOR_INK_MUTED = pptxColors.inkMuted;
const COLOR_HEADER_BG = pptxColors.headerBg;
const COLOR_ALT_ROW = pptxColors.altRow;
```
(Simpler: `const COLOR_AS_IS = pptxColors.asIs;`)

Update `deltaColor()` to use the util palette:
```js
function deltaColor(toBeVal, asIsVal) {
  if (toBeVal == null || asIsVal == null || toBeVal === asIsVal)
    return COLOR_INK_MUTED;
  return toBeVal > asIsVal ? pptxColors.deltaUp : pptxColors.deltaDown;
}
```

In `buildSlideData`, the header row: set the As-Is and To-Be header cell `options.color` to `COLOR_INK` (was `COLOR_BLUE`/`COLOR_RED`) and the "Metric"/"Change" headers to `COLOR_INK`. Keep `fill: COLOR_HEADER_BG`.

In `exportToPptx`:
- Title color `"222222"` → `COLOR_INK`.
- Subtitle/footer gray → `COLOR_INK_MUTED`.
- The separator line `line: { color: COLOR_BLUE, … }` → `color: COLOR_AS_IS` (navy).
- Legend markers: `"■ "` before As-Is → `color: COLOR_AS_IS` (navy); before To-Be → `color: COLOR_TO_BE` (gold). Label text → `COLOR_INK_MUTED`.
- Table border `color: "DDDDDD"` → `pptxColors.hairline`.
- Add `fontFace: "Consolas"` to the numeric/metric cells: in `buildSlideData`'s `dataRows`, for the As-Is value, To-Be value, and delta cells (indices 1,2,3), add `fontFace: "Consolas"` to their `options` (the label cell at index 0 stays Arial).

- [ ] **Step 4: Verify tests pass**

Run: `cd web && npx vitest run src/__tests__/exportPptx.test.js`
Expected: PASS — existing text assertions still pass; new color test passes.

- [ ] **Step 5: Commit**

```bash
rtk git add web/src/components/exportPptx.js web/src/__tests__/exportPptx.test.js && rtk git commit -m "feat(web): recolor PPTX export to Midnight Executive (navy/gold, Consolas)"
```

---

## Task 9: Rebrand static assets (blue → navy)

**Files:**
- Modify: `web/public/favicon.svg`, `web/public/logo.svg`, `web/public/manifest.json`

- [ ] **Step 1: Recolor the SVGs**

In `web/public/favicon.svg` and `web/public/logo.svg`, replace fill/stroke hex:
- `#0d6efd` → `#3245b7` (navy primary-500)
- `#0b5ed7` → `#2a3a9c` (darker navy)
- leave `#ffffff` unchanged.

- [ ] **Step 2: Recolor the manifest**

In `web/public/manifest.json`, set `"theme_color": "#3245b7"` (was `#0d6efd`); leave `background_color` (`#ffffff`).

- [ ] **Step 3: Verify**

Run: `cd web && rtk npm run build`
Expected: build succeeds; favicon/logo render navy.

- [ ] **Step 4: Commit**

```bash
rtk git add web/public/favicon.svg web/public/logo.svg web/public/manifest.json && rtk git commit -m "feat(web): rebrand favicon/logo/manifest to navy"
```

---

## Task 10: Docs in sync (CHANGELOG + ADR)

**Files:**
- Create: `docs/adr/ADR-006-midnight-executive-theme.md`
- Modify: `docs/CHANGELOG.md`
- Modify: `docs/architecture.md` (if it describes web styling)

- [ ] **Step 1: Write the ADR**

`docs/adr/ADR-006-midnight-executive-theme.md` (follow the format of `docs/adr/ADR-005-*`):
```markdown
# ADR-006: Adopt vatlas "Midnight Executive" theme (web + PPTX)

## Status
Accepted — 2026-05-24

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
same rationale vatlas uses for its echarts/pptx color modules).

Semantics: As-Is = navy `#3245b7`, To-Be = gold `#f9b935`; green/red confined
to the delta column (factual status, never a verdict). PPTX headers use ink
text (gold-on-light fails contrast); system identity via legend markers.
3-state dark mode (auto/light/dark) on screen; PPTX and chart exports stay
light on white.

## Consequences
- Web migrates to Tailwind v4 (component utility rewrite tracked in Plan 2).
- Numeric values use a mono font (JetBrains Mono web / Consolas PPTX).
- Charts/pptx must consume `tokens.js`, never raw hex literals.
```

- [ ] **Step 2: Add a CHANGELOG entry**

In `docs/CHANGELOG.md`, add above the top entry (use an `## [Unreleased]` section, Keep a Changelog format):
```markdown
## [Unreleased]

### Added

- Midnight Executive theme shared with vatlas: Tailwind v4 `@theme` tokens as
  the single source of truth, mirrored to `web/src/theme/tokens.js` for charts
  and the PPTX export. 3-state dark mode (auto/light/dark) with FOUC-safe init.
- Monospace font (JetBrains Mono) for numeric values on web; Consolas for
  metric cells in the PPTX export.

### Changed

- Recolored the web app, comparison charts, PPTX export, favicon/logo/manifest
  to the navy/gold Midnight Executive palette (As-Is navy, To-Be gold; green/red
  confined to the delta column).

### Fixed

- Dead `var(--primary)` reference in `.suite-btn` (hover/active color now works).
```

- [ ] **Step 3: Sync architecture.md if needed**

If `docs/architecture.md` documents the web styling approach, add a short note: "Web theming = Tailwind v4 `@theme` tokens (Midnight Executive), single source of truth mirrored to `web/src/theme/tokens.js` for charts + PPTX; see ADR-006." If it doesn't mention styling, skip.

- [ ] **Step 4: Commit**

```bash
rtk git add docs/adr/ADR-006-midnight-executive-theme.md docs/CHANGELOG.md docs/architecture.md && rtk git commit -m "docs: ADR-006 + changelog for Midnight Executive theme foundation"
```

---

## Task 11: Full CI + verification

- [ ] **Step 1: Lint**

Run: `cd web && rtk npm run lint`
Expected: Biome passes (fix with `npm run lint:fix` if formatting-only; re-run). Watch for unused imports (e.g. `COLORS` in RadarChart) — remove if flagged.

- [ ] **Step 2: All web tests**

Run: `cd web && rtk npm run test`
Expected: all suites pass (tokens, useTheme, ThemeToggle, chartColors, exportPptx, benchmarks, useSearch).

- [ ] **Step 3: Full build**

Run: `cd web && rtk npm run build`
Expected: succeeds.

- [ ] **Step 4: Manual visual checklist** (`cd web && rtk npm run dev`)
  - Header, links, buttons, suite selector are navy; suite-button hover/active shows navy (the old `--primary` bug).
  - ThemeToggle flips Auto/Light/Dark; reload preserves choice; no FOUC flash.
  - Dark mode: page dark, text light, panels surface-800/700.
  - Comparison charts: As-Is navy, To-Be gold; numeric labels in mono.
  - Export pptx: white deck, navy separator, navy/gold legend squares, Consolas numbers, green/red only in the Change column, ink header labels.

- [ ] **Step 5: Final commit if any lint fixes were applied**

```bash
rtk git add -A web && rtk git commit -m "chore(web): lint + verification for Midnight Executive foundation"
```

---

## Self-Review

**Spec coverage:**
- Token model / single source of truth → Tasks 1, 2. ✓
- Palette ported verbatim → Task 1 (`@theme`), Task 2 (hex mirror). ✓
- Semantic mapping (As-Is navy / To-Be gold / green-red delta / ink pptx headers) → Tasks 7, 8. ✓
- Fonts (mono web, Consolas pptx) → Tasks 7, 8. ✓
- Dark mode (3-state, FOUC, light exports) → Tasks 4, 5, 6; legacy dark via Task 3. ✓
- Brand-asset recolor → Task 9. ✓
- `--primary` bug fix → Task 3. ✓
- Docs in sync (CHANGELOG + ADR-006) → Task 10. ✓
- Testing (`make ci`, exportPptx survives) → Task 11. ✓
- **Deferred to Plan 2 (by design):** idiomatic Tailwind utility rewrite of `App.jsx` + 9 components and deletion of the legacy CSS. Plan 1 keeps legacy CSS working (recolored via vars).

**Placeholder scan:** none — every code step has complete content.

**Type/name consistency:** `barCss`/`radarCss` exported in Task 7 and consumed in the Task 7 test; `pptxColors` defined in Task 2, consumed in Tasks 7/8; `useTheme` returns `{ preference, resolved, setPreference }` used by `ThemeToggle` and tests; storage key `spec-search-theme` consistent across `useTheme.js` + `theme-init.js`. ✓

**Note on test deps:** Tasks 4 & 6 use `@testing-library/react` (added in Task 4 Step 2 if absent). If the project prefers not to add it, `useTheme`/`ThemeToggle` tests can be rewritten against the exported pure helpers instead — but RTL is the lowest-friction path and is already common in Vite/Vitest setups.
```
