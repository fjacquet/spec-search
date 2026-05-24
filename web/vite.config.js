import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        id: "/spec-search/",
        name: "SPEC CPU2017 Results Search",
        short_name: "SPEC Search",
        description: "Search and compare SPEC CPU2017 benchmark results",
        start_url: "/spec-search/",
        scope: "/spec-search/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3245b7",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        // Precache the app shell only. The ~87 MB of generated `data/*.json`
        // is intentionally excluded and served via runtimeCaching below.
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff,woff2}"],
        // Single-page app: serve index.html for offline navigations.
        navigateFallback: "/spec-search/index.html",
        runtimeCaching: [
          {
            // Benchmark data JSON (per-suite results/facets, per-processor files).
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/spec-search/data/") &&
              url.pathname.endsWith(".json"),
            handler: "NetworkFirst",
            options: {
              cacheName: "spec-data",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: "/spec-search/",
});
