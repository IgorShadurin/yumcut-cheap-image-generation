import path from 'node:path';
import fs from 'node:fs/promises';
import { ensureDir } from '../shared/fs';
import { createLLM } from '../llm';
import type { RunInstructionOptions, RunInstructionResult } from '../interfaces/instruction';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export async function runInstruction(options: RunInstructionOptions): Promise<RunInstructionResult> {
  const instruction = (options.instruction || '').trim();
  if (!instruction) throw new Error('runInstruction: instruction text cannot be empty.');

  const workspaceDir = options.workspaceDir ? path.resolve(options.workspaceDir) : undefined;
  if (workspaceDir) await ensureDir(workspaceDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const label = options.label ?? 'instruction';
  const model = options.model ?? DEFAULT_MODEL;

  const requestLogPath = workspaceDir ? path.join(workspaceDir, `${label}-request-${timestamp}.json`) : undefined;
  const responseLogPath = workspaceDir ? path.join(workspaceDir, `${label}-response-${timestamp}.json`) : undefined;

  if (requestLogPath) {
    const requestRecord = {
      timestamp,
      model,
      instruction,
      systemPrompt: options.systemPrompt,
      metadata: options.metadata ?? {},
    };
    await fs.writeFile(requestLogPath, JSON.stringify(requestRecord, null, 2), 'utf8');
  }

  const llm = createLLM({ model, apiKey: options.apiKey, reasoningEffort: options.reasoningEffort });
  options.logger?.(`Calling openrouter:${model}${options.reasoningEffort ? ` (reasoning: ${options.reasoningEffort})` : ''}...`);
  const llmResponse = await llm.getResponse({ prompt: instruction, system: options.systemPrompt });

  const text = (llmResponse.text || '').trim();
  if (!text) throw new Error('runInstruction: LLM returned an empty response.');

  if (responseLogPath) {
    const responseRecord = {
      timestamp,
      model,
      metadata: options.metadata ?? {},
      instruction,
      systemPrompt: options.systemPrompt,
      text,
      cost: llmResponse.cost,
      usage: llmResponse.usage,
      llmResponse,
    };
    await fs.writeFile(responseLogPath, JSON.stringify(responseRecord, null, 2), 'utf8');
  }

  return {
    text,
    llmResponse,
    requestLogPath,
    responseLogPath,
    model,
    workspaceDir,
  };
}
