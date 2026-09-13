import { Client, escapeIdentifier, escapeLiteral } from 'pg';
import { readFileSync } from 'node:fs';
import { readMigrations } from './migrationFiles';
import { assertKnownSchema } from '../src/lib/sandbox/schemas';

process.loadEnvFile('.env.local');

const MIGRATIONS_DIR = 'db/migrations';
const SEED_FILE = 'db/seed.sql';

// Reads the app credentials from the URL so no password is ever committed.
async function ensureAppRole(client: Client, appUrl: string) {
  const url = new URL(appUrl);
  const role = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);

  const { rowCount } = await client.query(
    'SELECT 1 FROM pg_roles WHERE rolname = $1',
    [role],
  );

  const action = rowCount ? 'ALTER' : 'CREATE';
  await client.query(
    `${action} ROLE ${escapeIdentifier(role)} LOGIN PASSWORD ${escapeLiteral(password)}`,
  );

  // The registry and every visitor's token live in public.
  await client.query(
    `REVOKE ALL ON SCHEMA public FROM ${escapeIdentifier(role)}`,
  );

  // SET ROLE below needs the owner to be a member of the app role.
  await client.query(`GRANT ${escapeIdentifier(role)} TO CURRENT_USER`);

  console.log(`${action.toLowerCase()} role ${role}`);
  return role;
}

// Drops and rebuilds a sandbox from the same files public was built from.
async function provisionSchema(
  client: Client,
  schema: string,
  role: string,
  migrations: { file: string; sql: string }[],
  seed: string,
) {
  assertKnownSchema(schema);
  const name = escapeIdentifier(schema);
  const grantee = escapeIdentifier(role);

  await client.query('BEGIN');
  try {
    await client.query(`DROP SCHEMA IF EXISTS ${name} CASCADE`);
    await client.query(`CREATE SCHEMA ${name}`);

    // Provisioning wipes the schema, so any visitor holding it is evicted.
    await client.query(
      `INSERT INTO public.sandboxes (schema_name)
      VALUES ($1)
      ON CONFLICT (schema_name) DO UPDATE
      SET token = NULL, claimed_at = NULL, last_seen_at = NULL`,
      [schema],
    );

    // Granted by the schema owner, so it has to happen before the role switch.
    await client.query(`GRANT USAGE, CREATE ON SCHEMA ${name} TO ${grantee}`);

    // Unqualified names in the migrations now land in this schema.
    await client.query('SELECT set_config($1, $2, true)', [
      'search_path',
      schema,
    ]);

    // Owned by the app role, so it can run the index and ALTER TABLE demos.
    await client.query(`SET LOCAL ROLE ${grantee}`);

    for (const migration of migrations) {
      await client.query(migration.sql);
    }
    await client.query(seed);

    await client.query('COMMIT');
    console.log(`provision ${schema}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const appUrl = process.env.DATABASE_APP_URL;
  if (!connectionString || !appUrl) {
    throw new Error('DATABASE_URL and DATABASE_APP_URL must both be set.');
  }

  // One sandbox by default. The other 19 come later.
  const targets = process.argv.slice(2);
  const schemas = targets.length ? targets : ['demo_1'];

  const migrations = readMigrations(MIGRATIONS_DIR);
  const seed = readFileSync(SEED_FILE, 'utf8');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const role = await ensureAppRole(client, appUrl);
    for (const schema of schemas) {
      await provisionSchema(client, schema, role, migrations, seed);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
