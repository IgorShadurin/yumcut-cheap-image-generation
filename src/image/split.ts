import sharp from 'sharp';

export async function splitImageInHalf(
  imageData: Uint8Array,
  options?: { logger?: (message: string) => void }
): Promise<[Uint8Array, Uint8Array]> {
  try {
    const imageBuffer = Buffer.from(imageData);
    const sourceImage = sharp(imageBuffer);
    const metadata = await sourceImage.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to get image dimensions');
    }

    const { width, height } = metadata;
    if (width <= 0 || height <= 0) {
      throw new Error(`Invalid dimensions: ${width}x${height}`);
    }

    const halfWidth = Math.floor(width / 2);
    if (halfWidth <= 0) {
      throw new Error(`Half width too small: ${halfWidth}`);
    }

    options?.logger?.(`Splitting ${width}x${height} into ${halfWidth}x${height} halves.`);

    const leftHalf = await sharp(imageBuffer)
      .extract({ left: 0, top: 0, width: halfWidth, height })
      .jpeg({ quality: 100, progressive: false, mozjpeg: true })
      .toBuffer();

    const rightHalf = await sharp(imageBuffer)
      .extract({ left: halfWidth, top: 0, width: width - halfWidth, height })
      .jpeg({ quality: 100, progressive: false, mozjpeg: true })
      .toBuffer();

    return [new Uint8Array(leftHalf), new Uint8Array(rightHalf)];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image splitting failed: ${error.message}`);
    }
    throw new Error('Image splitting failed: Unknown error occurred');
  }
}
