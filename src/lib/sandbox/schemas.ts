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
] as const;

export type SandboxId = (typeof SANDBOXES)[number];

export function assertKnownSchema(schema: string): asserts schema is SandboxId {
  if (!SANDBOXES.includes(schema as SandboxId)) {
    throw new Error(`Unknown sandbox: ${schema}`);
  }
}
