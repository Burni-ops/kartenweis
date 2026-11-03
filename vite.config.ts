import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.VITE_DESKTOP === "1"
      ? []
      : [
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
                  src: "icons/icon-192.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any",
                },
                {
                  src: "icons/icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any",
                },
                {
                  src: "icons/icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
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
        ]),
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
