import fs from 'node:fs/promises';
import path from 'node:path';
import { runInstruction } from './instruction-runner';
import { ensureDir } from '../shared/fs';
import type { PromptImproveOptions, PromptImproveResult } from '../interfaces/prompt';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_REASONING: 'low' | 'medium' | 'high' = 'low';
const DEFAULT_LABEL = 'prompt-improve';

const DEFAULT_ROLE_PROMPT =
  'You are an elite prompt engineer. Improve user prompts to be vivid, specific, and ready for creative generation. Return only the improved prompt.';

export async function runPromptImprove(options: PromptImproveOptions): Promise<PromptImproveResult> {
  const promptText = await resolvePromptText(options);
  const systemPrompt = await resolveSystemPrompt(options.rolePromptPath);

  const workspaceDir = options.workspaceDir ? path.resolve(options.workspaceDir) : undefined;
  if (workspaceDir) await ensureDir(workspaceDir);

  const model = (options.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL).trim();
  const reasoningEffort = options.reasoningEffort ?? DEFAULT_REASONING;

  const runResult = await runInstruction({
    instruction: promptText,
    systemPrompt,
    workspaceDir,
    model,
    reasoningEffort,
    metadata: options.metadata,
    label: options.label ?? DEFAULT_LABEL,
    logger: options.logger,
    apiKey: options.apiKey,
  });

  let resolvedOutputPath: string | undefined;
  if (options.outputPath) {
    resolvedOutputPath = path.resolve(options.outputPath);
    await ensureDir(path.dirname(resolvedOutputPath));
    await fs.writeFile(resolvedOutputPath, runResult.text, 'utf8');
  }

  return {
    text: runResult.text,
    llmResponse: runResult.llmResponse,
    outputPath: resolvedOutputPath,
    requestLogPath: runResult.requestLogPath,
    responseLogPath: runResult.responseLogPath,
    model: runResult.model,
    workspaceDir: runResult.workspaceDir,
    systemPrompt,
  };
}

async function resolvePromptText(options: PromptImproveOptions): Promise<string> {
  const inline = (options.prompt ?? '').trim();
  if (inline) return inline;
  if (!options.promptFile) throw new Error('prompt:improve requires prompt text or a prompt file path.');
  const resolved = path.resolve(options.promptFile);
  const raw = await fs.readFile(resolved, 'utf8');
  const text = raw.trim();
  if (!text) throw new Error(`prompt:improve prompt file is empty: ${resolved}`);
  return text;
}

async function resolveSystemPrompt(rolePromptPath?: string): Promise<string> {
  if (!rolePromptPath) return DEFAULT_ROLE_PROMPT;
  const resolved = path.resolve(rolePromptPath);
  const raw = await fs.readFile(resolved, 'utf8');
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : DEFAULT_ROLE_PROMPT;
}
