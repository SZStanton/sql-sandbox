import { NextResponse } from 'next/server';
import { runInSandbox } from '@/lib/runInSandbox';

// pg needs TCP sockets, which the edge runtime doesn't have.
export const runtime = 'nodejs';

// Hardcoded until the manifest lands in step 3.
const DEMO_SQL = `SELECT department,
        count(*) AS headcount,
        round(avg(salary), 2) AS avg_salary
FROM users
WHERE department IS NOT NULL
GROUP BY department
ORDER BY headcount DESC`;

export async function POST() {
  const startedAT = performance.now();

  try {
    const result = await runInSandbox({
      schema: 'demo_1',
      sql: DEMO_SQL,
      mutates: false,
    });

    // The SQL comes from here, not the browser, so the code panel can't lie.
    return NextResponse.json({
      rows: result.rows,
      rowCount: result.rowCount,
      sql: DEMO_SQL,
      durationMs: Math.round(performance.now() - startedAT),
    });
  } catch (error) {
    // A Postgres error can name the schema, so only the log sees it.
    console.error(error);
    return NextResponse.json({ error: 'Query failed.' }, { status: 500 });
  }
}
