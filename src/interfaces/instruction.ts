import type { LLMResponse } from './llm';

export interface RunInstructionOptions {
  instruction: string;
  systemPrompt?: string;
  workspaceDir?: string;
  model?: string;
  apiKey?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
  label?: string;
  logger?: (message: string) => void;
}

export interface RunInstructionResult {
  text: string;
  llmResponse: LLMResponse;
  requestLogPath?: string;
  responseLogPath?: string;
  model: string;
  workspaceDir?: string;
}
