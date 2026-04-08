/// <reference types="vite/client" />

import { defineConfig } from "vite-plus";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  root: "./src",
  publicDir: "../public",
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
