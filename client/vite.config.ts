import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"

import { tanstackRouter } from "@tanstack/router-plugin/vite"

import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const config = defineConfig({
  resolve: {
    alias: [
      {
        find: /^#\//,
        replacement: fileURLToPath(new URL("./src/", import.meta.url)),
      },
    ],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/privacy-policy": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "./../server/src/main/resources/static",
    emptyOutDir: true,
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      // Use the existing public/manifest.json instead of auto-generating one
      manifest: false,
      workbox: {
        globPatterns: ["assets/**/*.{js,css,woff2}"],
        navigateFallback: null,
      },
    }),
  ],
})

export default config
