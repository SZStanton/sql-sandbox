import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel bundles only what it can trace, and these are read by path.
  outputFileTracingIncludes: {
    '/api/source': ['./src/app/api/query/route.ts', './src/lib/*.ts'],
  },

  // Stops Turbopack walking up to the stray lockfile in the home folder.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
