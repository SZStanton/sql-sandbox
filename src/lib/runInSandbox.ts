import type { QueryResult, QueryResultRow } from 'pg';
import { appPool } from '@/lib/db';
import { assertKnownSchema } from '@/lib/sandbox/schemas';

// Long enough for the EXPLAIN demos, short enough to free the connection.
const STATEMENT_TIMEOUT = '5s';

type RunOptions = {
  token: string;
  sql: string;
  params?: unknown[];
  mutates: boolean;
};

// Thrown when the cookie's token no longer matches a sandbox.
export class SandboxExpiredError extends Error {
  constructor() {
    super('Sandbox expired.');
    this.name = 'SandboxExpiredError';
  }
}

// One round trip instead of three. Every one is transaction scoped.
const SESSION_SETUP = `
  SELECT  set_config('search_path', $1, true),
          set_config('statement_timeout', $2, true),
          set_config('timezone', 'UTC', true)`;

export async function runInSandbox<T extends QueryResultRow>(
  options: RunOptions,
): Promise<QueryResult<T>> {
  const { token, sql, params = [], mutates } = options;

  const client = await appPool.connect();

  try {
    await client.query('BEGIN');

    // Validates the token and marks the visitor active, in one round trip.
    const session = await client.query<{ schema: string | null }>(
      'SELECT public.begin_sandbox_session($1) AS schema',
      [token],
    );

    const schema = session.rows[0]?.schema;
    if (!schema) {
      throw new SandboxExpiredError();
    }

    // Belt and braces. The function should only ever return a known schema.
    assertKnownSchema(schema);

    // Goes after the session touch, which is itself a write.
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
