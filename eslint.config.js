// Install at the ROOT, not inside client or server:
//   npm i -D eslint @eslint/js globals eslint-plugin-react-hooks
//   npm i -D eslint-plugin-react-refresh prettier typescript-eslint

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// The base rule double-reports on TS, so the TS one does the work.
const unusedVars = {
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
};

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/build',
    '**/coverage',
    '**/.vite',
    '**/generated',
    '.claude',
  ]),

  // Frontend, browser globals and the React rules.
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: unusedVars,
  },

  // Backend, node globals and no React rules.
  {
    files: ['server/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
    // Express counts four arguments to spot an error handler, so the unused
    // trailing next has to stay. The underscore marks it deliberate.
    rules: unusedVars,
  },

  // Config files at the root, which run in node.
  {
    files: ['*.{js,ts}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
  },
]);
