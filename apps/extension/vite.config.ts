/// <reference types="vite/client" />

import { defineConfig } from "vite-plus";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  base: "./",
  lint: {
    ignorePatterns: ["dist/**"],
  },
  fmt: {
    ignorePatterns: ["dist/**"],
  },
  plugins: [solidPlugin()],
  resolve: {
    conditions: ["development", "browser"],
  },
});
