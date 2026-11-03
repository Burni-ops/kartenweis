import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Kartenweis — Die Welt entdecken",
        short_name: "Kartenweis",
        description:
          "Entdecke Länder über ihre Orte, Landschaften und Rekorde.",
        theme_color: "#0f8b8d",
        background_color: "#f6f1e7",
        display: "standalone",
        start_url: base,
        scope: base,
        lang: "de",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json,geojson}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  worker: {
    format: "es",
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: [
        "**/tools/jdk*/**",
        "**/tools/android-sdk/**",
        "**/android/**/build/**",
        "**/android/.gradle/**",
        "**/android/app/src/main/assets/**",
        "**/dist/**",
        "**/test-results/**",
        "**/playwright-report/**",
      ],
    },
  },
});
