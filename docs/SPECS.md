# Specifiche funzionali — Campfire.fm
### Tool audio browser-based per campagne GdR

***

## Obiettivo
Realizzare un tool semplice, eseguibile nel browser, pensato per campagne D&D o altri giochi di ruolo. Il tool deve permettere di caricare file audio personalizzati e riprodurli direttamente sul dispositivo che apre la pagina web. L'audio viene riprodotto sul client; il Raspberry Pi si occupa solo di servire la pagina e i file.

***

## Visione del prodotto
Una soundboard web leggera con supporto a più suoni contemporanei, loop per ambientazioni, controllo volume e organizzazione in collezioni tematiche. L'esecuzione avviene interamente lato client, sfruttando le capacità del browser di riprodurre audio locale dopo interazione esplicita dell'utente.

***

## Architettura prevista (homelab / Raspberry Pi)

Il tool è concepito esclusivamente per uso homelab in LAN:

- Il frontend è una SPA (Astro o framework equivalente) compilata in una cartella `dist/` servita da un piccolo file server embeddato incluso nel rilascio del tool.
- Il file server legge la configurazione da `~/campfire/campfire.yml` (porta, percorsi, ecc.).
- Al primo avvio, Campfire crea automaticamente la cartella `~/campfire/` con la seguente struttura:

```
~/campfire/
├── campfire.yml       ← configurazione principale
├── audio/             ← file audio locali, serviti via HTTP
└── collections.yaml   ← file YAML delle collezioni
```

- I file audio in `audio/` vengono serviti staticamente via HTTP (es. `http://raspberrypi.local:8080/audio/foresta.mp3`).
- Le collezioni sono virtuali e non legate a strutture di cartelle: sono definite in un unico file di configurazione user‑friendly (`collections.yaml`).
- Le collezioni e i file sono condivisi su tutti i dispositivi in LAN. Lo stato di Play/Stop e i volumi sono locali per ciascun browser client.
- L'app si avvia con un singolo comando (es. `campfire start`) che lancia il server e rende la UI disponibile sull'URL configurato.

***

## Ambito della prima versione
MVP focalizzata sulla semplicità. Deve funzionare bene da desktop e tablet, con interfaccia servita dal Raspberry Pi in LAN e riproduzione audio sempre sul device client.

### In scope
- Caricamento di file audio dall'interfaccia web, con salvataggio nella cartella `~/campfire/audio/`.
- Indice dei file audio noto a runtime (scan del filesystem lato server all'avvio e a ogni aggiunta).
- Riproduzione di più tracce contemporaneamente.
- Supporto al loop per ambience e sottofondi.
- Pulsanti play/stop per singolo suono.
- Comando stop globale per fermare tutto.
- Controllo volume per singolo suono (stato in memoria del browser, per sessione).
- Possibilità di marcare un suono come "loop".
- Creazione di collezioni tematiche (Foresta, Taverna, Combattimento, ecc.) via UI, con salvataggio in `collections.yaml`.
- Aggiunta e rimozione di clip in una collezione.
- Aggiornamento automatico della UI alla creazione di una collezione o all'aggiunta di un suono.
- Avvio rapido dell'intera collezione con un solo comando "Play All".
- Stop di una singola collezione senza fermare il resto.
- Vista integrata: sidebar con le collezioni, area principale "tavolo" con le clip della collezione selezionata.
- Interfaccia responsive, ottimizzata per desktop e tablet.

### Out of scope
- Account utente o autenticazione.
- Backend con logica applicativa complessa.
- Libreria persistente condivisa tra dispositivi o sync multidevice dello stato di Play.
- Editing audio, trimming o normalizzazione.
- Sincronizzazione multiutente in tempo reale (es. Play/Stop condiviso tra dispositivi).
- Automazioni avanzate: random events, ducking automatico, mixer professionale.
- Installazione come app nativa.

***

## Utenti target
Game master che vuole avviare rapidamente musica, ambience ed effetti sonori dal browser durante una sessione. Il tool deve favorire rapidità operativa e basso attrito, più che completezza funzionale.

***

## Principi di design
- Semplicità prima di tutto.
- Nessuna configurazione complessa iniziale: il tool si autoconfigura al primo avvio.
- Tutte le azioni principali accessibili in uno o due click/tap.
- Audio riprodotto solo dopo gesto esplicito dell'utente (vincoli autoplay browser).
- Le collezioni e i file audio sono la sorgente di verità, salvati su filesystem.
- I volumi e lo stato di Play/Stop sono locali per ogni client browser.

***

## User stories

### US-01 — Caricare clip audio
Come game master, voglio caricare i miei file audio dall'interfaccia web così da averli disponibili nella libreria senza accedere manualmente al filesystem del Raspberry Pi.

### US-02 — Riprodurre più clip insieme
Come game master, voglio far partire più clip contemporaneamente così da combinare ambience, musica ed effetti sonori nella stessa scena.

### US-03 — Mettere una clip in loop
Come game master, voglio impostare una clip in loop così da mantenere un sottofondo continuo come vento, pioggia o foresta.

### US-04 — Fermare tutto rapidamente
Come game master, voglio un comando stop globale così da resettare l'audio in un istante quando cambia scena.

### US-05 — Creare una collezione tematica
Come game master, voglio creare una collezione chiamata "Foresta" così da raggruppare suoni coerenti con una scena narrativa e prepararli in anticipo.

### US-06 — Aggiungere clip a una collezione
Come game master, voglio aggiungere a "Foresta" clip come uccelli, acqua e vento così da avere un set di suoni pronto all'uso.

### US-07 — Avviare una collezione intera
Come game master, voglio avviare tutte le clip di "Foresta" con un solo comando così da allestire l'atmosfera senza cliccare ogni singola clip.

### US-08 — Fermare una sola collezione
Come game master, voglio fermare "Foresta" senza interrompere altri suoni attivi così da passare da una scena all'altra in modo controllato.

### US-09 — Navigare per collezione
Come game master, voglio selezionare una collezione dalla sidebar così da vedere solo le clip rilevanti per la scena corrente.

### US-10 — Avvio rapido dell'applicazione
Come game master, voglio avviare Campfire con un solo comando da terminale così da trovarlo subito disponibile nel browser in LAN.

***

## Requisiti funzionali

### RF-01 — Caricamento file audio
Il sistema deve consentire all'utente di selezionare uno o più file audio dall'interfaccia web. I file devono essere salvati nella cartella `~/campfire/audio/` del Raspberry Pi e immediatamente disponibili come clip nella sessione corrente.

### RF-02 — Indice audio a runtime
Il server deve generare un indice dei file audio presenti in `audio/` a ogni avvio e a ogni aggiunta di file. Il frontend deve ricevere questo indice per popolare la libreria di clip.

### RF-03 — Catalogo di clip
Dopo il caricamento, ogni file deve comparire come clip nella UI con almeno nome, stato loop e controlli essenziali.

### RF-04 — Riproduzione singola
L'utente deve poter avviare una clip con un click/tap. Se non è in loop, il playback termina automaticamente a fine file.

### RF-05 — Riproduzione simultanea
Il sistema deve permettere la riproduzione di più clip nello stesso momento, così da combinare musica, ambience ed effetti.

### RF-06 — Stop singolo
Ogni clip deve avere un controllo per fermare solo quella clip.

### RF-07 — Stop globale
Il sistema deve offrire un comando globale per fermare immediatamente tutte le clip attive.

### RF-08 — Loop
Per ogni clip, l'utente deve poter attivare o disattivare il loop.

### RF-09 — Volume per clip
Ogni clip deve avere uno slider per impostare il volume individuale. Il valore è tenuto in memoria del browser per la sessione corrente.

### RF-10 — Stato visivo della riproduzione
L'interfaccia deve indicare chiaramente quali clip sono in riproduzione e quali sono ferme, tramite colore, badge o icona.

### RF-11 — Sblocco audio iniziale
Alla prima apertura, il sistema deve richiedere un'interazione esplicita per abilitare l'audio, rispettando i vincoli autoplay dei browser moderni.

### RF-12 — Creazione di una collezione
L'utente deve poter creare una nuova collezione assegnandole un nome libero dall'interfaccia. La collezione viene salvata in `~/campfire/collections.yaml` (o equivalente).

### RF-13 — Aggiunta clip a una collezione
L'utente deve poter associare ogni clip a una collezione esistente. Una clip appartiene a una sola collezione nella prima versione. Clip senza collezione sono considerate "libere".

### RF-14 — Navigazione per collezione
La sidebar deve elencare tutte le collezioni. Selezionando una collezione, l'area principale mostra solo le clip associate. Deve essere presente anche una vista "Tutte" che mostra tutte le clip libere e di ogni collezione.

### RF-15 — Avvio rapido della collezione
L'utente deve poter avviare tutte le clip di una collezione con un singolo "Play All". Le clip in loop restano in loop, quelle one-shot partono una volta.

### RF-16 — Stop della collezione
L'utente deve poter fermare tutte le clip di una collezione senza fermare quelle di altre collezioni eventualmente attive.

### RF-17 — Rinomina ed eliminazione di una collezione
L'utente deve poter rinominare o eliminare una collezione. L'eliminazione del gruppo non cancella le clip dall'indice audio.

### RF-18 — Aggiornamento automatico della UI
La UI deve aggiornarsi automaticamente alla creazione di una nuova collezione o all'aggiunta di un file audio, senza richiedere un reload manuale della pagina. È accettabile un polling leggero o un meccanismo semplice di notifica server → client.

***

## Requisiti non funzionali

### RNF-01 — Architettura semplice
L'applicazione deve essere una SPA compilata, servita da un piccolo file server embeddato. Nessun backend con logica applicativa nella prima versione.

### RNF-02 — Compatibilità browser
Deve funzionare sui browser moderni desktop e mobili che supportano Web Audio API o HTML5 Audio.

### RNF-03 — Responsive design
Interfaccia usabile su desktop e tablet. Su mobile deve restare funzionale, pur senza ottimizzazioni avanzate nella prima fase.

### RNF-04 — File e collezioni come sorgente di verità
I file audio e le collezioni sono salvati su filesystem. I volumi e gli stati Play/Stop sono locali per ogni client browser e non persistono tra sessioni diverse.

### RNF-05 — Performance percepita
Con un numero di clip tipico (1–30 per sessione), il sistema deve reagire immediatamente ai comandi play/stop.

### RNF-06 — Condivisione in LAN
Tutti i dispositivi in LAN accedono alla stessa istanza di Campfire e vedono le stesse collezioni e clip. Lo stato di Play/Stop e il volume sono per‑client.

***

## Flussi utente principali

### Flusso 1 — Primo avvio
1. L'utente lancia `campfire start` sull'RPI.
2. Campfire crea `~/campfire/` con le sottocartelle, se non esistono.
3. Legge `campfire.yml` per configurazione.
4. Il browser viene aperto (o l'utente naviga) su `http://raspberrypi.local:8080`.
5. L'interfaccia mostra un pulsante "Abilita audio".
6. Dopo il tap/click, l'audio viene sbloccato per la sessione corrente.

### Flusso 2 — Caricamento e uso rapido
1. L'utente carica uno o più file audio dall'interfaccia.
2. I file vengono salvati in `~/campfire/audio/` e l'indice si aggiorna.
3. Le clip compaiono nella UI come clip libere.
4. L'utente preme play su una o più clip e regola i volumi.

### Flusso 3 — Creazione di una collezione tematica
1. L'utente crea una nuova collezione "Foresta Oscura".
2. Carica o assegna le clip: uccelli, vento, ruscello, lupi distanti.
3. La collezione appare nella sidebar.
4. Durante la sessione, l'utente seleziona "Foresta Oscura" e preme "Play All".
5. Regola i volumi per bilanciare gli strati.
6. Quando la scena cambia, preme "Stop All" sulla collezione e passa a "Taverna".

### Flusso 4 — Uso durante una sessione D&D
1. L'utente apre Campfire dal tablet al tavolo.
2. Seleziona una collezione dalla sidebar.
3. Avvia/disattiva clip in tempo reale.
4. Usa stop globale se serve un reset rapido.

***

## Modello dati minimo

### File `collections.yaml`
```yaml
collections:
  - id: foresta-oscura
    name: Foresta Oscura
    clips:
      - id: uccelli
        file: uccelli.mp3
        loop: true
        defaultVolume: 0.7
      - id: ruscello
        file: ruscello.mp3
        loop: true
        defaultVolume: 0.5
```

### File `campfire.yml`
```yaml
port: 8080
audioDir: ~/campfire/audio
collectionsFile: ~/campfire/collections.yaml
```

***

## Interfaccia minima
La UI deve includere:
- Header con nome tool e pulsante di sblocco audio.
- Sidebar con lista delle collezioni + voce "Tutte".
- Area principale "tavolo" con le clip della collezione selezionata.
- Per ogni clip: nome, play/stop, toggle loop, slider volume, badge stato.
- Per ogni collezione in sidebar: Play All, Stop All.
- Barra azioni globale con Stop All.
- Bottone per aggiungere nuovi file audio.
- Bottone per creare una nuova collezione.

***

## Criteri di accettazione MVP
La MVP è accettabile se:
- permette di caricare file audio dall'interfaccia e averli disponibili immediatamente;
- permette di far suonare più clip insieme;
- permette di mettere in loop una clip;
- permette di fermare tutto con un solo comando;
- permette di creare una collezione e di aggiungere clip ad essa;
- permette di avviare e fermare una collezione con un solo comando;
- aggiorna automaticamente la UI all'aggiunta di file o collezioni;
- funziona su almeno un browser desktop e uno mobile moderni;
- non richiede backend applicativo con logica complessa;
- si avvia con un singolo comando da terminale.

***

## Evoluzioni future possibili (v2)
- Import/export di collezioni in JSON.
- Volume master globale con slider dedicato.
- Fade in/fade out per clip o collezione.
- Ricerca e filtri per nome clip.
- Hotkeys da tastiera (Play/Stop globale, Play/Stop collezione, volume master).
- Persistenza locale dei volumi con localStorage.
- Modalità schermo intero per tablet.
- Clip condivise tra più collezioni.
- Ordinamento manuale delle clip nella collezione.

***

## Punti ancora aperti
- Se supportare drag & drop per il caricamento file, oltre al file picker.
- Se mostrare clip libere (senza collezione) in una sezione dedicata o nella vista "Tutte".

Le decisioni su motore audio, aggiornamento UI e comportamento di `Play All` sono già chiuse in `DECISIONS.md`.

***

Rispetto alla versione precedente, le principali integrazioni sono:
- aggiunta sezione **Architettura prevista** con struttura `~/campfire/`, `campfire.yml`, server embedded e comando di avvio;
- aggiornamento **In scope** per riflettere caricamento tramite UI (non file picker puro), indice a runtime, aggiornamento automatico della UI;
- nuovi **RF-18** (aggiornamento automatico UI) e **RF-02** (indice audio a runtime);
- **modello dati** con esempi concreti di `collections.yaml` e `campfire.yml`;
- chiarimento che **volumi e Play/Stop sono per-client**, le **collezioni e i file sono la sorgente di verità** su filesystem.
- 