import type { LLMResponse } from './llm';

export interface PromptImproveOptions {
  prompt: string;
  promptFile?: string;
  rolePromptPath?: string;
  model?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  workspaceDir?: string;
  outputPath?: string;
  label?: string;
  apiKey?: string;
  logger?: (message: string) => void;
  metadata?: Record<string, unknown>;
}

export interface PromptImproveResult {
  text: string;
  llmResponse: LLMResponse;
  outputPath?: string;
  requestLogPath?: string;
  responseLogPath?: string;
  model: string;
  workspaceDir?: string;
  systemPrompt: string;
}
