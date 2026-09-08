import { Pool } from 'pg';
import { typeParsers } from '@/lib/pgTypes';

// Fail at startup, not on the first query.
const connectionString = process.env.DATABASE_APP_URL;
if (!connectionString) {
  throw new Error('DATABASE_APP_URL is not set.');
}

// Cached to prevent dev hot reloads from opening another pool.
const globalForDb = globalThis as unknown as { appPool?: Pool };

export const appPool =
  globalForDb.appPool ??
  new Pool({
    connectionString,
    // Many small instances on Vercel, few connections each.
    max: 4,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    // Lets the process exit instead of waiting on idle clients.
    allowExitOnIdle: true,
    // int8 and date parsing, this pool only.
    types: typeParsers,
  });

// Unhandled error events kill the process.
appPool.on('error', err => {
  console.error('Unexpected error on idle client', err);
});

// Dev only. Production never hot reloads.
if (process.env.NODE_ENV !== 'production') {
  globalForDb.appPool = appPool;
}
