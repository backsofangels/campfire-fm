import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import type { ClipConfig, Collection, CollectionsFile } from '../../types';
import { readCollections, writeCollections } from '../lib/collectionsStore';

/**
 * Creates the collections routes for CRUD operations.
 */
export function createCollectionsRouter(): Router {
  const router = createRouter();

  router.get('/', async (_request: Request, response: Response) => {
    const collectionsFile = await readCollections();
    response.status(200).json(collectionsFile.collections);
  });

  router.post('/', async (request: Request, response: Response) => {
    const body = request.body as Record<string, unknown>;
    const name = body.name;
    const clips = Array.isArray(body.clips) ? body.clips : [];

    if (typeof name !== 'string' || name.trim() === '') {
      response.status(400).json({ error: 'Field "name" is required.' });
      return;
    }

    if (!areValidClips(clips)) {
      response.status(400).json({ error: 'Field "clips" must be an array of clip objects.' });
      return;
    }

    const collectionsFile = await readCollections();
    const id = createUniqueCollectionId(name, collectionsFile.collections);
    const collection: Collection = {
      id,
      name: name.trim(),
      clips
    };

    const nextCollectionsFile: CollectionsFile = {
      collections: [...collectionsFile.collections, collection]
    };

    await writeCollections(nextCollectionsFile);
    response.status(201).json(collection);
  });

  router.put('/:id', async (request: Request, response: Response) => {
    const collectionId = request.params.id;
    const body = request.body as Record<string, unknown>;
    const collectionsFile = await readCollections();
    const collectionIndex = collectionsFile.collections.findIndex((collection) => collection.id === collectionId);

    if (collectionIndex === -1) {
      response.status(404).json({ error: 'Collection not found.' });
      return;
    }

    const currentCollection = collectionsFile.collections[collectionIndex];
    const nextName = body.name;
    const nextClips = body.clips;

    if (nextName !== undefined && (typeof nextName !== 'string' || nextName.trim() === '')) {
      response.status(400).json({ error: 'Field "name" must be a non-empty string.' });
      return;
    }

    if (nextClips !== undefined && (!Array.isArray(nextClips) || !areValidClips(nextClips))) {
      response.status(400).json({ error: 'Field "clips" must be an array of clip objects.' });
      return;
    }

    const updatedCollection: Collection = {
      ...currentCollection,
      name: typeof nextName === 'string' ? nextName.trim() : currentCollection.name,
      clips: Array.isArray(nextClips) ? nextClips : currentCollection.clips
    };

    const updatedCollections = [...collectionsFile.collections];
    updatedCollections[collectionIndex] = updatedCollection;

    await writeCollections({ collections: updatedCollections });
    response.status(200).json(updatedCollection);
  });

  router.delete('/:id', async (request: Request, response: Response) => {
    const collectionId = request.params.id;
    const collectionsFile = await readCollections();
    const nextCollections = collectionsFile.collections.filter((collection) => collection.id !== collectionId);

    if (nextCollections.length === collectionsFile.collections.length) {
      response.status(404).json({ error: 'Collection not found.' });
      return;
    }

    await writeCollections({ collections: nextCollections });
    response.status(204).send();
  });

  return router;
}

function createUniqueCollectionId(name: string, collections: Collection[]): string {
  const baseId = slugify(name);
  let candidateId = baseId;
  let suffix = 2;

  while (collections.some((collection) => collection.id === candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return candidateId;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function areValidClips(clips: unknown[]): clips is ClipConfig[] {
  return clips.every((clip) => {
    if (typeof clip !== 'object' || clip === null) {
      return false;
    }

    const candidateClip = clip as Partial<ClipConfig>;
    return (
      typeof candidateClip.file === 'string' &&
      candidateClip.file.trim() !== '' &&
      typeof candidateClip.loop === 'boolean' &&
      typeof candidateClip.defaultVolume === 'number' &&
      Number.isFinite(candidateClip.defaultVolume)
    );
  });
}