import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";

export default defineConfig([
  { ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"] },

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      // safety
      eqeqeq: "error",
      "no-console": "warn",
      "no-debugger": "error",

      // cleanliness
      "prefer-const": "error",
      "no-unused-expressions": "error",
      "no-undef": "error",

      // TypeScript
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // async safety
      "require-await": "error",
      "no-async-promise-executor": "error",

      // express safety
      "consistent-return": "error",

      // good habits
      "no-var": "error",
      "prefer-template": "error",
    },
  },
  tseslint.configs.recommended,
  prettier,
]);
