import { defineConfig } from "vite";

// The site reuses the exact pure core from src/ and builds to /docs for GitHub
// Pages. web/public/data/beefs.json (the committed crawl) is copied into the
// build by Vite, so the page paints instantly; a 🔄 button re-crawls live.
export default defineConfig({
  root: "web",
  base: "./",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    target: "es2022",
  },
});
