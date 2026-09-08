// The only schema names that may reach the database.
export const SANDBOXES = [
  'demo_1',
  'demo_2',
  'demo_3',
  'demo_4',
  'demo_5',
  'demo_6',
  'demo_7',
  'demo_8',
  'demo_9',
  'demo_10',
  'demo_11',
  'demo_12',
  'demo_13',
  'demo_14',
  'demo_15',
  'demo_16',
  'demo_17',
  'demo_18',
  'demo_19',
  'demo_20',
] as const;

export type SandboxId = (typeof SANDBOXES)[number];

// Narrows to SandboxId, so callers past this point are type safe too.
export function assertKnownSchema(schema: string): asserts schema is SandboxId {
  if (!SANDBOXES.includes(schema as SandboxId)) {
    throw new Error(`Unknown sandbox: ${schema}`);
  }
}
