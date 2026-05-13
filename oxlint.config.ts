import { defineConfig } from "oxlint";

export default defineConfig({
  categories: { correctness: "error" },
  options: { typeAware: true, typeCheck: true },
  plugins: ["typescript"],
  rules: { "arrow-body-style": "error", "no-duplicate-imports": "error" },
});
