import { access, constants, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const CAMPFIRE_DIR = path.join(os.homedir(), 'campfire');
const AUDIO_DIR = path.join(CAMPFIRE_DIR, 'audio');
const COLLECTIONS_FILE = path.join(CAMPFIRE_DIR, 'collections.yaml');
const CONFIG_FILE = path.join(CAMPFIRE_DIR, 'campfire.yml');

const DEFAULT_CONFIG = `port: 8080
host: 0.0.0.0
audioDir: ~/campfire/audio
collectionsFile: ~/campfire/collections.yaml
openBrowser: true
logLevel: info
`;

/**
 * Creates the default ~/campfire directory structure and starter files.
 */
export async function bootstrap(): Promise<void> {
  await ensureDirectory(CAMPFIRE_DIR);
  await ensureDirectory(AUDIO_DIR);
  await ensureFile(COLLECTIONS_FILE, 'collections: []\n');
  await ensureFile(CONFIG_FILE, DEFAULT_CONFIG);
}

async function ensureDirectory(dirPath: string): Promise<void> {
  if (await exists(dirPath)) {
    return;
  }

  await mkdir(dirPath, { recursive: true });
  console.log(`Created directory: ${dirPath}`);
}

async function ensureFile(filePath: string, content: string): Promise<void> {
  if (await exists(filePath)) {
    return;
  }

  await writeFile(filePath, content, 'utf8');
  console.log(`Created file: ${filePath}`);
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}