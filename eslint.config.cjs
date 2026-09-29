// ESLint v9 flat config
const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        process: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["error", "log", "warn"] }],
    },
  },
];
