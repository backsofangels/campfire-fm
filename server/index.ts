import express from 'express';
import cors from 'cors';
import open from 'open';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { bootstrap } from './lib/bootstrap';
import { configureCollectionsStore } from './lib/collectionsStore';
import { loadConfig } from './lib/config';
import { createAudioRouter } from './routes/audio';
import { createCollectionsRouter } from './routes/collections';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_DIST_DIR = path.resolve(SERVER_DIR, '..', 'app', 'dist');

async function main(): Promise<void> {
  await bootstrap();
  const config = loadConfig();
  configureCollectionsStore(config.collectionsFile);

  const app = express();

  if (process.env.NODE_ENV === 'development') {
    app.use(
      cors({
        origin: 'http://localhost:4321'
      })
    );
  }

  app.use(express.json());

  app.use('/audio', express.static(config.audioDir));
  app.use('/api/audio', createAudioRouter(config));
  app.use('/api/collections', createCollectionsRouter());

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Not found' });
  });

  app.use(express.static(APP_DIST_DIR));

  app.get(/^(?!\/api(?:\/|$)|\/audio(?:\/|$)).*/, (request, response) => {
    response.sendFile(path.join(APP_DIST_DIR, 'index.html'));
  });

  app.listen(config.port, config.host, async () => {
    const url = `http://${config.host}:${config.port}`;
    console.log(`Campfire.fm running at ${url}`);

    if (config.openBrowser) {
      const browserUrl = config.host === '0.0.0.0' ? `http://localhost:${config.port}` : url;
      try {
        await open(browserUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to open browser: ${message}`);
      }
    }
  });
}

void main();