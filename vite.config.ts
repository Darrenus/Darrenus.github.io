import { copyFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

function spaFallback(): Plugin {
  return {
    name: "spa-fallback",
    closeBundle() {
      const index = new URL("./dist/index.html", import.meta.url);
      const fallback = new URL("./dist/404.html", import.meta.url);
      copyFileSync(index, fallback);
    },
  };
}

// Deployed at the domain root (username.github.io), so base stays "/".
export default defineConfig({
  plugins: [react(), spaFallback()],
  build: {
    target: "es2022",
    // The corpus index is fetched at runtime from /corpus, never bundled.
    assetsInlineLimit: 2048,
  },
});
