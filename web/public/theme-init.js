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
