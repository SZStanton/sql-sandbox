import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Vitest doesn't read tsconfig, so the @/ alias is repeated here.
const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

// Date logic reads as correct from UTC+2 whether or not it is, so the suite
// runs at a negative offset where UTC midnight lands on the previous day.
process.env.TZ = 'America/New_York';

export default defineConfig({
  test: {
    globals: false,
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: ['{db,src/lib,src/queries}/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/{components,hooks,app}/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
