import type { LLMProvider } from '../interfaces/llm';
import { OpenRouterLLM } from './openrouter';

export interface CreateLLMOptions {
  model: string;
  apiKey?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export function createLLM(options: CreateLLMOptions): LLMProvider {
  return new OpenRouterLLM(options.model, options.apiKey, options.reasoningEffort);
}
