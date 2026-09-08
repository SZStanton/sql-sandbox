import type { QueryResult, QueryResultRow } from 'pg';
import { appPool } from '@/lib/db';
import { assertKnownSchema } from '@/lib/sandbox/schemas';

// Long enough for the EXPLAIN demos, short enough to free the connection.
const STATEMENT_TIMEOUT = '5s';

type RunOptions = {
  schema: string;
  sql: string;
  params?: unknown[];
  mutates: boolean;
};

// One round trip instead of three. Every one is transaction scoped.
const SESSION_SETUP = `
  SELECT  set_config('search_path', $1, true),
          set_config('statement_timeout', $2, true),
          set_config('timezone', 'UTC', true)`;

export async function runInSandbox<T extends QueryResultRow>(
  options: RunOptions,
): Promise<QueryResult<T>> {
  const { schema, sql, params = [], mutates } = options;
  assertKnownSchema(schema);

  const client = await appPool.connect();

  try {
    await client.query('BEGIN');

    // Postgres refuses the write, so the manifest flag isn't just documentation.
    if (!mutates) {
      await client.query('SET TRANSACTION READ ONLY');
    }

    await client.query(SESSION_SETUP, [schema, STATEMENT_TIMEOUT]);

    const result = await client.query<T>(sql, params);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    // A dead connection makes ROLLBACK throw too, hiding the real error.
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    // A connection never released is gone for good, and four empties the pool.
    client.release();
  }
}
