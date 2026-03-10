import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
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
    },
  },
  {
    ignores: ['src/wasm/**', 'dist/**', 'node_modules/**'],
  },
];
