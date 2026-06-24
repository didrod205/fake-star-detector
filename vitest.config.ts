import { defineConfig } from "vitest/config";

// vitest picks this up in preference to vite.config.ts (which sets root: "web"
// for the playground build). Keep tests rooted at the project, not web/.
export default defineConfig({
  root: ".",
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
