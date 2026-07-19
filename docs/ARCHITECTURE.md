# ARCHITECTURE.md — Campfire.fm

## Vista d'insieme

Campfire.fm è una soundboard web per campagne GdR, pensata esclusivamente per uso homelab in LAN. L'architettura è volutamente semplice: un piccolo server locale gira sul Raspberry Pi, serve la SPA frontend e i file audio statici, e legge la configurazione da file YAML nella home dell'utente. Il motore audio gira interamente nel browser del client.

***

## Principi architetturali

- **Client-side audio**: tutto il playback avviene nel browser del device che apre la pagina. Il Raspberry Pi non tocca l'audio.
- **Filesystem come sorgente di verità**: file audio e collezioni sono file reali su disco (`~/campfire/`). Non esiste un database.
- **Stato UI per-client**: volumi e stato di Play/Stop sono in memoria del browser. Non vengono sincronizzati tra dispositivi.
- **Zero over-engineering**: nessun ORM, nessun auth, nessuna infrastruttura cloud. È un tool per una LAN privata.
- **Un solo comando per partire**: `campfire start` deve essere sufficiente per avere tutto funzionante.

***

## Stack tecnologico

Tutte le scelte sono definitive. Per il ragionamento dietro ogni voce, vedere `DECISIONS.md`.

| Layer | Scelta | Motivazione |
|---|---|---|
| Frontend framework | Astro | Build statico leggero, supporto nativo a React, nessun overhead runtime |
| Component framework | **React** | Modello mentale esplicito, familiare per chi viene da Java, TypeScript eccellente, documentazione vastissima |
| State management | **Zustand** | Minimale, TypeScript-friendly, nessun boilerplate Redux |
| Motore audio | **howler.js** | Multi-playback, loop gapless, unlock autoplay automatico, ~10KB gzipped |
| File server | Node.js + **Express** | Serve `dist/`, espone `audio/` come statico, legge e scrive YAML |
| Configurazione | **YAML** (`js-yaml`) | Leggibile a mano, familiare in contesti homelab (Docker Compose, Home Assistant) |
| Aggiornamento UI | **Polling ogni 2s** | Banale da implementare, sufficiente per uso homelab; SSE rimandato a v2 |

***

## Struttura delle cartelle del progetto (repo)

```
campfire.fm/
├── app/                                  ← Frontend SPA (Astro + React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx               ← Lista collezioni, navigazione
│   │   │   ├── ClipCard.tsx              ← Card singola clip: play/stop/loop/volume
│   │   │   ├── CollectionPanel.tsx       ← Tavolo clip + Play All / Stop All
│   │   │   ├── AudioUnlock.tsx           ← Pulsante sblocco audio iniziale
│   │   │   └── Spinner.tsx               ← Spinner per upload e creazione collezione
│   │   ├── store/
│   │   │   └── useAppStore.ts            ← Zustand store: collezioni, clip, stato audio
│   │   ├── lib/
│   │   │   ├── audioEngine.ts            ← Wrapper howler.js (play, stop, fade, loop)
│   │   │   ├── api.ts                    ← Fetch verso /api/*
│   │   │   └── polling.ts                ← setInterval su /api/audio e /api/collections
│   │   └── pages/
│   │       └── index.astro               ← Entry point SPA, monta React root
│   └── public/
├── server/                               ← File server Node.js + Express
│   ├── index.ts                          ← Entry point: avvia Express, bootstrap, config
│   ├── routes/
│   │   ├── audio.ts                      ← GET /api/audio, POST /api/audio/upload
│   │   └── collections.ts                ← CRUD /api/collections
│   ├── lib/
│   │   ├── config.ts                     ← Legge ~/campfire/campfire.yml
│   │   └── bootstrap.ts                  ← Crea ~/campfire/ e sottocartelle se mancano
├── types.ts                              ← Tipi condivisi (Collection, AudioFile, ecc.)
├── dist/                                 ← Output build Astro (gitignored)
├── campfire.yml.example                  ← Template configurazione commentato
├── collections.example.yaml              ← Template collezioni commentato
├── package.json
└── README.md
```

> Rispetto alla versione precedente: rimossi `fsWatcher.ts` e `events.ts` (non necessari con polling), `Sidebar.astro` e altri `.astro` sostituiti da `.tsx` React, aggiunta cartella `store/` per Zustand, aggiunto `Spinner.tsx` e `polling.ts`.

***

## Struttura dati in `~/campfire/`

```
~/campfire/
├── campfire.yml           ← Configurazione principale
├── audio/                 ← File audio (mp3, ogg, wav, ...)
│   ├── uccelli.mp3
│   ├── ruscello.ogg
│   └── boss_theme.mp3
└── collections.yaml       ← Definizione delle collezioni virtuali (singolo file)
```

***

## Schema `campfire.yml`

```yaml
port: 8080
host: 0.0.0.0            # 0.0.0.0 per rendere accessibile in LAN
audioDir: ~/campfire/audio
collectionsFile: ~/campfire/collections.yaml
openBrowser: true         # apre automaticamente il browser all'avvio
logLevel: info
```

***

## Schema `collections.yaml`

Il file è la sorgente di verità per tutte le collezioni. Viene letto e riscritto intero ad ogni modifica. Il `defaultVolume` di ogni clip viene usato solo per inizializzare il valore dello slider al caricamento della pagina; dopo, è lo stato del browser a comandare (ADR-04).

```yaml
collections:
  - id: foresta-oscura
    name: Foresta Oscura
    clips:
      - file: uccelli.mp3
        loop: true
        defaultVolume: 0.7
      - file: ruscello.ogg
        loop: true
        defaultVolume: 0.5
      - file: lupi_distanti.mp3
        loop: false
        defaultVolume: 0.4

  - id: taverna
    name: Taverna
    clips:
      - file: folla_sottofondo.mp3
        loop: true
        defaultVolume: 0.6
      - file: musica_liuto.mp3
        loop: true
        defaultVolume: 0.8
```

***

## Flusso di avvio

```
campfire start
      │
      ▼
bootstrap.ts
  crea ~/campfire/ se non esiste
  crea audio/, collections.yaml vuoto se mancano
      │
      ▼
config.ts
  legge campfire.yml
  risolve percorsi assoluti
      │
      ▼
Express server
  serve dist/          → http://host:port/
  serve audio/         → http://host:port/audio/*  (statico)
  espone REST API      → http://host:port/api/*
      │
      ▼
Browser client
  carica SPA (Astro + React build)
  fetch GET /api/collections → inizializza store Zustand
  fetch GET /api/audio       → inizializza indice clip
  avvia polling ogni 2s      → mantiene store aggiornato
  inizializza howler.js      → pronto per il playback
```

***

## API server (interna)

L'API è solo per uso interno tra SPA e server locale. Non è pubblica né autenticata.

| Metodo | Path | Descrizione |
|---|---|---|
| `GET` | `/api/audio` | Lista file audio presenti in `~/campfire/audio/` |
| `GET` | `/api/collections` | Lista delle collezioni da `collections.yaml` |
| `POST` | `/api/collections` | Crea una nuova collezione |
| `PUT` | `/api/collections/:id` | Aggiorna una collezione (nome, clip associate) |
| `DELETE` | `/api/collections/:id` | Elimina una collezione |
| `POST` | `/api/audio/upload` | Carica un nuovo file in `~/campfire/audio/` |
| `GET` | `/audio/*` | File audio statici serviti direttamente |

> Rimossa la route `GET /api/events` (SSE): non necessaria con polling. Potrà essere aggiunta in v2.

***

## Flusso UI (client)

```
Apertura pagina
      │
      ▼
AudioUnlock → utente tocca "Abilita audio"
  → Howler.ctx.resume() sblocca Web Audio API
      │
      ▼
Fetch iniziale /api/collections + /api/audio
  → Zustand store popolato
      │
      ▼
Polling ogni 2s su /api/audio + /api/collections
  → aggiorna store se ci sono differenze
  → sospeso durante upload e creazione collezione (spinner attivo)
      │
      ▼
Render Sidebar (lista collezioni)
Render CollectionPanel (clip della collezione selezionata)
      │
      ├─ Play singola clip    → audioEngine.play(clipId)    → howl.play()
      ├─ Stop singola clip    → audioEngine.stop(clipId)    → howl.stop()
      ├─ Play All collezione  → clips.forEach → audioEngine.play()
      ├─ Stop All collezione  → clips.forEach → audioEngine.stop()
      └─ Stop globale         → audioEngine.stopAll()       → Howler.stop()
```

***

## Stato applicativo (client)

Lo stato vive interamente nel browser tramite Zustand. Non viene persistito né condiviso tra dispositivi. Il `defaultVolume` da YAML inizializza `ClipState.volume` al caricamento; dopo, solo il valore in store comanda.

```typescript
// store/useAppStore.ts — Zustand store

interface ClipState {
  fileId: string           // nome file in ~/campfire/audio/
  playing: boolean
  loop: boolean
  volume: number           // 0.0–1.0, inizializzato da defaultVolume YAML
  howlInstance?: Howl      // istanza howler.js, creata al primo play
}

interface AppState {
  collections: Collection[]           // da collections.yaml via /api/collections
  audioIndex: AudioFile[]             // da ~/campfire/audio/ via /api/audio
  clipStates: Map<string, ClipState>  // stato per-clip in sessione
  activeCollectionId: string | null   // collezione selezionata in sidebar
  audioUnlocked: boolean              // true dopo il primo tap su AudioUnlock
  isLoading: boolean                  // true durante upload o creazione collezione
}
```

***

## Aggiornamento automatico della UI

Il frontend fa polling ogni 2 secondi su `/api/audio` e `/api/collections` (ADR-02). Al ritorno di ogni risposta, il frontend confronta il risultato con lo stato Zustand corrente: se ci sono differenze, aggiorna lo store e la UI si ri-renderizza automaticamente. Durante le operazioni di upload e creazione collezione, il polling viene sospeso e la UI mostra uno spinner (`isLoading: true`). L'operazione si conclude, la UI riprende il polling e aggiorna la vista con i nuovi dati.

> In v2, il polling potrà essere sostituito con SSE + `chokidar` senza cambiamenti all'API REST.

***

## Considerazioni su Raspberry Pi

- **Pi 4 o Pi 5** consigliati; Pi 3B+ è sufficiente per serving statico e parsing YAML.
- Node.js LTS ≥ 18 deve essere installato sull'RPI.
- Il server non elabora audio: CPU e RAM non sono un collo di bottiglia con 1–30 clip e 1–3 client LAN.
- Si consiglia di registrare Campfire come **servizio systemd** per averlo disponibile al boot senza intervento manuale.

***

## Riferimenti

- Decisioni tecnologiche dettagliate → `DECISIONS.md`
- Specifiche funzionali → `SPECS.md`
- Piano di lavoro → `TASKS.md`
