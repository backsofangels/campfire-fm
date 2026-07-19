import { unlink, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import type { Config } from '../lib/config';
import { removeClipReferences } from '../lib/collectionsStore';

const SUPPORTED_AUDIO_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav', '.flac', '.m4a']);
const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

/**
 * Creates the audio routes for listing and uploading files.
 */
export function createAudioRouter(config: Config): Router {
  const router = Router();
  const upload = createUploadMiddleware(config.audioDir);

  router.get('/', async (_request: Request, response: Response) => {
    try {
      await mkdir(config.audioDir, { recursive: true });
      const audioFiles = await listAudioFiles(config.audioDir);
      response.status(200).json(audioFiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      response.status(500).json({ error: message });
    }
  });

  router.post('/upload', (request: Request, response: Response) => {
    upload.single('file')(request, response, (error) => {
      if (error) {
        response.status(400).json({ error: formatUploadError(error) });
        return;
      }

      const uploadedFile = request.file;

      if (!uploadedFile) {
        response.status(400).json({ error: 'No audio file provided.' });
        return;
      }

      const audioFile = buildAudioFile(uploadedFile.originalname);
      response.status(201).json(audioFile);
    });
  });

  router.delete('/:filename', async (request: Request, response: Response) => {
    const filename = sanitizeAudioFilename(request.params.filename);

    if (filename === null) {
      response.status(400).json({ error: 'Invalid audio filename.' });
      return;
    }

    try {
      await unlink(path.join(config.audioDir, filename));
      await removeClipReferences(filename);
      response.status(204).send();
    } catch (error) {
      if (isFileNotFoundError(error)) {
        response.status(404).json({ error: 'Audio file not found.' });
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      response.status(500).json({ error: message });
    }
  });

  return router;
}

function createUploadMiddleware(audioDir: string) {
  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, audioDir);
    },
    filename: (_request, file, callback) => {
      callback(null, file.originalname);
    }
  });

  return multer({
    storage,
    fileFilter: (_request, file, callback) => {
      if (!file.mimetype.startsWith('audio/')) {
        callback(new Error('Only audio files are allowed.'));
        return;
      }

      callback(null, true);
    },
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES
    }
  });
}

function formatUploadError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const uploadError = error as { code?: string; message?: string };

    if (uploadError.code === 'LIMIT_FILE_SIZE') {
      return 'Audio file is too large. Maximum size is 100MB.';
    }

    if (typeof uploadError.message === 'string' && uploadError.message.trim() !== '') {
      return uploadError.message;
    }
  }

  return 'Unable to upload audio file.';
}

async function listAudioFiles(audioDir: string) {
  const entries = await readdir(audioDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((filename) => SUPPORTED_AUDIO_EXTENSIONS.has(path.extname(filename).toLowerCase()))
    .sort((left, right) => left.localeCompare(right))
    .map((filename) => buildAudioFile(filename));
}

function buildAudioFile(filename: string) {
  return {
    id: path.basename(filename, path.extname(filename)),
    filename,
    url: `/audio/${filename}`
  };
}

function sanitizeAudioFilename(rawFilename: string): string | null {
  const filename = path.basename(decodeURIComponent(rawFilename));
  if (filename.trim() === '' || filename.includes('..')) {
    return null;
  }

  return filename;
}

function isFileNotFoundError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT';
}