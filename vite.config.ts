import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["**/dist/**"],
    options: { typeAware: true, typeCheck: true },
    rules: {
      "no-alert": "error",
    },
  },
  fmt: {
    ignorePatterns: ["**/dist/**"],
    printWidth: 132,
  },
});
