import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

let loaded = false;

export function loadRepoEnv(): void {
  if (loaded) return;
  loaded = true;

  const cwdEnv = path.resolve(process.cwd(), '.env');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoEnv = path.resolve(__dirname, '..', '..', '.env');

  if (fs.existsSync(cwdEnv)) {
    dotenv.config({ path: cwdEnv });
    return;
  }

  if (fs.existsSync(repoEnv)) {
    dotenv.config({ path: repoEnv });
    return;
  }

  dotenv.config();
}
