import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        self: 'readonly',
        Worker: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        TextDecoder: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    ignores: ['src/wasm/**', 'dist/**', 'node_modules/**'],
  },
];
