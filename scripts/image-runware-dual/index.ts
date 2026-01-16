import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRepoEnv } from '../../src/shared/env';
import { ensureDir } from '../../src/shared/fs';
import { DEFAULT_IMAGE_SIZE } from '../../src/shared/constants';
import { generateDualImage } from '../../src/image/dual';
import { splitImageInHalf } from '../../src/image/split';
import { runPromptImprove } from '../../src/prompt/improve';
import { guessMimeByPath } from '../../src/image/bytes';

interface CliArgs {
  left?: string;
  right?: string;
  leftFile?: string;
  rightFile?: string;
  context?: string;
  contextFile?: string;
  stylePromptPath?: string;
  systemPromptPath?: string;
  negativePromptPath?: string;
  templateImagePath?: string;
  outDir?: string;
  size?: string;
  width?: string;
  height?: string;
  model?: string;
  steps?: string;
  cfgScale?: string;
  scheduler?: string;
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
    else if (arg.startsWith('--left=')) out.left = arg.split('=').slice(1).join('=');
    else if (arg === '--left') out.left = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.left;
    else if (arg.startsWith('--right=')) out.right = arg.split('=').slice(1).join('=');
    else if (arg === '--right') out.right = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.right;
    else if (arg.startsWith('--left-file=')) out.leftFile = arg.split('=').slice(1).join('=');
    else if (arg === '--left-file') out.leftFile = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.leftFile;
    else if (arg.startsWith('--right-file=')) out.rightFile = arg.split('=').slice(1).join('=');
    else if (arg === '--right-file') out.rightFile = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.rightFile;
    else if (arg.startsWith('--context=')) out.context = arg.split('=').slice(1).join('=');
    else if (arg === '--context') out.context = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.context;
    else if (arg.startsWith('--context-file=')) out.contextFile = arg.split('=').slice(1).join('=');
    else if (arg === '--context-file') out.contextFile = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.contextFile;
    else if (arg.startsWith('--style-prompt=')) out.stylePromptPath = arg.split('=').slice(1).join('=');
    else if (arg === '--style-prompt') out.stylePromptPath = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.stylePromptPath;
    else if (arg.startsWith('--system-prompt=')) out.systemPromptPath = arg.split('=').slice(1).join('=');
    else if (arg === '--system-prompt') out.systemPromptPath = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.systemPromptPath;
    else if (arg.startsWith('--negative-prompt-file=')) out.negativePromptPath = arg.split('=').slice(1).join('=');
    else if (arg === '--negative-prompt-file') out.negativePromptPath = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.negativePromptPath;
    else if (arg.startsWith('--template-image=')) out.templateImagePath = arg.split('=').slice(1).join('=');
    else if (arg === '--template-image') out.templateImagePath = argv[i + 1] && !argv[i + 1]!.startsWith('--') ? (argv[++i] as string) : out.templateImagePath;
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

async function readBytesFromFile(maybePath?: string): Promise<Uint8Array | undefined> {
  if (!maybePath) return undefined;
  const resolved = path.resolve(maybePath);
  const raw = await fs.readFile(resolved);
  return new Uint8Array(raw);
}

function printHelp(): void {
  console.log(`Usage:
  npm run image:runware:dual -- --left="..." --right="..." [options]
  tsx scripts/image-runware-dual/index.ts --left="..." --right="..." [options]

Options:
  --left=TEXT                 Left prompt text
  --right=TEXT                Right prompt text
  --left-file=PATH            Read left prompt from file
  --right-file=PATH           Read right prompt from file
  --context=TEXT              Optional context (not drawn)
  --context-file=PATH         Read context from file
  --style-prompt=PATH         Style prompt text file (prepended)
  --system-prompt=PATH        System prompt template file
  --negative-prompt-file=PATH Negative prompt override
  --template-image=PATH       Template image file (default: built-in red/blue template)
  --out-dir=DIR               Output directory (default: ./output/runware-dual-<timestamp>)
  --size=WxH                  Output size (default: 1024x1024)
  --width=W --height=H         Alternative to --size
  --model=ID                  Runware model id (default: runware:108@20)
  --steps=N                   Sampling steps
  --cfg=N                     Guidance scale
  --scheduler=NAME            Scheduler (default: UniPC)
  --improve                   Improve prompts via OpenRouter before rendering
  --no-improve                Skip prompt improvement (default)
  --improve-model=ID          OpenRouter model id for improvement
  --improve-role-prompt=PATH  System prompt override for improvement
  --runware-api-key=KEY       Override RUNWARE_API_KEY
  --help                      Show this message
`);
}

async function resolvePromptText(inline?: string, filePath?: string, label = 'prompt'): Promise<string> {
  if (inline && inline.trim()) return inline.trim();
  if (filePath) {
    const text = await readTextFromFile(filePath);
    if (text) return text;
  }
  throw new Error(`Missing ${label}. Provide --${label}=TEXT or --${label}-file=PATH.`);
}

function validatePromptLength(prompt: string, label: string): void {
  const trimmed = prompt.trim();
  if (trimmed.length < 2) {
    throw new Error(`${label} prompt is too short. Wrap text in quotes, e.g. --${label}=\"A cozy cafe...\"`);
  }
  if (trimmed.length > 1900) {
    throw new Error(`${label} prompt is too long (${trimmed.length}). Max is 1900 characters.`);
  }
}

async function main(): Promise<void> {
  loadRepoEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const defaultTemplatePath = path.resolve(__dirname, '..', '..', 'assets', 'templates', 'red_blue_split-2-images.png');
  const defaultSystemPromptPath = path.resolve(__dirname, '..', '..', 'assets', 'prompts', 'dual-image-system.txt');
  const defaultStylePromptPath = path.resolve(__dirname, '..', '..', 'assets', 'prompts', 'dual-image-style.txt');

  const apiKey = (args.runwareApiKey || process.env.RUNWARE_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('RUNWARE_API_KEY is required. Set it in .env or pass --runware-api-key.');
  }

  const left = await resolvePromptText(args.left, args.leftFile, 'left');
  const right = await resolvePromptText(args.right, args.rightFile, 'right');
  validatePromptLength(left, 'left');
  validatePromptLength(right, 'right');
  const context = args.context?.trim() || (await readTextFromFile(args.contextFile));
  const stylePrompt = await readTextFromFile(args.stylePromptPath || defaultStylePromptPath);
  const systemPrompt = await readTextFromFile(args.systemPromptPath || defaultSystemPromptPath);
  const negativePrompt = await readTextFromFile(args.negativePromptPath);
  const templateImagePath = args.templateImagePath || defaultTemplatePath;
  const templateImageBytes = await readBytesFromFile(templateImagePath);
  const templateImageMime = templateImagePath ? guessMimeByPath(templateImagePath) : undefined;
  if (!templateImageBytes || templateImageBytes.length === 0) {
    throw new Error(`Template image not found or empty: ${templateImagePath}`);
  }
  const { width, height } = parseSize(args.size, args.width, args.height);

  const outDir = path.resolve(
    args.outDir || path.join(process.cwd(), 'output', `runware-dual-${Date.now()}`)
  );
  await ensureDir(outDir);

  let leftPrompt = left;
  let rightPrompt = right;

  if (args.improve) {
    const improveModel = args.improveModel || process.env.OPENROUTER_MODEL;
    const rolePromptPath = args.improveRolePrompt;
    console.log('Improving left prompt...');
    const leftResult = await runPromptImprove({
      prompt: leftPrompt,
      model: improveModel,
      rolePromptPath,
      logger: (msg) => console.log(msg),
    });
    leftPrompt = leftResult.text;

    console.log('Improving right prompt...');
    const rightResult = await runPromptImprove({
      prompt: rightPrompt,
      model: improveModel,
      rolePromptPath,
      logger: (msg) => console.log(msg),
    });
    rightPrompt = rightResult.text;
  }

  const dualResult = await generateDualImage({
    apiKey,
    left: leftPrompt,
    right: rightPrompt,
    context: context || undefined,
    stylePrompt: stylePrompt || undefined,
    systemPrompt: systemPrompt || undefined,
    width,
    height,
    model: args.model,
    steps: args.steps && Number.isFinite(Number(args.steps)) ? Number(args.steps) : undefined,
    cfgScale: args.cfgScale && Number.isFinite(Number(args.cfgScale)) ? Number(args.cfgScale) : undefined,
    scheduler: args.scheduler,
    negativePrompt: negativePrompt || undefined,
    templateImageBytes: templateImageBytes,
    templateImageMime: templateImageMime,
  });

  const fullPath = path.join(outDir, 'dual.jpg');
  await fs.writeFile(fullPath, dualResult.imageBytes);

  const [leftBytes, rightBytes] = await splitImageInHalf(dualResult.imageBytes);
  const leftPath = path.join(outDir, 'left.jpg');
  const rightPath = path.join(outDir, 'right.jpg');
  await fs.writeFile(leftPath, leftBytes);
  await fs.writeFile(rightPath, rightBytes);

  const metadata = {
    width,
    height,
    leftPrompt: leftPrompt,
    rightPrompt: rightPrompt,
    context: context || undefined,
    promptSent: dualResult.prompt,
    model: args.model ?? 'runware:108@20',
  };
  await fs.writeFile(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`Saved outputs to ${outDir}`);
  console.log(`- ${fullPath}`);
  console.log(`- ${leftPath}`);
  console.log(`- ${rightPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
