// The only files the code panel can ever read. Keyed by slug, so a request
// carries an opaque key and there is no path to sanitise.
export const SOURCE_FILES = {
  route: {
    label: 'The route handler',
    file: 'src/app/api/query/route.ts',
  },
  sandbox: {
    label: 'Your sandbox',
    file: 'src/lib/runInSandbox.ts',
  },
  serialise: {
    label: 'Result handling',
    file: 'src/lib/serialise.ts',
  },
  pool: {
    label: 'The connection pool',
    file: 'src/lib/db.ts',
  },
  types: {
    label: 'Type parsing',
    file: 'src/lib/pgTypes.ts',
  },
} as const;

export type SourceSlug = keyof typeof SOURCE_FILES;

// Object indexing lies about unknown keys, so check before reaching in.
export function getSourceFile(slug: string) {
  return Object.hasOwn(SOURCE_FILES, slug)
    ? SOURCE_FILES[slug as SourceSlug]
    : undefined;
}
