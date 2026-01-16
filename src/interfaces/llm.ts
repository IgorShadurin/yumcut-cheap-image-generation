export interface LLMRequest {
  prompt: string;
  system?: string;
}

export interface LLMResponse {
  text: string;
  cost?: number | string;
  usage?: unknown;
  id?: string;
}

export interface LLMProvider {
  name: string;
  model: string;
  getResponse(request: LLMRequest): Promise<LLMResponse>;
}
