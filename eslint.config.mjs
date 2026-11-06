import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        sessionStorage: "readonly",
        localStorage: "readonly",
        HTMLElement: "readonly",
        CustomEvent: "readonly",
        Intl: "readonly",
        Set: "readonly",
        Map: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_|^(e|err|error|initialErr|e3)$",
        },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },
];
