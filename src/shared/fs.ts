import * as fsp from 'node:fs/promises';

export async function ensureDir(p: string): Promise<void> {
  await fsp.mkdir(p, { recursive: true }).catch(() => {});
}
