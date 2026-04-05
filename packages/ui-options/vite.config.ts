import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["dist/**"],
  },
  fmt: {
    ignorePatterns: ["dist/**"],
  },
  resolve: {
    alias: {
      "@header-injector/core": new URL("../core/src/index.ts", import.meta.url).pathname,
    },
  },
});
