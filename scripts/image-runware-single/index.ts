import fs from 'node:fs/promises';
import path from 'node:path';
import { loadRepoEnv } from '../../src/shared/env';
import { ensureDir } from '../../src/shared/fs';
import { DEFAULT_IMAGE_SIZE } from '../../src/shared/constants';
import { requestRunwareImage, defaultRunwarePromptPayload } from '../../src/image/runware';
import { runPromptImprove } from '../../src/prompt/improve';
import { guessMimeByPath, toDataUrl } from '../../src/image/bytes';

interface CliArgs {
  prompt?: string;
  promptFile?: string;
  outDir?: string;
  size?: string;
  width?: string;
  height?: string;
  model?: string;
  steps?: string;
  cfgScale?: string;
  scheduler?: string;
  negativePromptFile?: string;
  referenceImage?: string;
  improve?: boolean;
  improveModel?: string;
  improveRolePrompt?: string;
  runwareApiKey?: string;
  help?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--improve') out.improve = true;
    else if (arg === '--no-improve') out.improve = false;
    else if (arg.startsWith('--prompt=')) out.prompt = arg.split('=').slice(1).join('=');
    else if (arg === '--prompt') out.prompt = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.prompt;
    else if (arg.startsWith('--prompt-file=')) out.promptFile = arg.split('=').slice(1).join('=');
    else if (arg === '--prompt-file') out.promptFile = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.promptFile;
    else if (arg.startsWith('--out-dir=')) out.outDir = arg.split('=').slice(1).join('=');
    else if (arg === '--out-dir') out.outDir = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.outDir;
    else if (arg.startsWith('--size=')) out.size = arg.split('=').slice(1).join('=');
    else if (arg === '--size') out.size = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.size;
    else if (arg.startsWith('--width=')) out.width = arg.split('=').slice(1).join('=');
    else if (arg === '--width') out.width = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.width;
    else if (arg.startsWith('--height=')) out.height = arg.split('=').slice(1).join('=');
    else if (arg === '--height') out.height = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.height;
    else if (arg.startsWith('--model=')) out.model = arg.split('=').slice(1).join('=');
    else if (arg === '--model') out.model = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.model;
    else if (arg.startsWith('--steps=')) out.steps = arg.split('=').slice(1).join('=');
    else if (arg === '--steps') out.steps = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.steps;
    else if (arg.startsWith('--cfg=')) out.cfgScale = arg.split('=').slice(1).join('=');
    else if (arg === '--cfg') out.cfgScale = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.cfgScale;
    else if (arg.startsWith('--scheduler=')) out.scheduler = arg.split('=').slice(1).join('=');
    else if (arg === '--scheduler') out.scheduler = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.scheduler;
    else if (arg.startsWith('--negative-prompt-file=')) out.negativePromptFile = arg.split('=').slice(1).join('=');
    else if (arg === '--negative-prompt-file') out.negativePromptFile = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.negativePromptFile;
    else if (arg.startsWith('--reference-image=')) out.referenceImage = arg.split('=').slice(1).join('=');
    else if (arg === '--reference-image') out.referenceImage = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.referenceImage;
    else if (arg.startsWith('--improve-model=')) out.improveModel = arg.split('=').slice(1).join('=');
    else if (arg === '--improve-model') out.improveModel = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.improveModel;
    else if (arg.startsWith('--improve-role-prompt=')) out.improveRolePrompt = arg.split('=').slice(1).join('=');
    else if (arg === '--improve-role-prompt') out.improveRolePrompt = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.improveRolePrompt;
    else if (arg.startsWith('--runware-api-key=')) out.runwareApiKey = arg.split('=').slice(1).join('=');
    else if (arg === '--runware-api-key') out.runwareApiKey = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.runwareApiKey;
  }
  return out;
}

function parseSize(size?: string, width?: string, height?: string): { width: number; height: number } {
  if (size) {
    const m = size.trim().toLowerCase().match(/^(\d+)x(\d+)$/);
    if (!m) throw new Error(`Invalid --size value "${size}". Use WIDTHxHEIGHT.`);
    return validateSize(Number(m[1]), Number(m[2]));
  }
  if (width || height) {
    if (!width || !height) throw new Error('Both --width and --height must be provided together.');
    return validateSize(Number(width), Number(height));
  }
  return { ...DEFAULT_IMAGE_SIZE };
}

function validateSize(width: number, height: number): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid size ${width}x${height}. Width/height must be positive numbers.`);
  }
  return { width: Math.floor(width), height: Math.floor(height) };
}

async function readTextFromFile(maybePath?: string): Promise<string | undefined> {
  if (!maybePath) return undefined;
  const resolved = path.resolve(maybePath);
  const raw = await fs.readFile(resolved, 'utf8');
  return raw.trim();
}

async function resolvePromptText(inline?: string, filePath?: string): Promise<string> {
  if (inline && inline.trim()) return inline.trim();
  if (filePath) {
    const text = await readTextFromFile(filePath);
    if (text) return text;
  }
  throw new Error('Missing prompt. Provide --prompt="..." or --prompt-file=PATH.');
}

function validatePromptLength(prompt: string): void {
  const trimmed = prompt.trim();
  if (trimmed.length < 2) {
    throw new Error('Prompt is too short. Wrap text in quotes, e.g. --prompt="A cozy cafe..."');
  }
  if (trimmed.length > 1900) {
    throw new Error(`Prompt is too long (${trimmed.length}). Max is 1900 characters.`);
  }
}

function printHelp(): void {
  console.log(`Usage:
  npm run image:runware:single -- --prompt="text" [options]
  tsx scripts/image-runware-single/index.ts --prompt="text" [options]

Options:
  --prompt=TEXT               Prompt text
  --prompt-file=PATH          Read prompt text from a file
  --out-dir=DIR               Output directory (default: ./output/runware-single-<timestamp>)
  --size=WxH                  Output size (default: 1024x1024)
  --width=W --height=H         Alternative to --size
  --model=ID                  Runware model id (default: runware:108@1, or runware:108@20 when reference image is provided)
  --steps=N                   Sampling steps
  --cfg=N                     Guidance scale
  --scheduler=NAME            Scheduler (default: UniPC)
  --negative-prompt-file=PATH Negative prompt override
  --reference-image=PATH      Optional reference image for Qwen Image Edit
  --improve                   Improve prompt via OpenRouter (default)
  --no-improve                Skip prompt improvement
  --improve-model=ID          OpenRouter model id for improvement
  --improve-role-prompt=PATH  System prompt override for improvement
  --runware-api-key=KEY       Override RUNWARE_API_KEY
  --help                      Show this message
`);
}

async function main(): Promise<void> {
  loadRepoEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const apiKey = (args.runwareApiKey || process.env.RUNWARE_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('RUNWARE_API_KEY is required. Set it in .env or pass --runware-api-key.');
  }

  const prompt = await resolvePromptText(args.prompt, args.promptFile);
  validatePromptLength(prompt);

  const negativePrompt = await readTextFromFile(args.negativePromptFile);
  const referenceImagePath = args.referenceImage ? path.resolve(args.referenceImage) : undefined;
  const referenceImageBytes = referenceImagePath ? await fs.readFile(referenceImagePath) : undefined;
  const referenceImageDataUrl = referenceImageBytes
    ? toDataUrl(new Uint8Array(referenceImageBytes), guessMimeByPath(referenceImagePath || ''))
    : undefined;
  const { width, height } = parseSize(args.size, args.width, args.height);

  const outDir = path.resolve(
    args.outDir || path.join(process.cwd(), 'output', `runware-single-${Date.now()}`)
  );
  await ensureDir(outDir);

  const improve = args.improve !== false;
  const improveModel = args.improveModel || process.env.OPENROUTER_MODEL;

  await fs.writeFile(path.join(outDir, 'prompt.txt'), prompt, 'utf8');

  let finalPrompt = prompt;
  if (improve) {
    const improveResult = await runPromptImprove({
      prompt,
      model: improveModel,
      rolePromptPath: args.improveRolePrompt,
      workspaceDir: path.join(outDir, 'prompt-improve-logs'),
      logger: (msg) => console.log(msg),
    });
    finalPrompt = improveResult.text;
    await fs.writeFile(path.join(outDir, 'prompt-improved.txt'), finalPrompt, 'utf8');
  }

  validatePromptLength(finalPrompt);

  const model = args.model || (referenceImageDataUrl ? 'runware:108@20' : 'runware:108@1');
  const steps = args.steps && Number.isFinite(Number(args.steps)) ? Number(args.steps) : undefined;
  const cfgScale = args.cfgScale && Number.isFinite(Number(args.cfgScale)) ? Number(args.cfgScale) : undefined;

  const requestPayload = defaultRunwarePromptPayload({
    prompt: finalPrompt,
    model,
    width,
    height,
    steps,
    cfgScale,
    scheduler: args.scheduler,
    negativePrompt: negativePrompt || undefined,
    outputFormat: 'jpg',
    referenceImages: referenceImageDataUrl ? [referenceImageDataUrl] : undefined,
  });

  await fs.writeFile(path.join(outDir, 'runware-request.json'), JSON.stringify(requestPayload, null, 2), 'utf8');

  const result = await requestRunwareImage({
    apiKey,
    prompt: finalPrompt,
    model,
    width,
    height,
    steps,
    cfgScale,
    scheduler: args.scheduler,
    negativePrompt: negativePrompt || undefined,
    outputFormat: 'jpg',
    includeCost: true,
    referenceImages: referenceImageDataUrl ? [referenceImageDataUrl] : undefined,
  });

  await fs.writeFile(path.join(outDir, 'runware-response.json'), JSON.stringify(result.json, null, 2), 'utf8');

  if (!result.imageBytes) {
    throw new Error('Runware did not return image data.');
  }

  const imagePath = path.join(outDir, 'image.jpg');
  await fs.writeFile(imagePath, result.imageBytes);

  console.log(`Saved outputs to ${outDir}`);
  console.log(`- ${imagePath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
