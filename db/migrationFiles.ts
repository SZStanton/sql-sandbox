import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Migration = {
  version: string;
  name: string;
  file: string;
  sql: string;
  checksum: string;
};

const FILENAME = /^(\d{3})_([a-z0-9_-]+)\.sql$/;

export function readMigrations(dir: string): Migration[] {
  const files = readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const migrations = files.map(file => {
    const match = FILENAME.exec(file);
    if (!match) {
      throw new Error(
        `Bad migration filename "${file}". Expected 001_name.sql`,
      );
    }

    const sql = readFileSync(join(dir, file), 'utf8');

    return {
      version: match[1],
      name: match[2],
      file,
      sql,
      checksum: createHash('sha256').update(sql).digest('hex'),
    };
  });

  // A duplicate or missing number usually means a bad merge.
  // It would quietly change what a sandbox reset replays.
  migrations.forEach((migration, i) => {
    const expected = String(i + 1).padStart(3, '0');
    if (migration.version !== expected) {
      throw new Error(
        `Migration numbering breaks at "${migration.file}". Expected ${expected}.`,
      );
    }
  });

  return migrations;
}
