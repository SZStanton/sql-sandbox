import { NextResponse, type NextRequest } from 'next/server';
import { runInSandbox, SandboxExpiredError } from '@/lib/runInSandbox';
import { getQuery } from '@/queries/manifest';
import { serialise, shapeError } from '@/lib/serialise';

// pg needs TCP sockets, which the edge runtime doesn't have.
export const runtime = 'nodejs';

// Frankfurt, matching the Neon region. A mismatch adds a round trip per query.
export const preferredRegion = 'fra1';

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const token = request.cookies.get('sandbox')?.value;
  if (!token) {
    return NextResponse.json({ error: 'No sandbox yet.' }, { status: 401 });
  }

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
      token,
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
    if (error instanceof SandboxExpiredError) {
      return NextResponse.json(
        { error: 'Your sandbox expired. Start a new one.' },
        { status: 401 },
      );
    }

    // A failed query is often the lesson, so the message goes back redacted.
    console.error(error);
    return NextResponse.json(
      { error: shapeError(error), sql: entry.sql },
      { status: 400 },
    );
  }
}
