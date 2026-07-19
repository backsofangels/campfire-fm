# TASKS.md — Campfire.fm

> Piano di lavoro implementativo completo. I task sono organizzati in epiche sequenziali. Ogni task è autonomo, verificabile e fa riferimento esplicito a file, moduli e decisioni in `ARCHITECTURE.md` e `DECISIONS.md`.

> Stato del workspace attuale: il repo contiene solo documentazione. Prima di qualsiasi feature serve completare lo scaffolding minimo del monorepo, poi si può procedere con le epiche successive.

***

## Epica 0 — Setup repo e toolchain

### T-0.0 — Scaffolding minimo del monorepo
- Creare la struttura base del repo se mancante: `app/`, `server/`, `app/src/`, `app/src/components/`, `app/src/lib/`, `app/src/store/`, `app/src/pages/`, `server/lib/`, `server/routes/`.
- Creare `package.json` nella root con `workspaces` e script base, anche se inizialmente vuoto o incompleto.
- Creare `types.ts` nella root con i tipi condivisi minimi richiesti dalle epiche successive.
- Creare `tsconfig.base.json` nella root e i `tsconfig.json` di `app/` e `server/`.
- Creare `.gitignore` nella root se assente.
- Verificare che la struttura iniziale permetta di iniziare E1, E2, E3 ed E5 senza ulteriori passi di bootstrap.

### T-0.1 — Inizializzare il monorepo
- Eseguire `npm init` nella root.
- Configurare `workspaces` in `package.json` per `app/` e `server/`.
- Aggiungere `.gitignore` (escludere `dist/`, `node_modules/`, `*.local`).
- Inizializzare repo git con commit iniziale.

### T-0.2 — Setup TypeScript condiviso
- Creare `tsconfig.base.json` nella root con le opzioni comuni (`strict: true`, `target: ES2022`, `moduleResolution: bundler`).
- Creare `tsconfig.json` in `app/` che estende il base.
- Creare `tsconfig.json` in `server/` che estende il base.
- Aggiungere `types.ts` nella root con i tipi condivisi tra frontend e server:

```typescript
// types.ts (root)
export interface AudioFile {
  id: string          // nome file senza estensione
  filename: string    // nome file completo, es. "uccelli.mp3"
  url: string         // URL pubblico, es. "/audio/uccelli.mp3"
}

export interface ClipConfig {
  file: string
  loop: boolean
  defaultVolume: number  // 0.0–1.0
}

export interface Collection {
  id: string
  name: string
  clips: ClipConfig[]
}

export interface CollectionsFile {
  collections: Collection[]
}
```

### T-0.3 — Setup Astro in `app/`
- Eseguire `npm create astro@latest` nella cartella `app/`.
- Scegliere template minimal (no blog, no portfolio).
- Aggiungere integrazione React: `npx astro add react`.
- Verificare che `astro.config.mjs` abbia `output: 'static'` e integrazione React attiva.
- Aggiungere Tailwind CSS: `npx astro add tailwind` (per utilità di stile base).

### T-0.4 — Setup Express in `server/`
- Eseguire `npm init` in `server/`.
- Installare dipendenze: `express`, `js-yaml`, `multer` (upload file), `cors`.
- Installare dev dependencies: `tsx` (run TypeScript diretto), `@types/express`, `@types/js-yaml`, `@types/multer`.
- Creare `server/index.ts` con server Express minimale che risponde su porta 8080.
- Verificare avvio con `npx tsx server/index.ts`.

### T-0.5 — Script di sviluppo e build
- Aggiungere in `package.json` root:
  - `"dev"`: avvia `app/` con `astro dev` e `server/` con `tsx --watch` in parallelo.
  - `"build"`: esegue `astro build` in `app/`, output in `app/dist/`.
  - `"start"`: avvia solo il server Express che serve `app/dist/`.
- Installare `concurrently` per eseguire i due processi in parallelo in dev.

***

## Epica 1 — Bootstrap e configurazione

### T-1.1 — Implementare `bootstrap.ts`
- Creare `server/lib/bootstrap.ts`.
- Alla chiamata di `bootstrap()`, verificare se `~/campfire/` esiste.
- Se non esiste, creare le cartelle: `~/campfire/`, `~/campfire/audio/`.
- Se `~/campfire/collections.yaml` non esiste, crearlo con contenuto iniziale vuoto:
```yaml
collections: []
```
- Se `~/campfire/campfire.yml` non esiste, crearlo con i valori di default:
```yaml
port: 8080
host: 0.0.0.0
audioDir: ~/campfire/audio
collectionsFile: ~/campfire/collections.yaml
openBrowser: true
logLevel: info
```
- Loggare a console ogni cartella o file creato.
- Esportare `bootstrap(): Promise<void>`.

### T-1.2 — Implementare `config.ts`
- Creare `server/lib/config.ts`.
- Leggere `~/campfire/campfire.yml` con `js-yaml`.
- Risolvere tutti i percorsi con `path.resolve` e `os.homedir()` (gestire `~`).
- Validare i campi obbligatori: se mancanti, loggare un errore chiaro e uscire con `process.exit(1)`.
- Esportare `loadConfig(): Config` con il tipo:
```typescript
interface Config {
  port: number
  host: string
  audioDir: string
  collectionsFile: string
  openBrowser: boolean
  logLevel: string
}
```
- Usare valori di default per ogni campo opzionale se non presente nel file.

### T-1.3 — Integrare bootstrap e config in `server/index.ts`
- In `server/index.ts`, all'avvio:
  1. Chiamare `await bootstrap()`.
  2. Chiamare `loadConfig()`.
  3. Avviare Express sulla porta e host letti dalla config.
  4. Se `openBrowser: true`, aprire il browser sull'URL del server con `open` (pacchetto npm).
- Loggare l'URL di accesso al termine dell'avvio: `Campfire.fm running at http://<host>:<port>`.

### T-1.4 — Creare i file di esempio
- Creare `campfire.yml.example` nella root del repo con tutti i campi commentati.
- Creare `collections.example.yaml` nella root con due collezioni di esempio (Foresta, Taverna) e commenti su ogni campo.

***

## Epica 2 — Server: route audio

### T-2.1 — Servire i file audio come statici
- In `server/index.ts`, aggiungere middleware Express per servire `config.audioDir` come statico su `/audio`:
```typescript
app.use('/audio', express.static(config.audioDir))
```
- Verificare che `http://localhost:8080/audio/uccelli.mp3` risponda correttamente con un file presente.

### T-2.2 — Implementare `GET /api/audio`
- Creare `server/routes/audio.ts`.
- Implementare handler che:
  - Legge il contenuto di `config.audioDir` con `fs.readdir`.
  - Filtra solo file con estensione audio supportata: `.mp3`, `.ogg`, `.wav`, `.flac`, `.m4a`.
  - Mappa ogni file in un oggetto `AudioFile`:
    ```typescript
    {
      id: "uccelli",           // filename senza estensione
      filename: "uccelli.mp3",
      url: "/audio/uccelli.mp3"
    }
    ```
  - Risponde con `200` e array `AudioFile[]`.
- Registrare la route in `server/index.ts`.

### T-2.3 — Implementare `POST /api/audio/upload`
- In `server/routes/audio.ts`, aggiungere handler upload.
- Configurare `multer` con:
  - `dest`: `config.audioDir`.
  - `fileFilter`: accettare solo MIME type audio (`audio/*`).
  - `limits.fileSize`: 100MB.
- L'handler:
  1. Riceve il file via `multipart/form-data`.
  2. `multer` lo salva direttamente in `audioDir` con il nome originale (usare `multer.diskStorage` con `filename` che mantiene `originalname`).
  3. Risponde con `201` e l'oggetto `AudioFile` appena creato.
  4. In caso di errore (tipo non supportato, file troppo grande), risponde con `400` e messaggio chiaro.

***

## Epica 3 — Server: route collezioni

### T-3.1 — Implementare helpers YAML per collezioni
- Creare `server/lib/collectionsStore.ts`.
- Implementare:
  - `readCollections(): CollectionsFile` — legge e parsa `collections.yaml`.
  - `writeCollections(data: CollectionsFile): void` — serializza e scrive `collections.yaml`.
  - Gestire eccezioni di parsing con try/catch e log di errore.

### T-3.2 — Implementare `GET /api/collections`
- Creare `server/routes/collections.ts`.
- Handler: chiama `readCollections()`, risponde con `200` e array `Collection[]`.

### T-3.3 — Implementare `POST /api/collections`
- Handler:
  1. Valida il body: `name` (string, obbligatorio), `clips` (array, default `[]`).
  2. Genera un `id` univoco da `name` (slug: lowercase, spazi → trattini, es. `"Foresta Oscura"` → `"foresta-oscura"`).
  3. Verifica che l'`id` non esista già; se esiste, aggiunge suffisso numerico (`foresta-oscura-2`).
  4. Aggiunge la nuova collezione, chiama `writeCollections()`.
  5. Risponde con `201` e la `Collection` creata.
  6. In caso di body non valido, risponde con `400`.

### T-3.4 — Implementare `PUT /api/collections/:id`
- Handler:
  1. Trova la collezione per `id`; se non esiste, risponde `404`.
  2. Valida i campi aggiornabili: `name` (opzionale), `clips` (opzionale).
  3. Applica le modifiche, mantiene immutato l'`id`.
  4. Chiama `writeCollections()`.
  5. Risponde con `200` e la `Collection` aggiornata.

### T-3.5 — Implementare `DELETE /api/collections/:id`
- Handler:
  1. Trova la collezione per `id`; se non esiste, risponde `404`.
  2. Rimuove la collezione dall'array.
  3. Chiama `writeCollections()`.
  4. Risponde con `204` (no content).

***

## Epica 4 — Server: SPA serving e CORS

### T-4.1 — Servire la SPA in produzione
- In `server/index.ts`, aggiungere middleware che serve `app/dist/` come statico su `/`.
- Aggiungere catch-all finale che serve `app/dist/index.html` per qualsiasi route non riconosciuta (supporto client-side routing).

### T-4.2 — Configurare CORS per sviluppo
- Installare `cors`.
- In dev mode (variabile d'ambiente `NODE_ENV=development`), abilitare CORS per `http://localhost:4321` (porta default Astro dev server).
- In produzione, CORS non necessario: SPA e API sono servite dallo stesso Express.

***

## Epica 5 — Frontend: struttura base e store Zustand

### T-5.1 — Installare dipendenze frontend
- In `app/`:
  - `npm install zustand howler`.
  - `npm install -D @types/howler`.

### T-5.2 — Creare `useAppStore.ts`
- Creare `app/src/store/useAppStore.ts`.
- Definire lo store Zustand con lo stato completo:

```typescript
import { create } from 'zustand'
import type { AudioFile, Collection } from '../../../types'
import type { Howl } from 'howler'

interface ClipState {
  fileId: string
  playing: boolean
  loop: boolean
  volume: number
  howlInstance?: Howl
}

interface AppStore {
  // Stato
  collections: Collection[]
  audioIndex: AudioFile[]
  clipStates: Map<string, ClipState>
  activeCollectionId: string | null
  audioUnlocked: boolean
  isLoading: boolean

  // Azioni
  setCollections: (c: Collection[]) => void
  setAudioIndex: (a: AudioFile[]) => void
  setClipState: (fileId: string, state: Partial<ClipState>) => void
  setActiveCollection: (id: string | null) => void
  setAudioUnlocked: (v: boolean) => void
  setLoading: (v: boolean) => void
  initClipStates: (collections: Collection[]) => void
}
```

- Implementare ogni azione.
- `initClipStates`: per ogni clip in ogni collezione, se non esiste già uno stato per quel `fileId`, crea un `ClipState` con `volume` inizializzato da `defaultVolume` (ADR-04).

### T-5.3 — Creare `api.ts`
- Creare `app/src/lib/api.ts`.
- Implementare funzioni fetch verso il server locale:

```typescript
const BASE = import.meta.env.DEV ? 'http://localhost:8080' : ''

export const getAudio = (): Promise<AudioFile[]>
export const getCollections = (): Promise<Collection[]>
export const createCollection = (name: string, clips?: ClipConfig[]): Promise<Collection>
export const updateCollection = (id: string, data: Partial<Collection>): Promise<Collection>
export const deleteCollection = (id: string): Promise<void>
export const uploadAudio = (file: File, onProgress?: (pct: number) => void): Promise<AudioFile>
```

- `uploadAudio` usa `XMLHttpRequest` per supportare il tracking del progresso durante upload.

### T-5.4 — Creare `polling.ts`
- Creare `app/src/lib/polling.ts`.
- Implementare:

```typescript
export function startPolling(store: AppStore, intervalMs = 2000): () => void
```

- Ogni `intervalMs`, se `store.isLoading` è `false`:
  1. Fetch `/api/audio` e `/api/collections`.
  2. Confronta con lo stato attuale nel store.
  3. Se diversi, aggiorna store con `setAudioIndex` e/o `setCollections`.
  4. Se le collezioni cambiano, chiama `initClipStates` per inizializzare eventuali nuove clip.
- Restituisce una funzione `stopPolling()` per pulire il `setInterval`.

***

## Epica 6 — Frontend: motore audio

### T-6.1 — Creare `audioEngine.ts`
- Creare `app/src/lib/audioEngine.ts`.
- Il modulo mantiene una `Map<string, Howl>` interna di istanze howler.
- Implementare:

```typescript
export function unlockAudio(): void
// chiama Howler.ctx?.resume() per sbloccare Web Audio API

export function play(fileId: string, url: string, loop: boolean, volume: number): void
// se non esiste istanza Howl per fileId, la crea con { src: [url], loop, volume, html5: false }
// chiama howl.play()
// aggiorna store: playing: true

export function stop(fileId: string): void
// chiama howl.stop() se istanza esiste
// aggiorna store: playing: false

export function setVolume(fileId: string, volume: number): void
// chiama howl.volume(volume) se istanza esiste
// aggiorna store: volume

export function setLoop(fileId: string, loop: boolean): void
// chiama howl.loop(loop) se istanza esiste
// aggiorna store: loop

export function stopAll(): void
// chiama Howler.stop() — ferma tutti i suoni attivi
// aggiorna store: tutti playing: false
```

- Ogni funzione che crea un'istanza Howl deve registrare i callback `onend` per aggiornare `playing: false` sulle clip non in loop.

### T-6.2 — Collegare audioEngine allo store
- Le funzioni di `audioEngine.ts` devono importare `useAppStore.getState()` per aggiornare lo stato senza passare lo store come parametro.
- Verificare che `play()`, `stop()`, `setVolume()`, `setLoop()`, `stopAll()` aggiornino correttamente il Zustand store.

***

## Epica 7 — Frontend: componenti React

### T-7.1 — Creare `AudioUnlock.tsx`
- Componente che mostra un overlay fullscreen alla prima apertura.
- Contiene un pulsante "🔥 Abilita audio".
- Al click: chiama `audioEngine.unlockAudio()` e `store.setAudioUnlocked(true)`.
- Se `audioUnlocked` è `true`, non renderizza nulla.

### T-7.2 — Creare `Spinner.tsx`
- Componente semplice: spinner SVG animato o CSS.
- Props: `message?: string`.
- Usato durante upload e creazione collezione.

### T-7.3 — Creare `ClipCard.tsx`
- Props:
  ```typescript
  interface ClipCardProps {
    audioFile: AudioFile
    clipState: ClipState
  }
  ```
- Renderizza:
  - Nome file (senza estensione).
  - Pulsante Play / Stop (toggle, con icona e colore diverso se in play).
  - Toggle loop (checkbox o pulsante).
  - Slider volume (input range 0–1, step 0.01).
- Gestori:
  - Play/Stop → `audioEngine.play()` / `audioEngine.stop()`.
  - Loop → `audioEngine.setLoop()`.
  - Volume → `audioEngine.setVolume()` (debounced 50ms per non inondare howler).
- Stato visivo: se `clipState.playing`, card con bordo o sfondo evidenziato.

### T-7.4 — Creare `CollectionPanel.tsx`
- Props:
  ```typescript
  interface CollectionPanelProps {
    collection: Collection | null   // null = vista "Tutte"
    audioIndex: AudioFile[]
    clipStates: Map<string, ClipState>
  }
  ```
- Se `collection` è `null`, mostra tutte le clip dell'`audioIndex`.
- Se `collection` è valorizzata, mostra solo le clip definite nella collezione.
- In cima al panel:
  - Nome della collezione (o "Tutte le clip").
  - Pulsante "▶ Play All" → chiama `audioEngine.play()` per ogni clip del panel.
  - Pulsante "⏹ Stop All" → chiama `audioEngine.stop()` per ogni clip del panel.
- Griglia di `ClipCard` per ogni clip.
- Se non ci sono clip, mostra messaggio vuoto con invito a caricare file.

### T-7.5 — Creare `Sidebar.tsx`
- Props:
  ```typescript
  interface SidebarProps {
    collections: Collection[]
    activeCollectionId: string | null
    onSelect: (id: string | null) => void
    onCreateCollection: () => void
  }
  ```
- Renderizza:
  - Voce "Tutte le clip" (seleziona `id: null`).
  - Lista delle collezioni con nome.
  - Voce selezionata evidenziata.
  - Pulsante "+ Nuova collezione" in fondo.
- Click su collezione → chiama `onSelect(collection.id)`.
- Click su "+ Nuova collezione" → chiama `onCreateCollection()`.

### T-7.6 — Creare modale creazione collezione
- Componente `NewCollectionModal.tsx`:
  - Input testo per il nome della collezione.
  - Pulsanti "Crea" e "Annulla".
  - Al click "Crea":
    1. `store.setLoading(true)` → spinner attivo, polling in pausa.
    2. Chiama `api.createCollection(name)`.
    3. `store.setLoading(false)`.
    4. Chiude il modale.
    5. Il polling al giro successivo aggiorna la lista.

### T-7.7 — Creare area upload file
- Componente `AudioUpload.tsx`:
  - Pulsante "Carica audio" che apre un `<input type="file" multiple accept="audio/*">`.
  - Al cambio di file:
    1. `store.setLoading(true)` → spinner, polling in pausa.
    2. Per ogni file selezionato, chiama `api.uploadAudio(file)` in sequenza.
    3. `store.setLoading(false)`.
    4. Il polling al giro successivo aggiorna l'indice audio.
  - Mostra barra di progresso per ogni file in upload (usando `onProgress` di `uploadAudio`).

### T-7.8 — Creare pulsante Stop Globale
- Componente `GlobalStopButton.tsx`:
  - Pulsante rosso visibile sempre nell'header.
  - Al click: `audioEngine.stopAll()`.
  - Testo: "⏹ Stop tutto".

***

## Epica 8 — Frontend: pagina principale e integrazione

### T-8.1 — Creare `index.astro`
- In `app/src/pages/index.astro`:
  - Layout base HTML con `<head>` (meta, title "Campfire.fm", viewport).
  - Importare e renderizzare il componente React root `<App client:only="react" />`.
  - `client:only="react"` assicura che il componente venga renderizzato solo nel browser, senza SSR.

### T-8.2 — Creare `App.tsx`
- Componente radice React.
- All'mount (`useEffect`):
  1. Fetch iniziale `/api/collections` e `/api/audio`.
  2. Popola store con `setCollections`, `setAudioIndex`, `initClipStates`.
  3. Avvia `startPolling(store)`.
  4. Pulisce il polling alla unmount.
- Renderizza:
  ```
  <AudioUnlock />
  {isLoading && <Spinner message="Caricamento..." />}
  <div className="layout">
    <Sidebar ... />
    <main>
      <Header>
        <AudioUpload />
        <GlobalStopButton />
      </Header>
      <CollectionPanel ... />
    </main>
  </div>
  ```
- Gestione `onCreateCollection`: apre/chiude `NewCollectionModal`.
- Gestione `onSelect`: aggiorna `activeCollectionId` nello store.

***

## Epica 9 — Stile e UI

### T-9.1 — Layout base
- Implementare layout a due colonne con Tailwind:
  - Sidebar fissa a sinistra, larghezza fissa (es. 220px).
  - Area principale a destra, scrollabile.
  - Header fisso in cima con nome tool, upload e stop globale.
- Palette colori scura e calda, coerente con l'estetica "campfire" / fantasy.

### T-9.2 — Stile ClipCard
- Card con bordo, ombra leggera.
- Stato in play: bordo colorato (es. arancione/ambra).
- Slider volume con styling CSS custom.
- Toggle loop: icona 🔁 che si colora se attivo.

### T-9.3 — Stile Sidebar
- Sfondo leggermente diverso dall'area principale.
- Voce attiva evidenziata con colore primario.
- Pulsante "+ Nuova collezione" sempre visibile in fondo.

### T-9.4 — Responsive base
- Su schermi < 768px (mobile), la sidebar collassa in un menu hamburger o si nasconde.
- Le ClipCard occupano l'intera larghezza su mobile.

***

## Epica 10 — Test e rilascio MVP

### T-10.1 — Test funzionale manuale
Verificare su browser desktop (Chrome o Firefox) e browser mobile (Safari iOS o Chrome Android):
- [ ] `campfire start` avvia il server e apre il browser.
- [ ] La cartella `~/campfire/` viene creata al primo avvio.
- [ ] `campfire.yml` di default viene creato se mancante.
- [ ] Upload di un file audio: il file appare entro 2s nella UI.
- [ ] Play/Stop singola clip funziona.
- [ ] Loop attivo/disattivo funziona.
- [ ] Slider volume funziona.
- [ ] Creazione di una collezione: appare in sidebar entro 2s.
- [ ] Play All / Stop All collezione funziona.
- [ ] Stop globale ferma tutto.
- [ ] Da un secondo dispositivo in LAN, le stesse collezioni e clip sono visibili.
- [ ] I volumi del secondo dispositivo sono indipendenti.
- [ ] AudioUnlock overlay appare alla prima apertura.

### T-10.2 — Gestione errori base
- Server risponde con messaggi di errore JSON chiari su `400`, `404`, `500`.
- Il frontend mostra un toast o banner in caso di errore API.
- Se `collections.yaml` è malformato, il server logga l'errore e risponde con array vuoto (non crasha).
- Se `audioDir` non esiste al momento di `GET /api/audio`, il server lo crea e risponde con array vuoto.

### T-10.3 — README.md
- Scrivere `README.md` con:
  - Cos'è Campfire.fm.
  - Requisiti (Node.js ≥ 18, RPI o qualsiasi sistema Linux/macOS).
  - Installazione: `git clone`, `npm install`, `npm run build`.
  - Avvio: `npm run start` o `campfire start`.
  - Struttura di `~/campfire/`.
  - Come caricare file audio.
  - Come creare collezioni.
  - Come resettare i volumi (reload della pagina).
  - Come avviare come servizio systemd (snippet di unit file incluso).

### T-10.4 — Snippet systemd
- Includere in `README.md` o in `docs/campfire.service` un unit file systemd pronto:

```ini
[Unit]
Description=Campfire.fm
After=network.target

[Service]
Type=simple
User=<your-user>
WorkingDirectory=/home/<your-user>/campfire.fm
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

***

## Riepilogo epiche

| Epica | Descrizione | Dipendenze |
|---|---|---|
| E0 | Setup repo e toolchain | — |
| E1 | Bootstrap e configurazione | E0 |
| E2 | Server: route audio | E1 |
| E3 | Server: route collezioni | E1 |
| E4 | Server: SPA serving e CORS | E0, E1 |
| E5 | Frontend: store e API client | E0 |
| E6 | Frontend: motore audio | E5 |
| E7 | Frontend: componenti React | E5, E6 |
| E8 | Frontend: pagina principale | E7 |
| E9 | Stile e UI | E7, E8 |
| E10 | Test e rilascio MVP | E1–E9 |

***

## Ordine di sviluppo suggerito

```
E0 → E1 → E2 → E3 → E4   (server completo e testabile via curl)
              ↓
         E5 → E6 → E7 → E8 → E9   (frontend completo)
                                ↓
                              E10   (test, README, systemd)
```
