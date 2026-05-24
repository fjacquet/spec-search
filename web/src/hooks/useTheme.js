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
