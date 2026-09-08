import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Stops Turbopack walking up to the stray lockfile in the home folder.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
