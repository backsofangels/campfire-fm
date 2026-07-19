# DECISIONS.md — Campfire.fm

> Questo file raccoglie le decisioni architetturali significative (ADR — Architecture Decision Records) prese durante lo sviluppo di Campfire.fm. Per ogni decisione viene documentato il contesto, le alternative valutate, la scelta fatta e le conseguenze pratiche.

***

## ADR-01 — Component framework: React + Zustand

**Stato**: ✅ Chiuso

**Contesto**
Astro supporta nativamente React, Svelte, Vue e altri framework per i componenti interattivi. Campfire.fm ha bisogno di stato reattivo per gestire clip, collezioni, Play/Stop e aggiornamenti da polling. Lo sviluppatore viene da un background Java, senza familiarità pregressa con framework JavaScript frontend.

**Alternative valutate**

| Criterio | React | Svelte |
|---|---|---|
| Modello mentale | Esplicito, vicino a Java (componenti, props, stato dichiarato) | Implicito, reattività "magica" automatica |
| Bundle size | ~45KB gzipped | ~3KB (compila in vanilla JS) |
| Boilerplate | Più verboso (`useState`, `useEffect`) | Minimo |
| Ecosistema UI | Enorme (shadcn/ui, Radix, ecc.) | Limitato ma sufficiente |
| Documentazione | Vastissima, facile trovare risposte | Più scarsa, soprattutto in italiano |
| TypeScript | Eccellente, prima classe | Buono ma meno maturo |
| Curva d'apprendimento da Java | Bassa: componenti, props e tipi espliciti | Media: reattività implicita meno familiare |

**Decisione**: **React con Zustand come store globale**

**Motivazione**
Lo sviluppatore viene da Java e non ha esperienza con framework JavaScript frontend. React ha un modello mentale più esplicito e lineare per chi è abituato a tipi, interfacce e stato dichiarato. La documentazione è vastissima e trovare risposte su StackOverflow è immediato. I vantaggi di bundle size e boilerplate di Svelte sono irrilevanti per le dimensioni di Campfire.fm e per una LAN privata. Zustand è scelto come store globale perché è minimale, TypeScript-friendly e non richiede il boilerplate di Redux.

**Conseguenze**
- Stato locale dei componenti con `useState` e `useReducer`.
- Stato globale condiviso (collezioni, indice audio, stato clip) con Zustand.
- Nessun Redux, nessun Context complesso: overkill per questo progetto.
- Bundle leggermente più pesante di Svelte, irrilevante su LAN domestica.

***

## ADR-02 — Aggiornamento UI: polling con spinner

**Stato**: ✅ Chiuso

**Contesto**
Quando l'utente aggiunge un file audio o crea/modifica una collezione, la UI deve aggiornarsi automaticamente senza reload. Esistono due approcci principali: Server-Sent Events (SSE) con filesystem watcher, oppure polling periodico lato client.

**Alternative valutate**

| Criterio | SSE + fsWatcher | Polling |
|---|---|---|
| Complessità implementazione | Media (`chokidar` + stream HTTP) | Bassa (`setInterval` + `fetch`) |
| Latenza aggiornamento | Immediata, push dal server | ~2 secondi |
| Carico sul server | Connessione persistente leggera | Richieste periodiche, basso overhead |
| Robustezza | Richiede gestione riconnessioni | Sempre funzionante, nessun edge case |
| Dipendenze aggiuntive | `chokidar` | Nessuna |
| UX su operazioni lente | Richiede gestione separata | Spinner nativo durante l'operazione |

**Decisione**: **Polling ogni 2 secondi, con spinner durante upload e creazione collezione**

**Motivazione**
Il polling ogni 2 secondi è banale da implementare e perfettamente accettabile per un uso homelab con 1–3 client. La latenza di 2 secondi non è percepibile durante la preparazione della sessione. Durante le operazioni di upload o creazione collezione, la UI mostra uno spinner e il polling viene sospeso finché l'operazione non si conclude, garantendo consistenza visiva. SSE è più elegante ma aggiunge complessità non giustificata nella MVP.

**Conseguenze**
- Nessuna dipendenza da `chokidar` nella MVP.
- Il frontend fa polling su `/api/audio` e `/api/collections` ogni 2 secondi con `setInterval`.
- Durante upload e creazione collezione, spinner visivo e polling in pausa.
- In v2, il polling può essere sostituito da SSE senza cambiamenti all'API pubblica.

***

## ADR-03 — Struttura collezioni: singolo `collections.yaml`

**Stato**: ✅ Chiuso

**Contesto**
Le collezioni virtuali devono essere salvate su filesystem in formato leggibile. La domanda è se usare un singolo file `collections.yaml` che contiene tutte le collezioni, oppure una cartella `collections/` con un file per collezione.

**Alternative valutate**

| Criterio | Singolo `collections.yaml` | Cartella `collections/` |
|---|---|---|
| Semplicità implementazione | Alta: leggi/scrivi un file | Media: scan cartella + parse multipli |
| Editabilità a mano | Ottima per 5–15 collezioni | Migliore per molte collezioni indipendenti |
| Backup | Un singolo file da copiare | Intera cartella |
| Import/export | Triviale | Richiede zip o script |
| Scalabilità | Sufficiente per uso homelab | Meglio per grandi librerie |

**Decisione**: **Singolo `collections.yaml`**

**Motivazione**
Per un uso homelab con un solo GM e 5–15 collezioni tipiche, un singolo file è più che sufficiente. È più semplice da leggere, editare a mano, fare backup e importare/esportare. I rischi di conflitti di scrittura sono trascurabili (un solo utente attivo per volta). La migrazione a cartella multipla è possibile in v2 senza rompere l'API.

**Conseguenze**
- `~/campfire/collections.yaml` è la sorgente di verità per tutte le collezioni.
- Il server legge e riscrive l'intero file ad ogni modifica (accettabile per dimensioni ridotte).
- Semplice da fare backup, editare a mano, importare ed esportare in JSON (v2).

***

## ADR-04 — Volume in "Play All": solo volume di sessione

**Stato**: ✅ Chiuso

**Contesto**
Quando l'utente preme "Play All" su una collezione, ogni clip viene avviata. La domanda è quale volume usare: il `defaultVolume` salvato in `collections.yaml`, oppure il volume corrente impostato nella sessione browser dal client.

**Alternative valutate**

| Criterio | `defaultVolume` da YAML | Volume di sessione |
|---|---|---|
| Prevedibilità | Alta: la scena suona sempre uguale | Media: dipende dallo stato corrente |
| Rispetto del lavoro live del GM | No: ignora aggiustamenti fatti in sessione | Sì: rispetta quello che vede sullo schermo |
| Complessità implementazione | Bassa | Bassa |
| Comportamento naturale atteso | Meno intuitivo | Più intuitivo |

**Decisione**: **Solo volume di sessione. `defaultVolume` usato esclusivamente all'inizializzazione della clip**

**Motivazione**
Il GM aggiusta i volumi durante la sessione e si aspetta che "Play All" rispetti quello che vede sullo schermo, non valori nascosti nel YAML. Il `defaultVolume` ha senso solo al primo caricamento della clip, per dare uno starting point ragionevole allo slider. Dopo, è lo stato del browser a comandare. Se si vuole tornare ai valori originali, basta ricaricare la pagina.

**Conseguenze**
- Al caricamento della pagina, `ClipState.volume` viene inizializzato da `defaultVolume` in YAML.
- "Play All" usa sempre il `ClipState.volume` corrente nel browser, senza rileggere il YAML.
- Nessun flag `volumeOverridden` necessario: la logica è più semplice.
- Reset ai valori originali = reload della pagina (comportamento documentato in README).

***

## ADR-05 — Motore audio: howler.js

**Stato**: ✅ Chiuso

**Contesto**
Il playback audio nel browser può essere gestito direttamente via Web Audio API nativa (nessuna dipendenza) oppure tramite howler.js (libreria che astrae Web Audio API e HTML5 Audio con fallback automatici).

**Alternative valutate**

| Criterio | Web Audio API nativa | howler.js |
|---|---|---|
| Dipendenze | Nessuna | ~10KB gzipped |
| Compatibilità cross-browser | Buona, ma con edge case su Safari/mobile | Gestita automaticamente |
| Loop gapless | Possibile ma richiede codice specifico | Supportato nativamente |
| Multi-playback | Manuale | Automatico |
| Sblocco autoplay | Da gestire manualmente | Gestito con `Howler.ctx.resume()` |
| Tempo di sviluppo | Più lungo | Molto più rapido |

**Decisione**: **howler.js**

**Motivazione**
howler.js gestisce automaticamente loop gapless, playback simultaneo, unlock audio su mobile/desktop, fade e compatibilità cross-browser. Implementare la stessa robustezza con Web Audio API nativa richiederebbe significativamente più codice e testing. Per un progetto homelab personale, la semplicità di sviluppo vince sulla purezza delle dipendenze. ~10KB gzipped è un costo trascurabile.

**Conseguenze**
- Dipendenza da `howler` nel `package.json` del frontend.
- Nessun codice custom per gestire autoplay unlock, loop o fade.
- API semplice: `new Howl({src, loop, volume})`, `.play()`, `.stop()`, `.fade()`.

***

## ADR-06 — Formato configurazione: YAML

**Stato**: ✅ Chiuso

**Contesto**
`campfire.yml` e `collections.yaml` devono essere editabili a mano dall'utente anche senza interfaccia grafica. La scelta del formato impatta la leggibilità umana e la facilità di parsing server-side.

**Alternative valutate**

| Criterio | YAML | JSON | TOML |
|---|---|---|---|
| Leggibilità umana | Ottima, nessuna sintassi verbosa | Discreta (virgole, parentesi graffe) | Ottima |
| Editabilità a mano | Molto alta | Media | Alta |
| Parsing Node.js | `js-yaml` (piccola libreria) | Nativo | `@iarna/toml` |
| Familiarità utenti tecnici | Alta (Docker Compose, Ansible, Home Assistant) | Alta | Media |
| Rischi | Indentazione sensibile | Virgole mancanti | Raro |

**Decisione**: **YAML**

**Motivazione**
YAML è il formato più familiare per file di configurazione homelab (Docker Compose, Home Assistant, Ansible). L'utente target ha già dimestichezza con YAML in altri contesti. Il rischio di errori di indentazione è mitigabile con un file di esempio ben commentato e messaggi di errore chiari all'avvio.

**Conseguenze**
- Dipendenza da `js-yaml` nel server.
- File di configurazione e collezioni entrambi in `.yaml`.
- `campfire.yml.example` e `collections.example.yaml` ben commentati inclusi nel repo.

***

## Riepilogo

| ADR | Argomento | Decisione |
|---|---|---|
| ADR-01 | Component framework | **React + Zustand** |
| ADR-02 | Aggiornamento UI | **Polling 2s + spinner su upload/creazione** |
| ADR-03 | Struttura collezioni | **Singolo `collections.yaml`** |
| ADR-04 | Volume in "Play All" | **Solo volume di sessione, `defaultVolume` solo all'init** |
| ADR-05 | Motore audio | **howler.js** |
| ADR-06 | Formato configurazione | **YAML** |
