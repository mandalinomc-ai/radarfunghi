# MushroomRadar — Documento completo per analisi e miglioramento

**Versione documento:** giugno 2026 (post-Specifica Master)  
**URL produzione:** https://radar-funghi.vercel.app  
**Repository GitHub:** mandalinomc-ai/radarfunghi  
**Percorso progetto locale:** `C:\Users\pcgam\Desktop\progetti AI\radar funghi`  
**Ultimo deploy:** `dpl_8uQrFHRMT2Qq9JigWg5xsan8izhF`

---

## Istruzioni per l’analista (Gemini / altro LLM)

Sei un esperto di product design, architettura software, UX mobile, dati geospaziali, AI applicata e applicazioni outdoor.

Analizza **MushroomRadar** usando esclusivamente le informazioni contenute in questo documento.

**Restituisci:**

1. **Audit UX** — desktop e mobile, con problemi residui e soluzioni concrete  
2. **Top 10 miglioramenti** — priorità P0 / P1 / P2 con impatto e sforzo stimato  
3. **Architettura** — refactor consigliati, moduli da estrarre, rischi tecnici  
4. **Motore predittivo** — accuratezza, variabili mancanti, validazione scientifica  
5. **Roadmap 3 mesi** — quick wins, mediano termine, visione  
6. **Rischi legali** — raccolta funghi in Italia, disclaimer, responsabilità contenuti  
7. **Mockup testuale** — flusso utente ideale dalla home alla raccolta in bosco  

Sii specifico: cita moduli/file quando possibile. Evita consigli generici.

---

# PARTE 1 — Cos’è MushroomRadar (spiegazione completa)

## 1.1 Scopo dell’applicazione

**MushroomRadar** è un’applicazione web italiana che aiuta i cercatori di funghi a capire **dove e quando** andare a raccogliere, con focus su **Sannio, Matese, Taburno, Molise, Campania e Basilicata**.

Non è un semplice meteo: combina **dati meteorologici live**, **modelli di probabilità di germinazione** (Sprout Score 0–100%), **modificatori ambientali** (malluvione, vento secco, larve), **trend social community**, **contenuti editoriali** da Funghimagazine.it e un **assistente AI** (“Mastro Fungaiolo” via Google Gemini) per suggerire zone boschive con maggiore potenziale.

L’utente tipico:
- Accetta **termini legali obbligatori** (validi 30 giorni) prima di usare l’app
- Parte da una città (es. Benevento, Campobasso, Avellino)
- Imposta raggio di ricerca (fino a ~165 km)
- Sceglie giorno, fascia oraria (es. 06:00–10:00) e specie (porcino, estatino, finferlo/galletto)
- Vede **hotspot colorati** su mappa satellitare (sfocati ±1.5 km in tier free)
- Apre dettaglio zona con alert ambientali, coordinate (precise solo premium), quota, tipo bosco, link Google Maps
- Può chiedere al **Mastro Fungaiolo** in italiano: *“Dove trovo gli estatini a 20 km da Benevento?”*
- Può **segnalare ritrovamenti** con foto GPS obbligatoria (anti-fake), anche **offline** (coda IndexedDB)

Esiste anche una **guida per principianti** che genera una roadmap completa (orari, attrezzatura, quantità stimata, navigatore).

## 1.2 Modello di business / tier

| Tier | Timeline | Coordinate | Hotspot mappa | Attivazione attuale |
|------|----------|------------|---------------|---------------------|
| **Free** | Oggi + domani (+1 giorno) | Sfocate ±1.5 km | Cerchi tratteggiati, heatmap ampia | Default |
| **Premium** | Fino a +14 giorni | GPS precise | Cerchi pieni, heatmap nitida | Banner dev (`enablePremiumDev`) o env `NEXT_PUBLIC_PREMIUM_TIER=premium` |

Stripe/checkout **non ancora implementato** — premium è solo hook tecnico.

## 1.3 Lingua e pubblico

- Interfaccia **100% italiana**
- Target: cercatori amatoriali e intermedi, anche principianti assoluti

---

# PARTE 2 — Stack tecnologico

| Componente | Tecnologia | Note |
|------------|------------|------|
| Framework | Next.js 15.5 (App Router) | Single page principale |
| Linguaggio | TypeScript | Strict |
| UI | React 19 | Client components |
| Styling | Tailwind CSS 3 | Palette verde foresta + arancione fungo |
| Mappa | React Leaflet + Leaflet | Tile satellitari Esri World Imagery |
| Hosting | Vercel | Serverless API routes |
| Storage | Vercel Blob | Cache meteo + foto segnalazioni |
| Offline client | IndexedDB | Coda segnalazioni pending (`reportOfflineStore.ts`) |
| Geocoding | Nominatim (OSM) | Proxy server-side, solo Italia |
| Meteo | Open-Meteo API | ECMWF/GFS best_match, ±14 giorni |
| Cron | Vercel Cron | 1× al giorno (04:00 UTC) — limite piano Hobby |
| Chatbot primario | **Google Gemini** | Modello `gemini-2.5-flash` (compatibile chiavi `AQ.`) |
| Chatbot fallback | Rule-based | `mushroomChatEngine.ts` se Gemini fallisce |
| Context app | React Context | `MushroomRadarContext` — tier, legal, maxDayOffset |

**Dipendenze principali (`package.json`):**
- `next`, `react`, `react-dom`
- `leaflet`, `react-leaflet`
- `@vercel/blob`
- `@google/genai`

**Script utili:**
```bash
npm run dev
npm run build
npm run verify:gemini   # test connessione Mastro Fungaiolo
npx vercel deploy --prod --yes
```

**Variabili ambiente:**
- `BLOB_READ_WRITE_TOKEN` — cache meteo + foto report
- `CRON_SECRET` — protezione endpoint cron
- `GEMINI_API_KEY` — Mastro Fungaiolo (server-side)
- `GEMINI_CHAT_MODEL` — default `gemini-2.5-flash`
- `NEXT_PUBLIC_PREMIUM_TIER` — opzionale, forza tier premium

---

# PARTE 3 — Architettura logica

## 3.1 Diagramma flusso dati

```
UTENTE
  │
  ▼
MushroomRadarProvider (tier, legalAccepted, maxDayOffset)
  │
  ▼
MushroomRadarShell ──► se !legalAccepted → solo LegalGatekeeperModal
  │
  ▼
MushroomRadarApp (orchestratore UI + stato)
  │
  ├── useLiveZones ──► GET /api/sync?date=YYYY-MM-DD
  │                         │
  │                         ├──► /api/weather (cache o refresh)
  │                         │         │
  │                         │         ├── weatherAggregator → Open-Meteo
  │                         │         ├── regionalAgrometeo (bias ARPA)
  │                         │         └── weatherCache (memory + Vercel Blob)
  │                         │
  │                         └── fonti + count segnalazioni
  │
  ├── useHotspotCalculation ──► enrichZonesFromOrigin
  │                         ──► filterZonesByRegions + rangeKm
  │                         ──► buildHotspots (predictionEngine)
  │                         ──► matchesProbabilityFilter
  │
  ├── useMushroomReports ──► GET /api/reports + syncPendingReports (IndexedDB)
  │
  └── MushroomMap (cerchi hotspot tier-aware + report utenti + MapDragListener)

CHAT:
  mapHotspotsToMastroPayload
    → chatWithMastro (Server Action)
    → generateMastroFungaioloReply (SDK + REST fallback, exponential backoff)
    → JSON { reply, recommendedHotspotId }
    → fallback answerMushroomQuestion se errore

CRON (1×/giorno): /api/cron/refresh ──► warm cache meteo
CLIENT (3 min + tab visible): useLiveZones refresh automatico
```

## 3.2 Stato applicativo principale (`MushroomRadarApp`)

| State | Descrizione |
|-------|-------------|
| `criteria: SearchCriteria` | Origine, data, ore, specie, regioni incluse |
| `rangeKm` | Raggio ricerca (10–165 km) |
| `probabilityFilter` | all / alta / media / bassa |
| `selectedHotspot` | Zona cliccata sulla mappa |
| `mobilePanel` | Sheet mobile: chat, fm, legend, sources, filters, cityPreview |
| `mobileSearchExpanded` | Timeline espansa/collassata (44dvh) |
| `mapCompact` | true durante drag mappa → dock 48px (toolbar nascosta) |
| `userReports` | Segnalazioni community (server + synced) |
| `pendingCount` | Segnalazioni in coda IndexedDB offline |

**Context globale (`MushroomRadarContext`):**
- `tier`: free | premium
- `legalAccepted`: boolean (localStorage TTL 30 giorni)
- `maxDayOffset`: 1 (free) | 14 (premium)
- `acceptLegal()`, `enablePremiumDev()`

## 3.3 Pipeline calcolo hotspot

1. **28 zone fungine** statiche in `mockData.ts` + coordinate in `zoneRegistry.ts`
2. Meteo live arricchisce ogni zona (`forecastsByDate` per ogni giorno)
3. Per data selezionata: `getZoneForDate()` applica previsioni corrette
4. `calculateSproutScore()` per ogni specie × ogni ora nella fascia
5. **Modificatori Specifica Master:**
   - `environmentalMalus` — malluvione (>100mm/3g → ×0.30, recovery +10%/giorno secco), vento (>6h >15km/h → ×0.75)
   - `socialScraper` — bonus +15% se trend social attivo in regione
   - `funghimagazineData` — semaforo regionale verde +8%, rosso −30%, finferli attivi +12%
6. `buildHotspots()` sceglie specie migliore e score massimo per zona
7. Filtro probabilità esclude zone sotto soglia
8. Mappa renderizza cerchi con raggio/colore; tier free applica `obfuscateCoordinates` (jitter deterministico ±1.5 km)

---

# PARTE 4 — Struttura file del progetto

```
radar funghi/
├── vercel.json                    # Cron meteo giornaliero
├── package.json
├── tailwind.config.ts
├── next.config.ts
├── scripts/verify-gemini.mjs      # Test API Gemini
│
├── docs/
│   └── MUSHROOMRADAR-ANALISI-GEMINI.md   # ← questo documento
│
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx               # MushroomRadarProvider + MushroomRadarShell
    │   ├── globals.css            # Safe area iOS, Leaflet, --mobile-dock
    │   ├── actions/
    │   │   ├── mastroFungaiolo.ts # Server Action chatWithMastro
    │   │   └── geminiChat.ts      # Wrapper retrocompat
    │   └── api/
    │       ├── sync/route.ts
    │       ├── weather/route.ts
    │       ├── geocode/route.ts
    │       ├── sources/route.ts
    │       ├── cron/refresh/route.ts
    │       └── reports/
    │           ├── route.ts
    │           └── photo/[id]/route.ts
    │
    ├── context/
    │   └── MushroomRadarContext.tsx # Tier, legal gate, maxDayOffset
    │
    ├── components/
    │   ├── MushroomRadarShell.tsx       # Blocca app finché legal non accettato
    │   ├── MushroomRadarApp.tsx         # ★ Orchestratore (~970 righe)
    │   ├── MushroomMap.tsx              # Leaflet, tier blur, MapDragListener
    │   ├── Header.tsx
    │   ├── CitySearchBar.tsx
    │   ├── SearchPanel.tsx              # Dock mobile + sidebar desktop 320px
    │   ├── AdvancedSearchDrawer.tsx     # AdvancedSearchForm (mobile sheet + sidebar)
    │   ├── MobileBottomBar.tsx          # MobileDockToolbar
    │   ├── MobileSheet.tsx              # Bottom sheet (layout panel per chat)
    │   ├── MushroomChatPanel.tsx
    │   ├── LocationDetailPanel.tsx      # + ZoneEnvironmentAlerts, tier coords
    │   ├── ZoneEnvironmentAlerts.tsx    # Larve, malluvione, vento, social
    │   ├── LegalGatekeeperModal.tsx     # Termini obbligatori 30d TTL
    │   ├── PremiumUpgradeBanner.tsx     # CTA premium (dev toggle)
    │   ├── BeginnerGuidePanel.tsx
    │   ├── ReportMushroomSheet.tsx      # Form + coda offline IndexedDB
    │   ├── ReportDetailPanel.tsx
    │   ├── UserReportMarkers.tsx
    │   ├── DataSourcesBanner.tsx
    │   ├── FunghiMagazineContent.tsx
    │   ├── LegendContent.tsx
    │   └── CollectionWindowChart.tsx
    │
    ├── hooks/
    │   ├── useLiveZones.ts
    │   ├── useHotspotCalculation.ts     # Pipeline Sprout Score estratta
    │   ├── useMushroomChat.ts           # Gemini + fallback rule-based
    │   ├── useMushroomReports.ts        # Poll + sync offline queue
    │   └── useGeocodeSearch.ts
    │
    └── lib/
        ├── types.ts
        ├── mockData.ts                  # 28 zone
        ├── zoneRegistry.ts
        ├── predictionEngine.ts          # ★ Sprout Score + buildHotspots
        ├── infestationEngine.ts         # Rischio larve/vespatura §5.2.3
        ├── environmentalMalus.ts        # Malluvione + Mvento
        ├── socialScraper.ts             # Bonus social +15%
        ├── campaniaSocialTrends.ts      # Trend statici Campania
        ├── tierUtils.ts                 # Free/premium, blur coords
        ├── reportOfflineStore.ts        # IndexedDB pending uploads
        ├── geminiChatConfig.ts          # Prompt Mastro, SDK, model chain
        ├── mastroGeminiRest.ts          # REST + exponential backoff
        ├── mastroHotspotMapper.ts       # MapHotspot → payload Gemini
        ├── mastroTypes.ts
        ├── mushroomChatEngine.ts        # Fallback NL rule-based
        ├── weatherAggregator.ts
        ├── weatherCache.ts
        ├── zoneWeather.ts
        ├── regionalAgrometeo.ts
        ├── funghimagazineData.ts
        ├── cityDayPreview.ts
        ├── beginnerGuide.ts
        ├── dataSources.ts
        ├── geoUtils.ts
        ├── dateUtils.ts
        ├── timeRange.ts
        ├── mapUtils.ts
        ├── zoneFilters.ts
        ├── regionLabels.ts
        ├── reportStore.ts
        ├── benevento.ts
        ├── constants.ts
        └── mobileLayout.ts              # Dock 104px / compact 48px / expanded 44dvh
```

---

# PARTE 5 — Modello dati principale

## 5.1 FungalZone (zona boschiva)

Ogni zona ha:
- `id`, `name`, `region` (matese | taburno | sannio | molise | campania | basilicata)
- Coordinate centro + **parcheggio** (`parkingLat/Lng`)
- `altitude`, `exposure` (north/south/east/west), `forestType`
- `species[]` — specie possibili nella zona
- `rainHistory[]` — mm pioggia per giorno (da Open-Meteo daily)
- `hourlyForecasts[]` — temperatura, umidità, umidità suolo, vento per ora 0–23
- `forecastsByDate` — stesso per ogni giorno ±14
- `nightThermalShock`, `baseSoilMoisture` — derivati dal meteo
- `kmFromBenevento`, `driveMinutesFromBenevento` — ricalcolati da origine utente

## 5.2 MapHotspot (output mappa)

- `zone: FungalZone`
- `predictions[]` — score per ogni specie
- `activeScore` — score migliore nella fascia oraria
- `activeSpecies` — specie con score massimo

## 5.3 MushroomReport (segnalazione utente)

- GPS (`lat`, `lng`, `accuracyMeters`)
- **Foto obbligatoria** (`photoUrl`)
- Tipo: `spia` | `bottata` | `ritrovamento`
- Specie o `sconosciuto`
- Nota testuale, `createdAt`

## 5.4 PendingReportRecord (offline IndexedDB)

- Stesso payload del POST + `photoBlob` + `id` UUID
- Sync automatico su evento `online` via `syncPendingReports()`

## 5.5 SearchCriteria

```typescript
{
  origin: { name, lat, lng },
  selectedDate: "YYYY-MM-DD",
  hourRange: { startHour, endHour },
  species: "porcino" | "estatino" | "galletto" | "all",
  includedRegions: FungalZone["region"][]
}
```

---

# PARTE 6 — Motore predittivo (Sprout Score)

## 6.1 Specie e parametri

| Specie | Nome comune | Quota tipica | Note |
|--------|-------------|--------------|------|
| `porcino` | Porcino | 1100–1600 m | Faggeta, esposizione nord, mattino |
| `estatino` | Porcino estivo | 600–900 m | Quercia-castagno, esposizione E/S |
| `galletto` | Finferlo/Galletto | 700–1100 m | Versanti umidi, N/O |

## 6.2 Formula concettuale

Per ogni `(zona, specie, ora, data)`:

```
score_base = weighted_sum(
  rainScore,        // piogge 7 e 14 giorni vs minimo specie
  moistureScore,    // umidità suolo vs ottimale
  thermalScore,     // shock termico notte/giorno
  altitudeScore,    // quota nel range specie
  exposureScore,    // esposizione preferita
  timeScore         // bias orario (mattino porcino/estatino)
)

score = score_base
  × environmentalMalus.combinedMultiplier   // malluvione + vento
  × social.bonusMultiplier                    // fino a +15% trend social
  × funghimagazineModifiers                   // semaforo, stagione, finferli
```

## 6.3 Moduli ambientali (Specifica Master)

| Modulo | File | Logica |
|--------|------|--------|
| Larve/vespatura | `infestationEngine.ts` | Media temp 72h >18°C + notti >14°C → rischio ALTO, alert UI |
| Malluvione | `environmentalMalus.ts` | >100mm/3g → ×0.30, recovery +10%/giorno secco |
| Mvento | `environmentalMalus.ts` | >6h vento >15km/h/48h → ×0.75 |
| Social bonus | `socialScraper.ts` | Trend attivo regione → +15% nel motore, alert verde in UI |

Alert visualizzati in `ZoneEnvironmentAlerts.tsx` dentro `LocationDetailPanel`.

## 6.4 Soglie UI

- **Alta:** ≥ 80%
- **Media:** 40–79%
- **Bassa:** < 40%
- Soglia minima guida principianti: ≥ 28%

## 6.5 Fonti meteo

1. **Open-Meteo** — temperatura, umidità, suolo, precipitazioni, vento (API reale)
2. **ARPA** — bias regionali statici in `regionalAgrometeo.ts` (non API live ARPA)
3. **Funghimagazine** — dati editoriali aggiornati al **21/06/2026** in `funghimagazineData.ts`
4. **Social** — trend statici Campania in `campaniaSocialTrends.ts` (non scraper live)

---

# PARTE 7 — API REST (contratti)

## GET `/api/sync?date=YYYY-MM-DD&force=1`

Risposta aggregata per il client:
- `weather` — snapshot zone con meteo
- `sources[]` — stato fonti (live/cached/editorial)
- `reportsCount`
- `autoRefreshMs` (180000 = 3 min)
- `serverCronMinutes` (1440 = 24h)

## GET `/api/weather?date=YYYY-MM-DD`

- Legge cache Blob se fresca (< 10 min)
- Altrimenti `aggregateAllZoneWeather()` → scrive cache
- Fallback stale se Open-Meteo fallisce

## GET `/api/geocode?q=testo`

- Min 2 caratteri, suffisso ", Italia", countrycodes=it
- Max 8 risultati Nominatim

## GET/POST `/api/reports`

- GET: lista segnalazioni
- POST: FormData con lat, lng, photo (required), species, type, note

## GET `/api/cron/refresh`

- Authorization: Bearer `CRON_SECRET`
- Aggiorna cache meteo per oggi

---

# PARTE 8 — Interfaccia utente (layout)

## 8.1 Desktop

```
┌──────────┬──────────────────────────────────────────────────┐
│ SIDEBAR  │ HEADER: Logo + Score + Zone + Raggio             │
│ 320px    ├──────────────────────────────────────────────────┤
│          │ CitySearchBar (destra)                           │
│ Advanced │                                                  │
│ Search   │              MAPPA SATELLITARE                   │
│ Form     │         (md:left-[320px], hotspot tier-aware)    │
│          │                                                  │
│ Timeline │  [DataSourcesBanner]     [Chat] [Segnala]        │
│ Raggio   │                                                  │
│ Prob.    │  LocationDetailPanel (destra, se zona selez.)    │
│ Premium  │                                                  │
│ Banner   │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Note layout desktop:**
- Sidebar fissa sinistra 320px (`SearchPanel.tsx`)
- `AdvancedSearchDrawer` floating rimosso dall’app (sostituito da sidebar)
- Header con `pl-[336px]`
- DataSourcesBanner spostato a `left-[336px]`

## 8.2 Mobile

```
┌─────────────────────────────┐
│ HEADER compatto (1 riga)      │
├─────────────────────────────┤
│ 🔍 Cerca città...  📅       │
├─────────────────────────────┤
│                             │
│         MAPPA               │
│  (drag → dock compact 48px) │
│                             │
├─────────────────────────────┤
│ 💬 🎓 ⚙️ 📍 📊 📡 🗺      │  ← toolbar (nascosta se mapCompact)
│ Timeline · Oggi · 06-10  ▼  │  ← handle 48px, swipe ↑↓
│ [Oggi][Domani][🔒+3g]...    │  ← giorni locked oltre maxDayOffset
└─────────────────────────────┘

Sheet (layout panel): Chat | Filtri | FM | Legenda | Oggi/Domani città
LegalGatekeeperModal: overlay z-2000 finché non accettato
```

**Altezze CSS (`mobileLayout.ts` + `globals.css`):**
- Dock chiuso: **104px** (48px handle + 56px toolbar)
- Dock espanso: **44dvh**
- Mappa in drag: **48px** (solo handle, toolbar nascosta)
- `--mobile-dock` CSS var aggiornata dinamicamente
- Controlli zoom Leaflet sopra il dock

---

# PARTE 9 — Funzionalità complete (inventario)

| # | Funzione | Stato | Modulo principale |
|---|----------|-------|-------------------|
| 1 | Mappa satellitare Esri | ✅ | MushroomMap |
| 2 | Hotspot probabilità colorati | ✅ | predictionEngine + MushroomMap |
| 3 | Meteo live Open-Meteo | ✅ | weatherAggregator |
| 4 | Previsioni multi-giorno ±14 | ✅ premium / +1 free | tierUtils + SearchPanel |
| 5 | Bias ARPA regionali | ✅ | regionalAgrometeo |
| 6 | Funghimagazine semafori | ✅ | funghimagazineData |
| 7 | Ricerca città partenza | ✅ | CitySearchBar + geocode API |
| 8 | Anteprima oggi/domani | ✅ | cityDayPreview |
| 9 | Filtri avanzati (regioni, specie, data, ore) | ✅ | AdvancedSearchForm |
| 10 | Timeline + chip giorni tier-locked | ✅ | SearchPanel |
| 11 | Slider raggio km | ✅ | SearchPanel |
| 12 | Filtro probabilità esclusivo | ✅ | mapUtils |
| 13 | Dettaglio zona + Google Maps | ✅ | LocationDetailPanel |
| 14 | Alert ambientali (larve, malluvione, vento, social) | ✅ | ZoneEnvironmentAlerts |
| 15 | Guida principianti | ✅ | beginnerGuide |
| 16 | **Mastro Fungaiolo Gemini AI** | ✅ | mastroFungaiolo + geminiChatConfig |
| 17 | Chat fallback rule-based | ✅ | mushroomChatEngine |
| 18 | Segnalazioni foto GPS | ✅ | ReportMushroomSheet |
| 19 | Segnalazioni offline IndexedDB | ✅ | reportOfflineStore |
| 20 | Marker report su mappa | ✅ | UserReportMarkers |
| 21 | Auto-refresh client 3 min | ✅ | useLiveZones |
| 22 | Cron server 1×/giorno | ✅ | vercel.json |
| 23 | Cache meteo Vercel Blob | ✅ | weatherCache |
| 24 | Legal gatekeeper obbligatorio | ✅ | LegalGatekeeperModal |
| 25 | Tier free/premium (blur, timeline) | ✅ hook | tierUtils + MushroomRadarContext |
| 26 | Sidebar desktop 320px | ✅ | SearchPanel |
| 27 | Dock mobile swipe + compact drag | ✅ | SearchPanel + MushroomMap |
| 28 | Pipeline hotspot estratta | ✅ | useHotspotCalculation |

---

# PARTE 10 — Mastro Fungaiolo (assistente chat)

## 10.1 Architettura

**Primario: Google Gemini** (`gemini-2.5-flash`)

Pipeline:
1. Utente scrive messaggio in `MushroomChatPanel`
2. `useMushroomChat.sendMessage()` mappa hotspot live → `MastroHotspotPayload[]`
3. Server Action `chatWithMastro()` → `generateMastroFungaioloReply()`
4. Prompt system: personalità “Mastro Fungaiolo”, dati Sprout Score, meteo, trend social
5. Risposta JSON: `{ reply, recommendedHotspotId }`
6. Se `recommendedHotspotId` → mappa seleziona zona automaticamente
7. Fallback: `answerMushroomQuestion()` rule-based se Gemini non configurato/errore

**Resilienza:**
- SDK `@google/genai` + fallback REST (`mastroGeminiRest.ts`)
- Exponential backoff su rate limit
- Model chain: `gemini-2.5-flash` (default), fallback list in config
- `sendingRef` previene doppi invii
- `MobileSheet layout="panel"` per scroll corretto su mobile

## 10.2 Fallback rule-based (`mushroomChatEngine.ts`)

Parser regex italiano:
- Specie: estatino, porcino, finferlo/galletto
- Giorno: oggi, domani, dopodomani
- Raggio: "20 km"
- Origine: "da Benevento"
- Intent: find, compare, best, help

## 10.3 Esempi domande

- "Dove trovo gli estatini nel raggio di 20 km da Benevento?"
- "Dove nasceranno i porcini domani?"
- "Confronta oggi e domani per il porcino"
- "Migliori zone per finferli oggi"

---

# PARTE 11 — Zone geografiche coperte

**28 zone** in 6 regioni logiche:

- **Matese** — Bocca della Selva, Cusano Mutri, Guardiaregia, ecc.
- **Taburno-Camposauro** — Camposauro, Vallone Ginestre, ecc.
- **Sannio** — colli e monti Benevento/Caserta
- **Molise montano** — rilievi di confine
- **Campania interna** — Partenio, Irpinia
- **Basilicata** — Pollino, Vulture, Monticchio, Lagonegrese, Gallipoli Cognato

Origine default: **Benevento centro** (41.1297, 14.7825).  
Raggio default: **massimo** (~165 km, ~3 ore di viaggio stimato).

---

# PARTE 12 — Deploy e operazioni

## 12.1 Vercel

- URL: https://radar-funghi.vercel.app
- Env produzione: `GEMINI_API_KEY`, `GEMINI_CHAT_MODEL=gemini-2.5-flash`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`

## 12.2 Limiti piano Hobby Vercel

- **Cron:** massimo 1 esecuzione al giorno (schedule `0 4 * * *`)
- Client compensa con refresh ogni **3 minuti** quando tab aperta

## 12.3 Test eseguiti (giugno 2026)

- `npm run build` — OK
- `npm run verify:gemini` — OK (modello gemini-2.5-flash, hotspot consigliato)
- Homepage + API produzione — HTTP 200

---

# PARTE 13 — Debito tecnico e limiti noti

| ID | Area | Descrizione | Severità |
|----|------|-------------|----------|
| L1 | Architettura | `MushroomRadarApp.tsx` ~970 righe | Media |
| L2 | Zone | 28 zone statiche, non da GIS/CORINE | Alta |
| L3 | ARPA | Bias hardcoded, non API ARPA real-time | Media |
| L4 | Cron | 1×/giorno su Hobby | Media |
| L5 | Social | Trend statici, non scraper live | Media |
| L6 | Premium | Nessun Stripe/checkout reale | Media |
| L7 | PWA | Nessun Service Worker / cache tiles offline | Alta |
| L8 | SEO | SPA senza landing indicizzabile | Alta |
| L9 | a11y | Non auditato WCAG | Media |
| L10 | README | Obsoleto vs codice attuale | Bassa |
| L11 | Validazione | Score non validato su dati reali raccolta | Alta |
| L12 | Legacy | TimelineSlider, SpeciesFilter, FunghiMagazineBanner non wired | Bassa |
| L13 | Sicurezza | Chiave Gemini esposta in chat utente — da ruotare | Alta |

---

# PARTE 14 — Metriche suggerite (non ancora implementate)

- Tempo risposta `/api/sync` (p50, p95)
- % sessioni con ≥1 hotspot score ≥ 40
- Click "Mostra in mappa" da chat / recommendedHotspotId
- Segnalazioni/giorno per regione + % sync offline riuscite
- Bounce rate mobile vs desktop
- Conversione legal accept → prima interazione mappa
- Errori Gemini vs fallback rule-based

---

# PARTE 15 — Domande aperte per l’analista

1. Come validare scientificamente lo Sprout Score con dati reali di raccolta?
2. Conviene integrare NDVI/satellite (Sentinel) per umidità canopy?
3. Architettura ideale per spezzare `MushroomRadarApp`?
4. Il Mastro Fungaiolo Gemini è sufficiente o serve RAG su bollettini ARPA?
5. PWA offline: cosa cachare (zone + ultimo meteo + tiles)?
6. Modello freemium Stripe: prezzo e feature gate ideali?
7. Moderazione segnalazioni community (foto fake, spot bruciati)?
8. Social scraper live: quali fonti e frequenza senza violare ToS?
9. Espansione geografica: come scalare oltre 28 zone?
10. Requisiti legali raccolta funghi Campania n. 8/2007 — disclaimer sufficiente?

---

# PARTE 16 — Glossario

| Termine | Significato |
|---------|-------------|
| Sprout Score | Probabilità 0–100% germinazione/nascita funghi in una zona/ora |
| Hotspot | Zona mappa con score calcolato e cerchio colorato |
| Mastro Fungaiolo | Assistente AI Gemini con personalità cercatore esperta |
| Dock mobile | Barra inferiore: toolbar 56px + handle timeline 48px |
| Tier free/premium | Livello servizio con limiti timeline e precisione GPS |
| Malluvione / Mvento | Malus ambientali da pioggia eccessiva o vento secco |
| forecastsByDate | Previsioni orarie Open-Meteo per ogni giorno |
| Semaforo FM | Verde/rosa/giallo/rosso da Funghimagazine per regione |
| Segnalazione | Report utente con foto GPS su ritrovamento |
| Legal gate | Modal termini obbligatori, TTL 30 giorni localStorage |

---

# PARTE 17 — Cronologia evolutiva

1. **v0.1** — Mappa mock + slider timeline
2. **v0.2** — Meteo live Open-Meteo, ricerca avanzata, filtri regione
3. **v0.3** — Segnalazioni utente foto obbligatoria
4. **v0.4** — Meteo multi-fonte, cache Blob, cron, sync API
5. **v0.5** — Ricerca città oggi/domani, chat rule-based
6. **v0.6** — Ottimizzazione mobile: dock unificato, sheet, header compatto
7. **v0.7** — **Specifica Master**: Mastro Gemini, legal gate, tier, malus ambientali, social bonus, larve, sidebar 320px, offline reports, blur free tier

Dati editoriali Funghimagazine aggiornati al **21/06/2026**.

---

# PARTE 18 — Checklist Specifica Master PDF

| Requisito PDF | Stato | Implementazione |
|---------------|-------|-----------------|
| §4.1 Dock mobile 48px handle + 56px toolbar | ✅ | `mobileLayout.ts`, `--mobile-dock: 104px` |
| §4.1 Swipe ↑↓ espansione 44dvh | ✅ | `SearchPanel.tsx` touch handlers |
| §4.1 Compact 48px durante drag mappa | ✅ | `MushroomMap` MapDragListener + `mapCompact` |
| §4.2 Sidebar desktop 320px | ✅ | `SearchPanel.tsx` aside fixed |
| §5 Pipeline Sprout Score estratta | ✅ | `useHotspotCalculation.ts` |
| §5.2.3 Larve/vespatura (infestationEngine) | ✅ | `infestationEngine.ts` + UI alert |
| §5 Malluvione (pioggia >100mm/3g) | ✅ | `environmentalMalus.ts` ×0.30 + recovery |
| §5 Mvento (vento secco >6h) | ✅ | `environmentalMalus.ts` ×0.75 |
| §6 Social bonus +15% | ✅ | `socialScraper.ts` → `predictionEngine` |
| §7 Mastro Fungaiolo Gemini JSON | ✅ | `mastroFungaiolo.ts`, `geminiChatConfig.ts` |
| §7 recommendedHotspotId → mappa | ✅ | `useMushroomChat` onRecommendedZone |
| §8 Legal gatekeeper obbligatorio | ✅ | `LegalGatekeeperModal` + `MushroomRadarShell` |
| §9 Tier free blur ±1.5 km | ✅ | `tierUtils.ts` → mappa + LocationDetailPanel |
| §9 Tier free timeline +1 giorno | ✅ | `maxDayOffsetForTier`, chip 🔒 |
| §9 Premium +14 giorni | ✅ hook | attivazione dev/localStorage |
| §10 Segnalazioni offline IndexedDB | ✅ | `reportOfflineStore.ts` |
| §10 Sync automatico online | ✅ | `useMushroomReports` event `online` |
| Stripe checkout premium | ❌ | Solo `PremiumUpgradeBanner` dev |
| Service Worker PWA | ❌ | Non implementato |
| Social scraper live (API) | ❌ | Trend statici `campaniaSocialTrends.ts` |

---

# PARTE 19 — Flusso utente completo (step-by-step)

## Primo accesso
1. Utente apre https://radar-funghi.vercel.app
2. Vede splash loading + **LegalGatekeeperModal** (z-index 2000)
3. Legge 3 clausole (sicurezza ASL, Legge Campania 8/2007, accesso riserve)
4. Clicca **“Accetto e continuo”** → salvato in localStorage 30 giorni
5. App completa si monta (`MushroomRadarApp`)

## Ricerca zone
6. Header mostra score medio, zone attive, raggio km
7. CitySearchBar: cerca città origine (geocode Nominatim)
8. Mappa carica hotspot da `useLiveZones` → `/api/sync`
9. SearchPanel: sceglie giorno (free: Oggi/Domani; premium: fino +14g)
10. Imposta fascia oraria, raggio slider, filtro probabilità
11. Desktop: filtri avanzati in sidebar sinistra 320px
12. Mobile: swipe dock per espandere filtri; drag mappa → dock compatto

## Dettaglio zona
13. Tap cerchio hotspot → `LocationDetailPanel`
14. Vede Sprout Score, specie attiva, alert ambientali (larve/malluvione/vento/social)
15. Coordinate precise (premium) o approssimative ±1.5 km (free)
16. Link Google Maps parcheggio, grafico finestra raccolta (desktop)

## Mastro Fungaiolo
17. Mobile: 💬 nel dock → MobileSheet layout panel
18. Desktop: pulsante “Mastro Fungaiolo” top-right
19. Scrive domanda → Gemini risponde con Markdown + zona consigliata
20. Se `recommendedHotspotId` → mappa vola alla zona
21. Se Gemini offline → fallback rule-based con card zone cliccabili

## Segnalazione
22. 📍 Segnala → GPS auto + foto obbligatoria
23. POST `/api/reports` se online
24. Se offline/errore → coda IndexedDB, messaggio verde conferma
25. Al ritorno online → sync automatico, marker su mappa

## Guida principianti
26. 🎓 Guida → roadmap con zona consigliata, attrezzatura, quantità stimate

---

# PARTE 20 — Elenco completo 28 zone

| ID | Nome | Regione logica |
|----|------|----------------|
| matese-bocca-selva-estatino | Bocca della Selva — Radura Est | matese |
| matese-bocca-selva-porcino | Bocca della Selva — Faggeta Alta | matese |
| matese-cusano-radura | Cusano Mutri — Radura del Matese | matese |
| matese-cusano-fosso | Cusano Mutri — Fosso del Vallone | matese |
| matese-guardiaregia-porcino | Guardiaregia — Cresta del Matese | matese |
| matese-guardiaregia-galletti | Guardiaregia — Vallone del Calvario | matese |
| taburno-crest-estatino | Taburno — Versante Est Camposauro | taburno |
| taburno-vallone-galletti | Taburno — Vallone delle Ginestre | taburno |
| taburno-cima-porcino | Taburno — Cima Camposauro | taburno |
| sannio-pietrelcina | Sannio — Bosco di Pietrelcina | sannio |
| sannio-telese | Sannio — Bosco di Telese Terme | sannio |
| sannio-foce-sannita | Sannio — Foce Sannita / Cerreto | sannio |
| sannio-cerreto | Sannio — Bosco di Cerreto Sannita | sannio |
| sannio-pietraroja | Sannio — Bosco di Pietraroja | sannio |
| molise-matese-lago | Molise — Versante Lago del Matese | molise |
| molise-trivento | Molise — Boschi di Trivento | molise |
| molise-bojano | Molise — Vallone di Bojano | molise |
| molise-colle-anchise | Molise — Colle d'Anchise | molise |
| molise-campobasso | Molise — Monti di Campobasso | molise |
| campania-partenio | Campania — Massiccio del Partenio | campania |
| campania-laceno | Irpinia — Laceno / Montella | campania |
| campania-summonte | Irpinia — Summonte / Partenio Sud | campania |
| campania-cervati | Cilento — Monte Cervati | campania |
| basilicata-pollino-san-severino | Pollino — Boschi di San Severino Lucano | basilicata |
| basilicata-gallipoli-cognato | Gallipoli Cognato — Parco Dolomiti Lucane | basilicata |
| basilicata-vulture | Monte Vulture — Anello dei Laghi | basilicata |
| basilicata-monticchio | Appennino Lucano — Laghi di Monticchio | basilicata |
| basilicata-lagonegrese | Lagonegrese — Bosco di San Luca | basilicata |

---

# PARTE 21 — Legal gatekeeper (testo in app)

**Titolo:** Termini obbligatori — MushroomRadar

**Clausola 1 — Sicurezza sanitaria:** MushroomRadar non verifica la commestibilità. Ogni raccolto va controllato dagli ispettori micologici ASL prima del consumo.

**Clausola 2 — Legge Campania n. 8/2007:** Serve tesserino regionale. Max 3 kg/giorno per persona; rispettare orari e giorni di chiusura.

**Clausola 3 — Proprietà e riserve:** Gli hotspot possono ricadere in parchi, riserve o terreni privati; verificare sempre divieti di accesso e raccolta.

**Persistenza:** `localStorage` chiave `mushroomradar-legal-accepted`, JSON `{ at: timestamp }`, TTL **30 giorni**.

**File:** `LegalGatekeeperModal.tsx`, `MushroomRadarContext.tsx`, `MushroomRadarShell.tsx`

---

# PARTE 22 — Mastro Fungaiolo (prompt e contratto JSON)

## Personalità
Anziano Mastro Fungaiolo del Sud Italia: schietto, pragmatico, caloroso. Terminologia da cercatore (buttata, bottata, spie, micelio).

## Input al modello
- Array JSON `MastroHotspotPayload[]` con Sprout Score live per ogni zona visibile
- Meta: origine, data, fascia oraria, raggio km, stato meteo live/cache
- Trend social Campania filtrati per regioni hotspot attivi

## Regole rigide (system prompt)
1. Basarsi SOLO su hotspot forniti — non inventare zone o percentuali
2. Spiegare limiti geografici (Campania/Molise/Basilicata, ~3h da Benevento)
3. Essere onesti se condizioni pessime (Sprout Score basso, vento, allagamento)
4. Trend social solo se coerenti con Sprout Score
5. Mai sostituire identificazione micologica ASL

## Output atteso (JSON)
```json
{
  "reply": "Testo Markdown in italiano con consiglio pratico",
  "recommendedHotspotId": "taburno-crest-estatino"
}
```
`recommendedHotspotId` può essere `null` se nessuna zona è consigliabile.

## Modello e resilienza
- Default: `gemini-2.5-flash` (env `GEMINI_CHAT_MODEL`)
- SDK `@google/genai` + fallback REST con exponential backoff
- Chain modelli in `mastroGeminiRest.ts`
- Script test: `npm run verify:gemini`

## Fallback offline
Messaggio Mastro: *“orecchie tappate… sensori del bosco”* → `mushroomChatEngine.ts` rule-based

**File chiave:** `geminiChatConfig.ts`, `mastroFungaiolo.ts`, `useMushroomChat.ts`, `mastroHotspotMapper.ts`

---

# PARTE 23 — Variabili ambiente complete

| Variabile | Obbligatoria | Uso |
|-----------|--------------|-----|
| `GEMINI_API_KEY` | Sì (chat AI) | Server Action Mastro Fungaiolo |
| `GEMINI_CHAT_MODEL` | No | Default `gemini-2.5-flash` |
| `BLOB_READ_WRITE_TOKEN` | Consigliata | Cache meteo + foto segnalazioni |
| `CRON_SECRET` | Consigliata | Protezione `/api/cron/refresh` |
| `NEXT_PUBLIC_PREMIUM_TIER` | No | Forza tier premium in build |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Non usata (tile Esri attivi) |

File esempio: `.env.local.example`

---

**Fine documento — versione completa e definitiva.**  
Allegare **solo** questo file a Gemini, senza aggiungere altro testo nella chat.
