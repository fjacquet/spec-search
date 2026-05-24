# ADR-007: PWA / offline support via vite-plugin-pwa

**Status**: Accepted
**Date**: 2026-05-24

## Context

The web app already shipped most PWA prerequisites — a web manifest, 192/512
icons, apple-touch meta, `theme-color`, and HTTPS via GitHub Pages — but had no
service worker. Without one the app cannot work offline and does not satisfy
browser installability criteria. The data layer is unusual: `web/public/data/`
is ~87 MB (one `results.json` is 21 MB) plus hundreds of per-processor files,
all gitignored and regenerated from CSV at build time.

## Decision

Add [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox `generateSW`
strategy, `registerType: 'autoUpdate'`, `injectRegister: 'auto'`).

- **Manifest is owned by the plugin** (single source of truth in
  `web/vite.config.js`). The static `web/public/manifest.json` and the manual
  `<link rel="manifest">` in `index.html` were removed; the plugin injects the
  link with the correct `/spec-search/` base. Added a stable `id`.
- **Precache the app shell only** (`js,css,html,ico,svg,png,woff,woff2`) — 18
  entries / ~662 KiB. The `.json` data is deliberately excluded from precache.
- **Runtime caching for data** (`NetworkFirst`, 10 s network timeout, cache
  `spec-data`, max 64 entries / 7 days) for `/spec-search/data/**/*.json`:
  fresh when online, served from cache when offline, with no change to
  bandwidth behaviour versus before.
- `navigateFallback` → `index.html` for offline navigation.

## Consequences

- App is installable and works offline for the app shell + any data already
  visited; first-ever visit to a suite still needs the network.
- The 21 MB `results.json` is cached on demand (counts as one cache entry); the
  bounded `spec-data` cache evicts oldest entries past the limits.
- SW generation does not depend on `data/` being present at build time, so the
  CI ordering (`make data` → Vite build) is unaffected and robust.
- Icons are declared `purpose: "any"`. A true `maskable` icon (with safe-zone
  padding) is an **optional follow-up** — reusing the current logo as maskable
  would clip it on Android, so it was deliberately not declared maskable.

## Alternatives Considered

- **Precache everything (including data)**: Rejected — an ~87 MB precache would
  make install hostile and exceed Workbox's default file-size limits.
- **`StaleWhileRevalidate` for data**: Rejected — it re-downloads the 21 MB
  `results.json` in the background on every visit; `NetworkFirst` gives the same
  freshness when online while still enabling offline.
- **Hand-rolled service worker (`injectManifest`)**: Rejected — more code to
  maintain for no benefit; the generated Workbox SW covers the needs.
- **Keep static `manifest.json` + `manifest: false`**: Rejected in favour of a
  single source of truth that handles the base path automatically.
