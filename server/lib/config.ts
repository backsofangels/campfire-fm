import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';

export interface Config {
  port: number;
  host: string;
  audioDir: string;
  collectionsFile: string;
  openBrowser: boolean;
  logLevel: string;
}

const CONFIG_FILE = path.join(os.homedir(), 'campfire', 'campfire.yml');
const DEFAULT_CONFIG: Config = {
  port: 8080,
  host: '0.0.0.0',
  audioDir: '~/campfire/audio',
  collectionsFile: '~/campfire/collections.yaml',
  openBrowser: true,
  logLevel: 'info'
};

/**
 * Loads ~/campfire/campfire.yml and resolves the effective server config.
 */
export function loadConfig(): Config {
  try {
    const fileContent = readFileSync(CONFIG_FILE, 'utf8');
    const parsed = yaml.load(fileContent);

    if (parsed == null || typeof parsed !== 'object') {
      throw new Error('Config file must contain a YAML object.');
    }

    const rawConfig = parsed as Partial<Config>;
    return {
      port: normalizePort(rawConfig.port ?? DEFAULT_CONFIG.port),
      host: typeof rawConfig.host === 'string' && rawConfig.host.trim() !== '' ? rawConfig.host : DEFAULT_CONFIG.host,
      audioDir: resolvePath(rawConfig.audioDir ?? DEFAULT_CONFIG.audioDir),
      collectionsFile: resolvePath(rawConfig.collectionsFile ?? DEFAULT_CONFIG.collectionsFile),
      openBrowser: typeof rawConfig.openBrowser === 'boolean' ? rawConfig.openBrowser : DEFAULT_CONFIG.openBrowser,
      logLevel: typeof rawConfig.logLevel === 'string' && rawConfig.logLevel.trim() !== '' ? rawConfig.logLevel : DEFAULT_CONFIG.logLevel
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load config from ${CONFIG_FILE}: ${message}`);
    process.exit(1);
  }
}

function normalizePort(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 65535) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
      return parsed;
    }
  }

  return DEFAULT_CONFIG.port;
}

function resolvePath(inputPath: string): string {
  const resolvedHome = os.homedir();
  const expandedPath = inputPath.startsWith('~') ? inputPath.replace(/^~(?=$|[\\/])/, resolvedHome) : inputPath;
  return path.resolve(expandedPath);
}