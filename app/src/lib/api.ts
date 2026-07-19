import type { AudioFile, ClipConfig, Collection } from '../../../types';

const BASE = import.meta.env.DEV ? 'http://localhost:8080' : '';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed.' }));
    throw new Error(typeof errorBody.error === 'string' ? errorBody.error : 'Request failed.');
  }

  return response.json() as Promise<T>;
}

/**
 * Fetches the audio file index from the local server.
 */
export async function getAudio(): Promise<AudioFile[]> {
  const response = await fetch(`${BASE}/api/audio`);
  return parseResponse<AudioFile[]>(response);
}

/**
 * Fetches all collections from the local server.
 */
export async function getCollections(): Promise<Collection[]> {
  const response = await fetch(`${BASE}/api/collections`);
  return parseResponse<Collection[]>(response);
}

/**
 * Creates a new collection on the local server.
 */
export async function createCollection(name: string, clips: ClipConfig[] = []): Promise<Collection> {
  const response = await fetch(`${BASE}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, clips })
  });

  return parseResponse<Collection>(response);
}

/**
 * Updates an existing collection on the local server.
 */
export async function updateCollection(id: string, data: Partial<Collection>): Promise<Collection> {
  const response = await fetch(`${BASE}/api/collections/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return parseResponse<Collection>(response);
}

/**
 * Deletes a collection on the local server.
 */
export async function deleteCollection(id: string): Promise<void> {
  const response = await fetch(`${BASE}/api/collections/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    await parseResponse<unknown>(response);
  }
}

/**
 * Uploads a file to the local server and reports upload progress when available.
 */
export function uploadAudio(file: File, onProgress?: (pct: number) => void): Promise<AudioFile> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${BASE}/api/audio/upload`);
    request.responseType = 'json';

    request.upload.onprogress = (event) => {
      if (!onProgress) {
        return;
      }

      const percent = event.lengthComputable ? Math.round((event.loaded / event.total) * 100) : 0;
      onProgress(percent);
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response as AudioFile);
        return;
      }

      const response = request.response as { error?: string } | null;
      const errorMessage = typeof response?.error === 'string' ? response.error : 'Upload failed.';
      reject(new Error(errorMessage));
    };

    request.onerror = () => reject(new Error('Upload failed.'));

    const formData = new FormData();
    formData.append('file', file);
    request.send(formData);
  });
}