// Install at the ROOT:
//   npm i next react react-dom pg recharts motion @phosphor-icons/react
//   npm i -D typescript @types/node @types/react @types/react-dom @types/pg tailwindcss @tailwindcss/postcss eslint eslint-config-next prettier tsx vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
  ]),

  {
    rules: {
      // Underscore marks a binding that is deliberately unused, such as a key
      // peeled off an object by destructuring.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]);
