import { defineConfig } from 'vitest/config';

// Date logic reads as correct from UTC+2 whether or not it is, so the suite
// runs at a negative offset where UTC midnight lands on the previous day.
process.env.TZ = 'America/New_York';

export default defineConfig({
  test: {
    globals: false,
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
