import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // 基础配置
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  // 全局变量配置
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    languageOptions: {
      globals: {
        process: 'readonly', // 声明 process 为只读全局变量
        module: 'readonly',
      },
    },
  },
  // TypeScript 推荐配置
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: parser, // 使用 TypeScript 解析器
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true, // 支持 JSX
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "@typescript-eslint/no-explicit-any": "off",
    },
    rules: {
      ...tseslint.configs.recommended.rules, // 应用推荐规则
      "@typescript-eslint/no-unused-vars": "warn", // 示例规则

      // 添加的规则：在标签或变量前后加空格
      "space-infix-ops": "error", // 在操作符周围强制使用空格
      "keyword-spacing": [
        "error",
        {
          before: true, // 关键字前必须有空格
          after: true, // 关键字后必须有空格
        },
      ],
      "object-curly-spacing": ["error", "always"], // 对象字面量的花括号内强制加空格
      "array-bracket-spacing": ["error", "always"], // 数组方括号内强制加空格
      "comma-spacing": [
        "error",
        {
          before: false, // 逗号前不允许空格
          after: true, // 逗号后必须有空格
        },
      ],
    },
  },
  // React 推荐配置
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
    },
    settings: {
      react: {
        version: "detect", // 自动检测 React 版本
      },
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules, // 应用 React 推荐规则
      "react/react-in-jsx-scope": "off",
    },
  },
]);