import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url))
});

const config = [
  ...compat.config({
    extends: ["next/core-web-vitals"]
  }),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".pytest_cache/**",
      "coverage/**",
      "generated/**",
      "src/generated/**"
    ]
  }
];

export default config;
