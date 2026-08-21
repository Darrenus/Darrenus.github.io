import { copyFileSync, mkdirSync } from "node:fs";
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

      // GitHub Pages serves 404.html as a client-side fallback, but keeps the HTTP 404 status.
      // Known public routes get directory entry points so direct links return 200 as well.
      for (const route of [
        "/resume",
        "/projects",
        "/projects/coding-agent",
        "/projects/hybrid-uav",
        "/projects/breadify",
        "/projects/kaist-smart-canteen",
      ]) {
        const entry = new URL(`./dist${route}/index.html`, import.meta.url);
        mkdirSync(new URL(".", entry), { recursive: true });
        copyFileSync(index, entry);
      }
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
