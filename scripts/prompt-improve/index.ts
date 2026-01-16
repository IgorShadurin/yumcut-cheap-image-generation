import path from 'node:path';
import { loadRepoEnv } from '../../src/shared/env';
import { runPromptImprove } from '../../src/prompt/improve';

interface CliArgs {
  prompt?: string;
  promptFile?: string;
  outputPath?: string;
  workspaceDir?: string;
  rolePromptPath?: string;
  model?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  apiKey?: string;
  help?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {};
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg.startsWith('--prompt=')) out.prompt = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--prompt-file=')) out.promptFile = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--output=')) out.outputPath = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--workspace=')) out.workspaceDir = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--role-prompt=')) out.rolePromptPath = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--model=')) out.model = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--reasoning=')) out.reasoningEffort = arg.split('=').slice(1).join('=') as CliArgs['reasoningEffort'];
    else if (arg.startsWith('--api-key=')) out.apiKey = arg.split('=').slice(1).join('=');
  }
  return out;
}

function printHelp(): void {
  console.log(`Usage:
  npm run prompt:improve -- --prompt="text" [options]
  tsx scripts/prompt-improve/index.ts --prompt="text" [options]

Options:
  --prompt=TEXT               Inline prompt text
  --prompt-file=PATH          Read prompt text from a file
  --output=PATH               Save improved prompt to file
  --workspace=DIR             Directory for request/response logs
  --role-prompt=PATH          System prompt override
  --model=ID                  OpenRouter model id (default: OPENROUTER_MODEL or openai/gpt-oss-120b)
  --reasoning=low|medium|high Reasoning effort (default: low)
  --api-key=KEY               Override OPENROUTER_API_KEY
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

  const result = await runPromptImprove({
    prompt: args.prompt ?? '',
    promptFile: args.promptFile,
    outputPath: args.outputPath,
    workspaceDir: args.workspaceDir,
    rolePromptPath: args.rolePromptPath,
    model: args.model,
    reasoningEffort: args.reasoningEffort,
    apiKey: args.apiKey,
    logger: (msg) => console.log(msg),
  });

  if (!args.outputPath) {
    console.log(result.text);
  } else {
    const resolved = path.resolve(args.outputPath);
    console.log(`Saved improved prompt to ${resolved}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
