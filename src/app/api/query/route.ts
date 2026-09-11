import { NextResponse } from 'next/server';
import { runInSandbox } from '@/lib/runInSandbox';
import { getQuery } from '@/queries/manifest';
import { serialise, shapeError } from '@/lib/serialise';

// pg needs TCP sockets, which the edge runtime doesn't have.
export const runtime = 'nodejs';

// Frankfurt, matching the Neon region. A mismatch adds a round trip per query.
export const preferredRegion = 'fra1';

// Hardcoded until the claim endpoint lands in step 4.
const SANDBOX = 'demo_1';

export async function POST(request: Request) {
  const startedAt = performance.now();

  // A malformed body is the caller's mistake, so 400 rather than 500.
  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Expected a JSON body.' },
      { status: 400 },
    );
  }

  const { id } = body;
  if (typeof id !== 'string') {
    return NextResponse.json({ error: 'Expected an id.' }, { status: 400 });
  }

  // An id that isn't in the manifest can never reach the database.
  const entry = getQuery(id);
  if (!entry) {
    return NextResponse.json({ error: 'Unknown query.' }, { status: 404 });
  }

  try {
    const result = await runInSandbox({
      schema: SANDBOX,
      sql: entry.sql,
      mutates: entry.mutates,
    });

    // Everything shown to the visitor comes from here, never from the request.
    return NextResponse.json({
      id: entry.id,
      title: entry.title,
      note: entry.note,
      sql: entry.sql,
      chart: entry.chart ?? null,
      ...serialise(result),
      durationMs: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    // A failed query is often the lesson, so the message goes back redacted.
    console.error(error);
    return NextResponse.json(
      { error: shapeError(error), sql: entry.sql },
      { status: 400 },
    );
  }
}
