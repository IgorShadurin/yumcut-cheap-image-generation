import type { DualImageOptions, DualImageResult, DualPromptOptions } from '../interfaces/image';
import { requestRunwareImage } from './runware';
import { toDataUrl } from './bytes';
import { DEFAULT_NEGATIVE_PROMPT } from '../shared/constants';

const DEFAULT_SYSTEM_PROMPT = [
  'Create a single square image split vertically into two equal halves, without any borders or panel lines.',
  'Left half: render the LEFT prompt only.',
  'Right half: render the RIGHT prompt only.',
  'Do not blend the two halves; keep them independent.',
  'No text, captions, logos, or watermarks.',
  'Maintain consistent lighting and style across both halves.',
  'LEFT prompt: {{SENTENCE1}}',
  'RIGHT prompt: {{SENTENCE2}}',
  'Context (for understanding only, do not depict extra content): {{CONTEXT}}',
].join('\n');
const MAX_PROMPT_CHARS = 1900;

function applyTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out.trim();
}

export function buildDualPrompt(options: DualPromptOptions): string {
  const left = options.left.trim();
  const right = options.right.trim();
  const context = options.context?.trim() || '';
  const style = options.stylePrompt?.trim() || '';
  const systemTemplate = options.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;

  const vars = {
    SENTENCE1: left,
    SENTENCE2: right,
    CONTEXT: context,
  };

  const build = (includeStyle: boolean): string => {
    const parts: string[] = [];
    if (includeStyle && style) parts.push(applyTemplate(style, vars));
    if (systemTemplate) parts.push(applyTemplate(systemTemplate, vars));
    return parts.join('\n\n').trim();
  };

  let prompt = build(true);
  if (prompt.length > MAX_PROMPT_CHARS && style) {
    prompt = build(false);
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    prompt = prompt.slice(0, MAX_PROMPT_CHARS);
  }
  return prompt;
}

export async function generateDualImage(options: DualImageOptions): Promise<DualImageResult> {
  const prompt = buildDualPrompt({
    left: options.left,
    right: options.right,
    context: options.context,
    stylePrompt: options.stylePrompt,
    systemPrompt: options.systemPrompt,
  });

  const negativePrompt = options.negativePrompt?.trim() || DEFAULT_NEGATIVE_PROMPT;
  const referenceImages =
    options.templateImageBytes && options.templateImageBytes.length > 0
      ? [toDataUrl(options.templateImageBytes, options.templateImageMime || 'image/png')]
      : undefined;
  const model = options.model || 'runware:108@20';

  const result = await requestRunwareImage({
    apiKey: options.apiKey,
    prompt,
    width: options.width,
    height: options.height,
    model,
    steps: options.steps,
    cfgScale: options.cfgScale,
    scheduler: options.scheduler,
    negativePrompt,
    referenceImages,
    outputFormat: 'jpg',
    includeCost: true,
    fetchImpl: options.fetchImpl,
  });

  if (!result.imageBytes) {
    throw new Error('Runware did not return image data.');
  }

  return {
    prompt,
    imageBytes: result.imageBytes,
    responseJson: result.json,
  };
}
