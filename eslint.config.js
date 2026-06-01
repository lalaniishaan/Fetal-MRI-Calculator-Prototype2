import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["src/**/*.js"]
  },
  js.configs.recommended,
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        navigator: "readonly",
        window: "readonly"
      }
    }
  },
  ...tseslint.configs.strict,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly"
      },
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    rules: {
      "@typescript-eslint/no-magic-numbers": "off"
    }
  }
);
