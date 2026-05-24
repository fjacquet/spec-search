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
      // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon: aria-hidden set on the svg
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  if (pref === "dark")
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon: aria-hidden set on the svg
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon: aria-hidden set on the svg
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
