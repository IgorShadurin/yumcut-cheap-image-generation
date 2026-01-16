export interface RunwareTextToImageParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  scheduler?: string;
  negativePrompt?: string;
  includeCost?: boolean;
  checkNSFW?: boolean;
  loras?: Array<{ model: string; weight?: number }>; 
  outputFormat?: 'jpg' | 'png' | 'webp';
  referenceImages?: string[];
}

export interface RunwareRequestOptions extends RunwareTextToImageParams {
  apiKey: string;
  endpoint?: string;
  fetchImpl?: typeof fetch;
}

export interface RunwareImageResult {
  json: any;
  imageBytes?: Uint8Array;
}
