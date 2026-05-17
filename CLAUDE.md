# CLAUDE.md — rebirth-project

Questo file viene letto automaticamente da Claude Code all'avvio di ogni
sessione. Contiene le regole operative del progetto che devono essere
sempre rispettate.

---

## Progetto

**rebirth-project** è una Progressive Web App personale per iPhone.
Obiettivo: daily companion per il benessere fisico e mentale di un
utente singolo (Nicola, 35 anni, Milano). Nessun backend proprietario.
Tutto gratuito.

**URL produzione**: https://rebirth-project.vercel.app (o equivalente)

---

## Tech stack

| Layer            | Tecnologia                          | Gratuito |
|------------------|-------------------------------------|----------|
| Frontend         | React 19 + Vite (JavaScript)        | ✅       |
| PWA              | vite-plugin-pwa + Workbox           | ✅       |
| Hosting          | Vercel (free tier)                  | ✅       |
| Storage client   | localStorage (cache locale)         | ✅       |
| Storage server   | Upstash Redis via Edge Function     | ✅       |
| AI engine        | Google Gemini 2.0 Flash             | ✅       |
| Meteo            | Open-Meteo (no key)                 | ✅       |
| Libri            | OpenLibrary API (no key)            | ✅       |
| Ricette          | Spoonacular + TheMealDB + USDA      | ✅       |
| News             | RSS / Reddit / NewsData / Guardian  | ✅       |
| Apple Health     | Shortcuts → URL params bridge       | ✅       |
| Charts           | Recharts                            | ✅       |

**Nessun servizio a pagamento è accettabile.** Se una feature richiede
un piano a pagamento, deve essere riprogettata o rimossa.

---

## Principi architetturali

1. **Client-first**: localStorage è la cache primaria. La UI non aspetta mai la rete.
2. **Server as truth**: Upstash Redis è la source of truth. Sovrascrive localStorage al boot.
3. **AI opzionale**: ogni feature AI ha un fallback non-AI. L'app funziona senza AI.
4. **Offline-ready**: tutte le feature core funzionano senza connessione.
5. **Free forever**: nessuna dipendenza da servizi a pagamento.
6. **Single user**: nessuna autenticazione multi-utente. App personale.

---

## Comandi

- `npm run dev` — Vite dev server con HMR. Service worker disabilitato in dev.
- `npm run build` — produzione in `dist/`. Genera `manifest.webmanifest`, `sw.js`, icone PWA.
- `npm run preview` — servi il bundle (test PWA + service worker).
- `npm run lint` — ESLint.

Non c'è test runner. La verifica fa parte della disciplina di
runtime-verify: dopo ogni modifica, `npm run lint && npm run build`
quando applicabile, dev/preview probe per cambi UI.

---

## Struttura del codice

```
src/
  features/
    training/          allenamento, sessioni, swap esercizi
    nutrition/         piano pasti, ricette, engine
    daily-feed/        RSS, Reddit, meteo
    wellness/          readiness, AI expert assessment
    alterEgo/          identità, streak protection, weekly reflection
    habits/            abitudini atomiche, streaks
    health/            Apple Health bridge via Shortcuts
    progress/          grafici peso, misurazioni corporee
    growth/            libri, corsi, skills, learning log, saved articles
  shared/
    services/
      ai.js                       client wrapper → /api/ai
    storage/
      index.js                    storageLoad/storageSave (localStorage + Upstash)
      useSyncStatus.js            online/offline + last sync hook
      migrations.js               lazy migrations (field-level)
      migrationRunner.js          sequential migrations (structural)
      idb.js                      IndexedDB wrapper per il feed cache
      export.js                   JSON backup
    components/
      BottomNav.jsx
      ConfirmModal.jsx
      ErrorBoundary.jsx
      OfflineBanner.jsx
      SettingsSheet.jsx
      Toast.jsx
      UpdatePrompt.jsx
    design/tokens.js              C palette, FONT, btn(), label, pill()
    utils/date.js                 DAY_IT, todayStr, todayDOW, getWeekStart
  App.jsx                         root: tab, activeSession, alterEgo, settings, sync bootstrap
  main.jsx
api/
  ai.js                           Vercel Edge Function → Gemini
  storage.js                      Vercel Edge Function → Upstash Redis
docs/
  diagrams/                       capability map + C4 + architecture overview
prompts/                          archivio dei prompt Claude Code originali
```

---

## Design system — "Zeroth"

Warm document-like dark UI, JetBrains Mono ovunque, copy in
sentence-case, **Phosphor icons (no emoji nel product UI)**, radii
contenuti (2/4/6/10), ombre calde e basse. Tutti i consumatori di token
passano da `shared/design/tokens.js` — mai colori o font literali.
Estendere l'oggetto `C` quando serve.

Le emoji sono ammesse nei file di documentazione (questo file, `docs/`,
commit messages) perché sono lette su GitHub, non renderizzate nella UI.

---

## Pattern di storage

```js
import { storageLoad, storageSave } from "./shared/storage/index.js";

const data = await storageLoad("rebirth_habits", []);
await storageSave("rebirth_habits", updatedHabits);
```

**Non chiamare mai `localStorage.getItem/setItem` direttamente** fuori da
`shared/storage/index.js` (l'unica eccezione è la `localStorage.length`
iteration nella cache invalidation del feed).

### Chiavi critiche (sincronizzate su Upstash)

`CRITICAL_KEYS` in `shared/storage/index.js`. Ogni nuova chiave
persistente deve essere aggiunta lì.

### Chiavi effimere (solo localStorage)

`EPHEMERAL_KEYS`: cache, valutazioni AI, read-IDs feed, `_last_sync`,
`_migrations_executed`, `_upstash_migration_done`. Perdibili.

---

## Pattern AI

```js
import { callAI, callAIWithFallback } from "./shared/services/ai.js";

// Feature obbligatoria — lancia eccezione se fallisce
const text = await callAI(prompt, systemPrompt, maxTokens);

// Feature opzionale — con fallback non-AI
const text = await callAIWithFallback(prompt, systemPrompt, maxTokens, fallbackFn);
```

**Non chiamare mai Gemini direttamente dal browser.** Sempre tramite
`/api/ai` (`GEMINI_API_KEY` vive solo server-side su Vercel).

---

## ⚠️ REGOLE DI MIGRAZIONE (obbligatorie)

Queste regole si applicano **ogni volta che viene modificata la struttura
di un dato persistente** (aggiunta/rimozione/rinomina di un campo,
cambio di tipo, ristrutturazione di un oggetto).

### Regola 1 — Classificazione del cambiamento

| Tipo di cambiamento               | Azione richiesta                                |
|-----------------------------------|-------------------------------------------------|
| Aggiunta campo con default        | Nessuna migrazione (o `withDefaults` in lettura) |
| Rimozione campo non usato         | Lazy migration                                  |
| Rinomina campo                    | Migration runner                                |
| Cambio tipo di un campo           | Migration runner                                |
| Cambio struttura oggetto          | Migration runner + nuova chiave versionata      |
| Nuova chiave storage              | Nessuna migrazione + aggiungi a `CRITICAL_KEYS` |

### Regola 2 — Aggiunta al migration runner

Per ogni cambiamento strutturale, aggiungere una voce numerata in
`src/shared/storage/migrationRunner.js`:

```js
{
  id:          N,                          // sempre incrementale, mai riusare
  description: "Descrizione del cambiamento",
  run: async ({ storageLoad, storageSave }) => {
    const old = await storageLoad("foo_v5", null);
    if (!old) return;
    const next = transform(old);
    await storageSave("foo_v6", next);
  },
}
```

**Non modificare mai migrazioni già rilasciate.** Crea sempre una nuova.

### Regola 3 — Trasparenza verso l'utente

Le migrazioni devono essere **completamente invisibili**.
- Nessuna schermata "Aggiornamento in corso…"
- Nessun toast/banner
- Eseguite in `App.jsx` bootstrap, prima del primo render
- Se falliscono: log + skip, **mai crash**. Idempotenti: il prossimo
  boot ritenta.

### Regola 4 — Aggiornamento documentazione (obbligatorio dopo ogni migrazione)

1. `docs/DATA_MODEL.md` — aggiorna lo schema del dato modificato
2. `docs/MIGRATIONS.md` — aggiungi voce con id, chiavi, descrizione, data
3. `prompts/` — aggiorna il prompt originale che definiva il tipo, con nota
   `// Migrazione #N: [descrizione]`
4. `docs/diagrams/` — se cambia un container/servizio, aggiorna il `.drawio`

### Regola 5 — Versioning delle chiavi per rotture di compatibilità

Se la struttura è talmente diversa che una migrazione incrementale è
complessa, versiona la chiave:

```
workoutLog_v5  →  workoutLog_v6
```

La migrazione copia + trasforma in un solo passo. Mantieni la chiave
vecchia per 2 versioni dell'app, poi rimuovila con un'altra migrazione.

---

## Aggiornamento diagrammi

I diagrammi in `docs/diagrams/` **devono essere aggiornati** quando:
- Si aggiunge una nuova feature significativa
- Si aggiunge un nuovo servizio esterno
- Si cambia la struttura dell'architettura
- Si aggiunge un nuovo Edge Function

Aprire il file `.drawio` corrispondente in [draw.io](https://app.diagrams.net)
e modificare i componenti coinvolti.

---

## Variabili d'ambiente

| Variabile                  | Dove           | Obbligatoria | Nota                                       |
|----------------------------|----------------|--------------|--------------------------------------------|
| `GEMINI_API_KEY`           | Vercel server  | Sì           | Mai `VITE_` — solo server-side             |
| `OPENROUTER_API_KEY`       | Vercel server  | No           | Fallback opzionale per `/api/ai`           |
| `KV_REST_API_URL`          | Vercel server  | Sì           | Auto-injected da Upstash                   |
| `KV_REST_API_TOKEN`        | Vercel server  | Sì           | Auto-injected da Upstash                   |
| `APP_STORAGE_TOKEN`        | Vercel server  | No           | Gating opzionale di `/api/storage`         |
| `VITE_APP_STORAGE_TOKEN`   | Vercel client  | No           | Stesso valore di `APP_STORAGE_TOKEN`       |
| `ALLOWED_ORIGIN`           | Vercel server  | No           | Allowlist CSV per `/api/ai` + `/api/storage` |
| `VITE_SPOONACULAR_API_KEY` | client         | No           | Ricette con filtri nutrizionali            |
| `VITE_USDA_API_KEY`        | client         | No           | Analisi nutrizionale                       |
| `VITE_NEWSDATA_API_KEY`    | client         | No           | Feed notizie aggiuntivo                    |
| `VITE_GUARDIAN_API_KEY`    | client         | No           | Feed Guardian                              |

---

## Regole generali di sviluppo

- **Nessun `console.log` in produzione** — `console.warn/error` solo per errori reali
- **Nessuna chiamata API nel render** — sempre in `useEffect` o handler
- **Nessun blocco della UI** — async fire-and-forget o con loading state
- **Mobile-first** — tutto deve funzionare su iPhone Safari, viewport 390px
- **Graceful degradation** — ogni feature esterna (AI, API, Health) ha fallback
- **Runtime-verify prima di "done"** — non firmare un layer su "build green" da solo:
  dev server + preview + content-check dei chunk

---

## Issue note (presenti nel codice)

- `features/training/index.jsx` ha un `useEffect` che chiama
  `setRestTimer(null)` sincrono quando il timer va a 0. ESLint
  `react-hooks/set-state-in-effect` lo segnala. Funziona, ma vale la
  pena ristrutturare se sei già in quell'hook.
- `src/App.css` è cruft del template Vite, non importato da nessuno.
  Eliminabile.

---

## Ultimo aggiornamento documentazione

Questa documentazione è generata ed evolve insieme al codice. Ogni
volta che cambia l'architettura, aggiornare in coppia:

1. Questo file `CLAUDE.md` (sezione coinvolta)
2. Il file `docs/` corrispondente
3. Il file `docs/diagrams/` corrispondente
4. La sezione regole-migrazione se è stata applicata una migrazione

Data ultimo aggiornamento: 2026-05-17
Versione: 1.0.0
