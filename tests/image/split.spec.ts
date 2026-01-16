import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { splitImageInHalf } from '../../src/image/split';

async function createHalf(width: number, height: number, color: string): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  }).png().toBuffer();
}

describe('splitImageInHalf', () => {
  it('splits an image into two equal halves', async () => {
    const width = 10;
    const height = 4;
    const left = await createHalf(width, height, '#ff0000');
    const right = await createHalf(width / 2, height, '#0000ff');

    const combined = await sharp(left)
      .composite([{ input: right, left: width / 2, top: 0 }])
      .jpeg()
      .toBuffer();

    const [leftHalf, rightHalf] = await splitImageInHalf(new Uint8Array(combined));
    const leftMeta = await sharp(leftHalf).metadata();
    const rightMeta = await sharp(rightHalf).metadata();

    expect(leftMeta.width).toBe(width / 2);
    expect(leftMeta.height).toBe(height);
    expect(rightMeta.width).toBe(width / 2);
    expect(rightMeta.height).toBe(height);
  });
});
