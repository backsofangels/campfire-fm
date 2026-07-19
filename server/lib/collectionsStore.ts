import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import type { Collection, CollectionsFile } from '../../types';

const DEFAULT_COLLECTIONS_FILE = path.join(process.cwd(), 'campfire', 'collections.yaml');
const EMPTY_COLLECTIONS_FILE: CollectionsFile = { collections: [] };

let collectionsFilePath = DEFAULT_COLLECTIONS_FILE;

/**
 * Sets the YAML file used by the collections store.
 */
export function configureCollectionsStore(filePath: string): void {
  collectionsFilePath = filePath;
}

/**
 * Reads and parses the collections YAML file.
 */
export async function readCollections(): Promise<CollectionsFile> {
  try {
    const fileContent = await readFile(collectionsFilePath, 'utf8');
    const parsed = yaml.load(fileContent);

    if (parsed == null || typeof parsed !== 'object') {
      return EMPTY_COLLECTIONS_FILE;
    }

    const collectionsFile = parsed as Partial<CollectionsFile>;
    const collections = Array.isArray(collectionsFile.collections) ? collectionsFile.collections.filter(isCollection) : [];

    return { collections };
  } catch (error) {
    logCollectionsError('read', error);
    return EMPTY_COLLECTIONS_FILE;
  }
}

/**
 * Serializes and writes the collections YAML file.
 */
export async function writeCollections(data: CollectionsFile): Promise<void> {
  try {
    const yamlContent = yaml.dump(data, { lineWidth: -1 });
    await writeFile(collectionsFilePath, yamlContent, 'utf8');
  } catch (error) {
    logCollectionsError('write', error);
    throw error;
  }
}

/**
 * Removes all clips that reference the provided audio file name from every collection.
 */
export async function removeClipReferences(fileName: string): Promise<void> {
  const collectionsFile = await readCollections();
  const normalizedFileName = normalizeClipFileName(fileName);
  const nextCollections = collectionsFile.collections.map((collection) => ({
    ...collection,
    clips: collection.clips.filter((clip) => normalizeClipFileName(clip.file) !== normalizedFileName)
  }));

  await writeCollections({ collections: nextCollections });
}

function logCollectionsError(action: 'read' | 'write', error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to ${action} collections file ${collectionsFilePath}: ${message}`);
}

function isCollection(value: unknown): value is Collection {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const collection = value as Partial<Collection>;
  return typeof collection.id === 'string' && typeof collection.name === 'string' && Array.isArray(collection.clips);
}

function normalizeClipFileName(fileName: string): string {
  return path.basename(fileName);
}