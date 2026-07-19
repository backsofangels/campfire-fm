# Campfire.fm

Campfire.fm is a browser-based soundboard for tabletop RPG sessions. It runs locally on a LAN machine, serves a static SPA, and keeps audio playback entirely on the client.

## Requirements

- Node.js 18 or newer
- A modern desktop or mobile browser
- A local machine or Raspberry Pi on the same LAN

## Install

```bash
git clone [<repo-url>](https://github.com/backsofangels/campfire-fm.git)
cd campfire-fm
npm install
```

## Development

```bash
npm run dev
```

This starts the Astro frontend and the Express server together.

## Build

```bash
npm run build
```

This builds the Astro frontend into `app/dist/`.

## Start

```bash
npm run start
```

The server loads its configuration from `~/campfire/campfire.yml`, serves the SPA, exposes `/api/*`, and serves audio files from `~/campfire/audio/`.

## Scripts

- `npm run dev` starts both app and server in watch mode
- `npm run build` builds the frontend
- `npm run start` starts the Express server
- `npm run typecheck` is present as a placeholder only
- `npm run lint` is present as a placeholder only

## First run

On the first start, Campfire creates the following files and folders in your home directory:

```text
~/campfire/
├── audio/
├── campfire.yml
└── collections.yaml
```

## Structure of `~/campfire/`

- `campfire.yml` contains the runtime configuration
- `audio/` contains uploaded sound files
- `collections.yaml` contains the collections shown in the sidebar

## Upload audio

Use the **Carica audio** button in the UI, or upload files with `multipart/form-data` to `POST /api/audio/upload`.

Supported file types include:

- `.mp3`
- `.ogg`
- `.wav`
- `.flac`
- `.m4a`

## Create collections

Use the **+ Nuova collezione** button in the sidebar. Collections are stored in `~/campfire/collections.yaml` and refreshed automatically in the UI through polling.

Each clip can be assigned to one existing collection from its card. Clips without a collection are treated as free.

## Play and stop

- Use **Play** / **Stop** on a single clip to control one sound
- Use **Play All** / **Stop All** on the collection panel to control the currently selected collection
- Use **Stop tutto** in the header to stop all active sounds

## Volume reset

Volumes are local to the browser session. Reload the page to reset sliders back to their YAML defaults.

## API

The local server exposes a small JSON API:

- `GET /api/audio`
- `POST /api/audio/upload`
- `GET /api/collections`
- `POST /api/collections`
- `PUT /api/collections/:id`
- `DELETE /api/collections/:id`

## Notes

- The UI unlocks audio only after the first explicit click/tap.
- Changes in `~/campfire/audio/` and `~/campfire/collections.yaml` are reflected automatically through polling.
- The clip card shows the assigned collection selector, loop toggle, and volume control.
- The sidebar is available on desktop and collapses into a horizontal collection bar on smaller screens.
- This project is intended for LAN use only.
