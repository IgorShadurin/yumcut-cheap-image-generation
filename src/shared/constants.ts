export const DEFAULT_NEGATIVE_PROMPT = [
  'text',
  'watermark',
  'logo',
  'signature',
  'caption',
  'blurry',
  'low quality',
  'distorted',
  'extra limbs',
  'duplicate',
].join(', ');

export const DEFAULT_IMAGE_SIZE = { width: 1024, height: 1024 } as const;
