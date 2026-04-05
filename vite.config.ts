import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    options: { typeAware: true, typeCheck: true },
    rules: {
      "no-alert": "error",
    },
  },
  fmt: {
    printWidth: 132,
  },
});
