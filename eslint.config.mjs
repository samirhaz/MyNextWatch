import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import hooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import globals from "globals";
// The upstream aggregate config includes React plugins limited to ESLint 9.
// These official Next.js, TypeScript and Hooks rules support ESLint 10 directly.
export default defineConfig([
  globalIgnores([
    ".next/**",
    "src/generated/**",
    "next-env.d.ts",
    ".cache/**",
    ".local/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": next, "react-hooks": hooks },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      ...hooks.configs.recommended.rules,
    },
  },
]);
