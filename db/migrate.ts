import { Client } from 'pg';
import { readMigrations } from './migrationFiles';

process.loadEnvFile('.env.local');

const MIGRATIONS_DIR = 'db/migrations';
const PLATFORM_DIR = 'db/platform';

const TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version     TEXT        PRIMARY KEY,
    name        TEXT        NOT NULL,
    checksum    TEXT        NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(
    ))`;

// Platform files are tracked under their own prefix,
// so both folder can number from 001 without colliding.
async function applyAll(client: Client, dir: string, prefix: string) {
  const migrations = readMigrations(dir);

  const { rows } = await client.query<{ version: string; checksum: string }>(
    'SELECT version, checksum FROM public.schema_migrations',
  );
  const applied = new Map(rows.map(row => [row.version, row.checksum]));

  for (const migration of migrations) {
    const version = `${prefix}${migration.version}`;
    const seen = applied.get(version);

    // A reset replays these files,
    // so an edited migration would drift the demo schemas away from public.
    if (seen && seen !== migration.checksum) {
      throw new Error(`${migration.file} changed after it was applied.`);
    }

    if (seen) {
      console.log(`skip ${migration.file}`);
      continue;
    }

    await client.query(`BEGIN`);
    try {
      await client.query(migration.sql);
      await client.query(
        `INSERT INTO public.schema_migrations (version, name, checksum) VALUES ($1, $2, $3)`,
        [version, migration.name, migration.checksum],
      );
      await client.query('COMMIT');
      console.log(`apply ${migration.file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(TRACKING_TABLE);

    await applyAll(client, MIGRATIONS_DIR, '');
    await applyAll(client, PLATFORM_DIR, 'platform_');
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
