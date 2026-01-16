export interface DualPromptOptions {
  left: string;
  right: string;
  context?: string;
  stylePrompt?: string;
  systemPrompt?: string;
}

export interface DualImageOptions extends DualPromptOptions {
  apiKey: string;
  width: number;
  height: number;
  model?: string;
  steps?: number;
  cfgScale?: number;
  scheduler?: string;
  negativePrompt?: string;
  templateImageBytes?: Uint8Array;
  templateImageMime?: string;
  fetchImpl?: typeof fetch;
}

export interface DualImageResult {
  prompt: string;
  imageBytes: Uint8Array;
  responseJson: any;
}
