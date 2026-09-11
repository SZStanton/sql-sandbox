import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { getSourceFile } from '@/lib/sourceFiles';

// Reading from disk rules out the edge runtime.
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug') ?? '';

  const entry = getSourceFile(slug);
  if (!entry) {
    return NextResponse.json({ error: 'Unknown file.' }, { status: 404 });
  }

  try {
    // Read at request time, so the panel shows the file as it really is.
    const body = await readFile(join(process.cwd(), entry.file), 'utf8');

    return NextResponse.json({
      slug,
      label: entry.label,
      file: entry.file,
      body,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Could not read that file.' },
      { status: 500 },
    );
  }
}
