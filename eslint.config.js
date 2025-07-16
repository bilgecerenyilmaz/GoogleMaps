
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks"
import pluginReact from "eslint-plugin-react";
export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        },
      },
      globals: {
        ...globals.browser, 
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect", 
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", 
      "react/prop-types": "off", 
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  }
];