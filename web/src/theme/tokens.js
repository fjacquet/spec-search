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

export const FONT_MONO =
  '"JetBrains Mono", "Fira Code", ui-monospace, monospace';

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
