import { types, type FieldDef, type QueryResult } from 'pg';

// A demo table nobody scrolls past, and a cell nobody reads to the end of.
const MAX_ROWS = 200;
const MAX_CELL_CHARS = 500;

// pg's builtins map names to numbers, so flip it to label each column.
const TYPE_NAMES = new Map<number, string>(
  Object.entries(types.builtins).map(([name, oid]) => [
    oid,
    name.toLowerCase(),
  ]),
);

// What Postgres calls these in its own docs, which is what a visitor expects.
const FRIENDLY: Record<string, string> = {
  int2: 'smallint',
  int4: 'integer',
  int8: 'bigint',
  float4: 'real',
  float8: 'double precision',
  bool: 'boolean',
};

// builtins have no array types, and the products page selects a text[].
const ARRAY_TYPES = new Map<number, string>([
  [1007, 'integer[]'],
  [1009, 'text[]'],
  [1016, 'bigint[]'],
  [1231, 'numeric[]'],
]);

export type Column = {
  name: string;
  type: string;
};

export type Serialised = {
  columns: Column[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
};

function labelFor(oid: number) {
  const array = ARRAY_TYPES.get(oid);
  if (array) return array;

  const name = TYPE_NAMES.get(oid);
  if (!name) return `oid ${oid}`;

  return FRIENDLY[name] ?? name;
}

function columnsFrom(fields: FieldDef[]): Column[] {
  return fields.map(field => ({
    name: field.name,
    type: labelFor(field.dataTypeID),
  }));
}

// JSON.stringify throws on a bigint and silently drops undefined.
function toJsonSafe(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return String(value);
  }

  // bytea arrives as a buffer, which stringifies into a wall of numbers.
  if (Buffer.isBuffer(value)) {
    return `\\x${value.toString('hex').slice(0, MAX_CELL_CHARS)}`;
  }

  if (typeof value === 'string' && value.length > MAX_CELL_CHARS) {
    return `${value.slice(0, MAX_CELL_CHARS)}...`;
  }

  if (Array.isArray(value)) return value.map(toJsonSafe);

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, toJsonSafe(inner)]),
    );
  }

  return value;
}

export function serialise(result: QueryResult): Serialised {
  const rows = result.rows.slice(0, MAX_ROWS).map(row => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, toJsonSafe(value)]),
    );
  });

  return {
    columns: columnsFrom(result.fields),
    rows,
    rowCount: result.rowCount ?? result.rows.length,
    truncated: result.rows.length > MAX_ROWS,
  };
}

// A Postgres error names the schema, which is another visitor's sandbox id.
export function shapeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Query failed.';
  return message.replace(/demo_\d+/g, 'your sandbox');
}
