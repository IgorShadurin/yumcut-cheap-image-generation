import * as path from 'node:path';

export function guessMimeByPath(p: string): string {
  const ext = path.extname(p).toLowerCase().replace('.', '');
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'application/octet-stream';
}

export function toDataUrl(bytes: Uint8Array, mime: string): string {
  const b64 = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  return `data:${mime};base64,${b64}`;
}
