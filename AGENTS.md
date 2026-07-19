Ottima idea, molto utile per qualsiasi coding agent (Claude Code, Cursor, Gemini, Copilot, ecc.) lavori sulla repo. Un buon `AGENTS.md` riduce significativamente il tempo di esecuzione degli agenti e il consumo di token perché fornisce contesto preciso senza ripetersi a ogni sessione. [agents](https://agents.md)

Ecco il file completo:

***

# AGENTS.md — Campfire.fm

> Questo file fornisce contesto, convenzioni e istruzioni operative per qualsiasi coding agent che lavori su questa codebase. Leggilo interamente prima di eseguire qualsiasi task. Aggiornalo se introduci nuove convenzioni o correggi comportamenti ricorrenti.

***

## Cos'è questo progetto

Campfire.fm è una soundboard web per campagne GdR (D&D e simili), pensata esclusivamente per uso homelab su Raspberry Pi in LAN. È composta da:

- Un **server Node.js + Express** che serve la SPA, espone i file audio come statici e gestisce collezioni in YAML.
- Una **SPA frontend** (Astro + React + Zustand + howler.js) che gira nel browser del client.
- Una **cartella di dati** in `~/campfire/` con file audio, `collections.yaml` e `campfire.yml`.

Il motore audio è interamente lato client. Il server non tocca l'audio. Non esiste un database. Non esiste autenticazione.

***

## Documentazione di riferimento

Prima di modificare codice, leggi i file rilevanti per il task in corso:

| File | Contenuto |
|---|---|
| `SPECS.md` | Specifiche funzionali complete, user stories, criteri di accettazione |
| `ARCHITECTURE.md` | Stack, struttura repo, schemi YAML, API, flussi di avvio e UI |
| `DECISIONS.md` | Tutte le decisioni architetturali con motivazioni (ADR-01–ADR-06) |
| `TASKS.md` | Piano implementativo completo con epiche e sottotask |

Se c'è conflitto tra questi file e il codice esistente, segnalalo prima di procedere.

***

## Struttura del monorepo

```
campfire.fm/
├── app/          ← Frontend (Astro + React)
├── server/       ← Backend (Node.js + Express)
├── types.ts      ← Tipi TypeScript condivisi tra app/ e server/
├── dist/         ← Build output (gitignored, non modificare)
└── docs/         ← Documentazione (SPECS, ARCHITECTURE, DECISIONS, TASKS)
```

I tipi condivisi vivono in `types.ts` nella root. Non duplicare tipi in `app/` o `server/`.

***

## Comandi essenziali

```bash
# Sviluppo (avvia Astro dev + server Express in watch mode)
npm run dev

# Build produzione (compila Astro in app/dist/)
npm run build

# Avvio produzione (serve app/dist/ + API su porta configurata)
npm run start

# Type check
npm run typecheck

# Lint
npm run lint
```

Se un comando non esiste ancora nel `package.json`, implementalo prima di usarlo.

***

## Convenzioni di codice

### Generale
- Tutto il codice è **TypeScript strict**. Nessun `any` implicito. Se il tipo non è noto, definiscilo in `types.ts`.
- Nessun `// @ts-ignore` o `// @ts-nocheck` senza commento esplicito che spiega perché.
- Nessun `console.log` lasciato nel codice di produzione. Usa `console.error` solo per errori reali lato server.
- Indentazione: **2 spazi** ovunque (app/ e server/).
- Virgolette: **singole** in TypeScript/TSX, **doppie** solo in JSX per attributi HTML.

### Frontend (`app/`)
- I componenti React sono in `app/src/components/` con estensione `.tsx`.
- Un componente per file. Il nome del file coincide con il nome del componente (PascalCase).
- Lo stato globale vive esclusivamente in `app/src/store/useAppStore.ts` (Zustand). Non usare `Context` o prop drilling per stato condiviso.
- Le chiamate API sono tutte in `app/src/lib/api.ts`. Nessun `fetch` diretto nei componenti.
- Il motore audio è incapsulato in `app/src/lib/audioEngine.ts`. Nessuna importazione diretta di `howler` nei componenti.
- Il polling è gestito solo in `app/src/lib/polling.ts`. Non aggiungere `setInterval` altrove.
- Nessun CSS inline nei componenti. Usa Tailwind utility classes.
- Nessuna libreria di componenti UI esterna nella MVP (niente shadcn, Radix, MUI): solo Tailwind.

### Backend (`server/`)
- Le route Express sono in `server/routes/`. Un file per risorsa (`audio.ts`, `collections.ts`).
- La logica di accesso al filesystem è in `server/lib/`. Le route non leggono/scrivono file direttamente, salvo le route audio dedicate a scansione e upload dei file.
- La lettura e scrittura di `collections.yaml` passa sempre e solo da `server/lib/collectionsStore.ts`.
- La configurazione viene letta una sola volta all'avvio in `server/lib/config.ts` e poi passata come parametro. Nessun accesso diretto al filesystem per la config fuori da `config.ts`.
- Tutti gli endpoint REST rispondono con JSON. Nessuna risposta in plain text.
- Errori: `400` per input non valido, `404` per risorsa non trovata, `500` per errori interni. Includere sempre un campo `error: string` nel body di errore.

***

## Convenzioni YAML

- Il file `~/campfire/collections.yaml` viene letto e riscritto intero ad ogni modifica (non append).
- Non modificare mai `collections.yaml` direttamente nei test o negli script senza ripristinarlo.
- Il file `~/campfire/campfire.yml` è di sola lettura a runtime: viene letto all'avvio e non riscritto dal server.
- Gli ID delle collezioni sono slug generati da `name`: lowercase, spazi sostituiti da trattini, caratteri speciali rimossi. Esempio: `"Foresta Oscura"` → `"foresta-oscura"`.

***

## Decisioni chiuse — non riaprire senza aggiornare `DECISIONS.md`

| Decisione | Scelta | File |
|---|---|---|
| Component framework | React (non Svelte, non Vue) | ADR-01 |
| State management | Zustand (non Redux, non Context) | ADR-01 |
| Aggiornamento UI | Polling ogni 2s (non SSE nella MVP) | ADR-02 |
| Struttura collezioni | Singolo `collections.yaml` (non cartella) | ADR-03 |
| Volume in "Play All" | Volume di sessione (non `defaultVolume` YAML) | ADR-04 |
| Motore audio | howler.js (non Web Audio API nativa) | ADR-05 |
| Formato configurazione | YAML (non JSON, non TOML) | ADR-06 |

Se ritieni che una di queste decisioni debba essere rivista, aggiorna `DECISIONS.md` prima di modificare il codice.

***

## Comportamenti attesi dell'agente

### Prima di iniziare un task
1. Leggi il task in `TASKS.md` per capire le dipendenze.
2. Verifica che le epiche precedenti siano completate prima di iniziare la successiva.
3. Controlla che i tipi necessari esistano in `types.ts`. Se mancano, aggiungili prima di scrivere i moduli che li usano.

### Durante l'implementazione
- Implementa esattamente ciò che è descritto nel task, senza aggiungere funzionalità non richieste.
- Se un task è ambiguo o in conflitto con l'architettura documentata, segnala il problema invece di fare assunzioni silenti.
- Non installare dipendenze nuove senza una ragione esplicita. Se ne aggiungi una, documentala in `DECISIONS.md` con motivazione.
- Non modificare lo schema di `collections.yaml` o `campfire.yml` senza aggiornare `ARCHITECTURE.md`.

### Qualità del codice
- Ogni funzione pubblica esportata deve avere un commento JSDoc minimo (cosa fa, parametri non ovvi).
- Nessuna funzione con più di 40 righe senza refactoring in funzioni più piccole.
- I `useEffect` React devono sempre avere dipendenze esplicite e una funzione di cleanup se avviano listener o timer.

### Cosa non fare mai
- Non aggiungere autenticazione, sessioni o cookie.
- Non aggiungere un database (SQLite, PostgreSQL, MongoDB, ecc.).
- Non esporre l'applicazione su internet: è pensata solo per LAN.
- Non aggiungere SSE o WebSocket nella MVP: il polling è la scelta deliberata per semplicità (ADR-02).
- Non modificare `~/campfire/` al di fuori di `bootstrap.ts`, `config.ts`, `collectionsStore.ts` e delle route audio dedicate a scan/upload dell'audio.
- Non committare file in `dist/`.

***

## Variabili d'ambiente

| Variabile | Default | Descrizione |
|---|---|---|
| `NODE_ENV` | `production` | `development` abilita CORS verso `localhost:4321` |
| `CAMPFIRE_CONFIG` | `~/campfire/campfire.yml` | Percorso alternativo per il file di configurazione |

Non usare variabili d'ambiente per configurazione applicativa: quella va in `campfire.yml`. Le env var sono solo per il comportamento del processo Node.js.

***

## Edge case documentati

- **`collections.yaml` malformato**: il server logga l'errore e risponde con `{ collections: [] }` senza crashare.
- **`audioDir` non esistente**: `GET /api/audio` crea la cartella e risponde con `[]`.
- **Upload di file con nome già esistente**: il server sovrascrive il file esistente senza errore (comportamento semplice, non versionamento).
- **`defaultVolume` mancante in una clip YAML**: il frontend usa `1.0` come fallback.
- **Clip in `collections.yaml` che punta a un file non esistente in `audio/`**: la clip viene mostrata in UI con stato "file non trovato" e i controlli disabilitati.
- **Polling mentre `isLoading` è `true`**: il polling non viene eseguito, ma il timer continua a girare. Al termine del loading, il prossimo tick riprende normalmente.

***

## Aggiornare questo file

Aggiorna `AGENTS.md` ogni volta che:
- Aggiungi una nuova convenzione di codice non ovvia.
- Chiudi una nuova decisione architetturale in `DECISIONS.md`.
- Identifichi un edge case non documentato.
- Cambi uno script npm o aggiungi un comando utile.
- Risolvi un bug ricorrente causato da un comportamento mal documentato.
