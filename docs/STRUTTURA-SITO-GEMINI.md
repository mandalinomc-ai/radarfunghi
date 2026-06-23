# MushroomRadar — Struttura sito aggiornata (per analisi Gemini)

**Versione documento:** giugno 2026  
**Ultimo commit:** enterprise multi-pagina B2B + Telegram + motore GDD/vento/shock  
**URL produzione:** https://radar-funghi.vercel.app  
**Repository:** https://github.com/mandalinomc-ai/radarfunghi  
**Percorso locale:** `C:\Users\pcgam\Desktop\progetti AI\radar funghi`

---

## Istruzioni per Gemini

Analizza **MushroomRadar** usando questo documento come unica fonte strutturale.

**Restituisci:**
1. Audit UX desktop + mobile (problemi e fix concreti)
2. Top 10 miglioramenti (P0 / P1 / P2)
3. Architettura — refactor, moduli da estrarre, rischi
4. Motore predittivo — variabili, validazione, gap
5. Roadmap 3 mesi
6. Rischi legali (patentino, raccolta, disclaimer)
7. Mockup testuale del flusso utente ideale

Cita file/moduli quando possibile. Evita consigli generici.

---

## 1. Cos'è l'applicazione

**MushroomRadar** è una web app italiana (Next.js 15, TypeScript) che aiuta a capire **dove e quando** cercare funghi in **Sannio, Matese, Taburno, Molise, Campania e Basilicata**.

Combina:
- Meteo live (Open-Meteo + bias ARPA)
- **Sprout Score** 0–100% per specie (porcino, estatino, galletto/finferlo)
- Modificatori ambientali (malluvione, vento, larve)
- Trend social / Funghimagazine
- **Mastro Fungaiolo** — chat AI (Google Gemini `gemini-2.5-flash`)
- Mappa **2D** (Leaflet + satellite Esri) e **3D** (CesiumJS stile videogioco)
- Segnalazioni utente con foto GPS (offline IndexedDB)
- Zone spia da link Google Maps
- Guida principianti multi-specie con integrazione chat
- Guida **Patentino / Tesserino** (Campania, Molise, Basilicata)

**Lingua:** 100% italiana  
**Default origine:** Benevento città (raggio max ~3h di viaggio)

---

## 2. Stack tecnologico

| Layer | Tecnologia |
|-------|------------|
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 3, font Instrument Serif (layout premium) |
| Mappa 2D | React Leaflet, tile Esri World Imagery + etichette CARTO/OSM |
| Mappa 3D | CesiumJS 1.142 (asset statico `/public/cesium/`, no bundle webpack) |
| Charts | Chart.js + react-chartjs-2 |
| Hosting | Vercel (serverless API, cron, auto-deploy da `main`) |
| Storage server | Vercel Blob (cache meteo, foto report, spy zones) |
| Offline client | IndexedDB (`reportOfflineStore.ts`) |
| AI chat | `@google/genai` + Server Action `chatWithMastro` |
| Geocoding | Nominatim OSM (proxy `/api/geocode`, solo Italia) |

**Build:** `node scripts/copy-cesium-assets.mjs && next build`  
**Postinstall:** copia Cesium da `node_modules` → `public/cesium/`

---

## 3. Variabili ambiente

| Variabile | Uso |
|-----------|-----|
| `GEMINI_API_KEY` | Mastro Fungaiolo (server-side) |
| `GEMINI_CHAT_MODEL` | Default `gemini-2.5-flash` |
| `BLOB_READ_WRITE_TOKEN` | Cache meteo + foto segnalazioni |
| `CRON_SECRET` | Protezione `/api/cron/refresh` e `/api/telegram/notify` |
| `TELEGRAM_BOT_TOKEN` | Bot Telegram Mastro Fungaiolo |
| `TELEGRAM_GROUP_CHAT_ID` | Canale/gruppo Pro per allerte outbound |
| `NEXT_PUBLIC_APP_URL` | URL produzione (webhook Telegram) |
| `NEXT_PUBLIC_PREMIUM_TIER` | Opzionale: forza tier premium |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Opzionale: terreno 3D Cesium Ion (fallback: token demo in Cesium.js) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Opzionale: Google Maps al posto di Esri |

---

## 4. Tier free / premium

| | Free | Premium |
|---|------|---------|
| Timeline | Oggi + domani | Fino a +14 giorni |
| Coordinate mappa | Sfocate ±1.5 km | GPS precise |
| Hotspot 2D | Cerchi tratteggiati, heatmap ampia | Cerchi pieni, heatmap nitida |
| Attivazione | Default | `enablePremiumDev()` o env |

Stripe **non implementato**.

---

## 5. Probabilità (stato attuale)

**Livelli attivi:** `alta` | `media` | `bassa` (+ filtro `all`)  
**Rimosso:** livello "dorato" (95–100% ora = **Alta ≥80%**)

| Livello | Soglia score | Colore heatmap |
|---------|--------------|----------------|
| Alta | ≥ 80% | Verde scuro |
| Media | 40–79% | Arancione |
| Bassa | < 40% | Rosso |

File: `src/lib/mapUtils.ts` — `getProbabilityLevel`, `PROBABILITY_FILTER_OPTIONS`, `scoreToColor`, `scoreToRadius`

**Territori mappa:** cerchi/ellissi **trasparenti** (~10–20% fill) con **bordo visibile** per delimitare il range.

---

## 6. Albero UI / navigazione (suite multi-pagina B2B)

**Tema enterprise:** sfondo `#0a0f0d`, testi sage green, accenti neon `#00ff66`.

```
layout.tsx (root)
├── AppProviders
│   ├── MushroomRadarProvider
│   ├── RadarSearchProvider      [useLiveZones, useHotspotCalculation]
│   ├── GlobalChatProvider       [chat persistente cross-route]
│   └── AppShell + GlobalChatDock [Mastro Fungaiolo FAB]
│
├── / (page.tsx)                 → HomeMapPage — mappa full-screen 2D/3D
├── /radar (page.tsx)            → RadarToolsPage — SearchPanel + filtri avanzati
├── /analytics (page.tsx)        → AnalyticsPage — Chart.js multi-variabile / multi-anno
├── /diario (page.tsx)           → DiarioPage — IndexedDB diarioUtenteStore + SoilFruitingSection
├── /classifier (page.tsx)       → MushroomClassifier — drag&drop + Gemini vision
│
└── API
    ├── POST /api/telegram/webhook   [GPS score, foto fungo, comandi bot]
    ├── GET  /api/telegram/notify    [cron allerte score ≥80%]
    └── POST /api/classify           [classificazione immagine]
```

**Legacy (non entry principale):** `MushroomRadarApp.tsx` (~1200 righe) e `MushroomRadarShell` restano nel repo ma la home usa `HomeMapPage`.

### 6.1 Pagina Home (`/`)

```
┌─────────────────────────────────────────────────────────────┐
│ AppShell nav minimale (blur)                                 │
├─────────────────────────────────────────────────────────────┤
│ MushroomMap full-screen (2D Leaflet | 3D Cesium)            │
│ + hotspot live (useLiveZones / useHotspotCalculation)       │
│ + LocationDetailPanel overlay                               │
│ Free tier: coordinate sfocate 1.5 km (tierUtils)            │
│ Pro tier: pin esatti                                        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Pagina Radar (`/radar`)

```
SearchPanel + AdvancedSearchDrawer
├── Specie, slider temporale (+14 gg Premium)
├── Raggio km, fasce altimetriche (500–900, 900–1300, 1300+)
└── ResultsExplanationPanel — breakdown Sprout Score (vento, pioggia, larve)
```

### 6.3 Layout desktop (AppShell)

### 6.2 Layout mobile

```
┌─────────────────────────────┐
│ Header compatto              │
├─────────────────────────────┤
│ MushroomMap (full screen)    │
│ + BeginnerGuideBanner        │
│   (draggable, minimizzabile) │
│ + ClimateAlertBox            │
│ + MastroChatFab              │
├─────────────────────────────┤
│ SearchPanel timeline         │
│ (collassabile / espandibile) │
├─────────────────────────────┤
│ MobileDockToolbar            │
│ Chat | Filtri | Guida |      │
│ Segnala | Altro (⋯)          │
└─────────────────────────────┘
```

**MobileSheet** (bottom sheet) per pannelli:
| `mobilePanel` | Contenuto |
|---------------|-----------|
| `filters` | AdvancedSearchForm |
| `cityPreview` | CityPreviewContent |
| `chat` | MushroomChatPanel |
| `fm` | FunghiMagazineContent |
| `legend` | LegendContent |
| `sources` | CertifiedSourcesPanel |
| `weatherSpy` | WeatherSpyRadarPanel |
| `patentino` | PatentinoGuidePanel |
| `compass` | CompassGuidePanel |

### 6.3 Modali / overlay globali

| Componente | Funzione |
|------------|----------|
| `OriginSetupModal` | Prima scelta città di partenza |
| `SetupWizardModal` | Wizard setup iniziale |
| `BeginnerGuidePanel` | Dossier N specie (1 card per specie) |
| `BeginnerGuideBanner` | Banner "Non so niente" draggable |
| `ReportMushroomSheet` | Segnalazione funghi + foto |
| `ReportDetailPanel` | Dettaglio segnalazione |
| `SpyZonePastePanel` | Incolla link Maps → zona spia |
| `SpyZoneDetailPanel` | Dettaglio zona spia |
| `PremiumUpgradeBanner` | CTA premium (dev) |
| `SyncToast` | Toast sync offline/online |

---

## 7. Mappa — 2D vs 3D

**Entry:** `src/components/MushroomMap.tsx`  
**Toggle:** `src/components/map/MapViewModeToggle.tsx` (sessionStorage `mushroomradar-map-view`)

### 7.1 Mappa 2D — `MushroomMapLeaflet.tsx`

- Tile Esri satellite + `MapLabelLayers` (Esri + CARTO labels)
- Cerchio raggio origine (blu, tratteggiato)
- `HeatmapOverlay` — cerchi probabilità trasparenti per zona
- `HotspotMarkers` — pin specie (porcino/galletto/estatino)
- `UserReportMarkers`, `SpyZoneMarkers`
- Preview hover: `MapPreviewOverlay` + `MapPreviewCard`
- Drag mappa → `onMapDragChange` → dock compatto

### 7.2 Mappa 3D — `MushroomMap3D.tsx`

- Cesium caricato da `/cesium/Cesium.js` (`loadCesium.ts`)
- Config: `cesiumMapConfig.ts` — satellite, hillshade, mappa fisica (monti/fiumi/laghi), terreno 3D
- Visual territori: `cesiumZoneVisuals.ts`
  - Ellissi colorate per **macro-regione** (Matese, Sannio, Taburno, Molise, Campania, Basilicata)
  - Fill ~10–16% alpha, bordo specie visibile
  - Faro cilindrico centrale per zona
  - Badge regione a zoom alto
- Fix label orizzonte: pitch limitato, label solo zona selezionata o zoom basso
- Error boundary → fallback automatico a 2D se crash
- **Importante:** nessun `import` runtime da pacchetto `cesium` (webpack IgnorePlugin)

---

## 8. Flusso dati principale

```
UTENTE
  │
  ▼
MushroomRadarContext (tier, legalAccepted, maxDayOffset)
  │
  ▼
MushroomRadarApp
  │
  ├── useLiveZones ──────────► GET /api/sync?date=YYYY-MM-DD
  │                                ├── /api/weather (Open-Meteo + cache Blob)
  │                                └── fonti + count report
  │
  ├── useHotspotCalculation ─► enrichZonesFromOrigin
  │                            filterZonesByRegions + rangeKm
  │                            buildHotspots (predictionEngine)
  │                            matchesProbabilityFilter
  │
  ├── useMushroomReports ────► GET/POST /api/reports + IndexedDB offline
  ├── useSpyZones ───────────► GET/POST /api/spy-zones
  ├── useMushroomChat ───────► chatWithMastro (Server Action → Gemini)
  ├── useClimateAlerts ──────► climateChangeAlerts + monitor UI
  └── useWeatherHistory ─────► /api/weather/history
```

### Pipeline Sprout Score (`predictionEngine.ts`)

1. **28 zone** in `mockData.ts` + coordinate `zoneRegistry.ts`
2. Meteo arricchisce zone per data (`zoneWeather.ts`, `weatherAggregator.ts`)
3. `calculateSproutScore()` per specie × ore nella fascia selezionata
4. Modificatori:
   - `environmentalMalus.ts` — malluvione, vento secco
   - `infestationEngine.ts` — larve/vespatura
   - `socialScraper.ts` — bonus social
   - `funghimagazineData.ts` — semaforo regionale
   - `zoneReliabilityBonus.ts`, `citizenScienceAggregator.ts`
5. `buildHotspots()` — specie migliore + score max per zona
6. Filtro probabilità + tier blur coordinate (`tierUtils.ts`)

---

## 9. Chat AI — Mastro Fungaiolo

| File | Ruolo |
|------|-------|
| `app/actions/mastroFungaiolo.ts` | Server Action `chatWithMastro` |
| `lib/geminiChatConfig.ts` | Prompt, payload zone, model chain |
| `lib/mastroGeminiRest.ts` | REST fallback + backoff |
| `lib/mastroHotspotMapper.ts` | MapHotspot → JSON per Gemini |
| `lib/chatFollowUp.ts` | Follow-up contestuali |
| `lib/chatZoneResults.ts` | Risultati zone per chat |
| `hooks/useMushroomChat.ts` | Stato chat, invio, fallback |
| `lib/mushroomChatEngine.ts` | Fallback rule-based se Gemini fallisce |

Integrazione guida principianti: `beginnerGuide.ts` → `buildGuideChatPrompt()` → auto-invio a Mastro.

---

## 10. Guida principianti ("Non so niente")

| File | Ruolo |
|------|-------|
| `lib/beginnerGuide.ts` | `generateBeginnerGuidePlans()` — **1 dossier per specie** |
| `components/BeginnerGuidePanel.tsx` | UI premium, N card specie |
| `components/BeginnerGuideBanner.tsx` | Banner draggable, −/✕, CTA chat |
| `lib/guideBannerStore.ts` | Persistenza posizione banner |

Indipendente dal filtro specie mappa.

---

## 11. Patentino / Tesserino

| File | Ruolo |
|------|-------|
| `lib/patentinoGuideData.ts` | Guide Campania, Molise, Basilicata, link ufficiali, FAQ |
| `components/PatentinoGuidePanel.tsx` | Tab regioni, passi, documenti, costi, limiti |

Accesso: SearchPanel sidebar, Mobile Altro → Patentino, DesktopActionRail 🪪

---

## 12. API Routes

| Endpoint | Metodo | Funzione |
|----------|--------|----------|
| `/api/sync` | GET | Zone + meteo + fonti per data |
| `/api/weather` | GET | Cache/refresh meteo Open-Meteo |
| `/api/weather/history` | GET | Storico piogge/temp per grafici |
| `/api/geocode` | GET | Geocoding Nominatim (Italia) |
| `/api/reports` | GET/POST | Segnalazioni community |
| `/api/reports/photo/[id]` | GET | Foto segnalazione da Blob |
| `/api/spy-zones` | GET/POST | Zone spia salvate |
| `/api/sources` | GET | Fonti certificate attive |
| `/api/sources/catalog` | GET | Catalogo completo fonti |
| `/api/sources/verify` | POST | Verifica URL fonte |
| `/api/citizen-science` | GET | Dati citizen science |
| `/api/cron/refresh` | GET | Warm cache meteo (cron Vercel 04:00 UTC) |

**Server Actions:**
- `app/actions/mastroFungaiolo.ts` — chat AI
- `app/actions/geminiChat.ts` — wrapper retrocompat

---

## 13. Struttura file completa

```
radar funghi/
├── vercel.json                         # Cron + framework nextjs
├── next.config.ts                      # Cesium IgnorePlugin, CESIUM_BASE_URL
├── package.json
├── tailwind.config.ts
├── .env.local.example
├── scripts/
│   ├── copy-cesium-assets.mjs          # Cesium → public/cesium/
│   ├── verify-gemini.mjs
│   ├── verify-chat-map.ts
│   ├── verify-chat-followup.ts
│   ├── verify-gps-links.ts
│   └── ...
│
├── public/
│   ├── cesium/                         # Generato (gitignore), ~50MB
│   └── sw.js                           # Service worker PWA
│
├── docs/
│   ├── STRUTTURA-SITO-GEMINI.md        # ← questo documento
│   └── MUSHROOMRADAR-ANALISI-GEMINI.md # Documento analisi esteso (parz. datato)
│
└── src/
    ├── app/
    │   ├── layout.tsx                  # Font Instrument Serif, metadata
    │   ├── page.tsx                    # Provider + Shell
    │   ├── globals.css                 # guide-shell, app-shell-dock, safe-area
    │   ├── actions/
    │   │   ├── mastroFungaiolo.ts
    │   │   └── geminiChat.ts
    │   └── api/                        # (vedi sezione 12)
    │
    ├── context/
    │   └── MushroomRadarContext.tsx    # tier, legal, maxDayOffset
    │
    ├── components/                     # 57 file — vedi sezione 14
    ├── hooks/                          # 12 hook — vedi sezione 15
    ├── lib/                            # 78 moduli — vedi sezione 16
    └── types/
        └── cesium-global.d.ts          # window.Cesium typings
```

---

## 14. Componenti (`src/components/`)

### Core app
| File | Ruolo |
|------|-------|
| `MushroomRadarShell.tsx` | Gate legal → MushroomRadarApp |
| `MushroomRadarApp.tsx` | ★ Orchestratore stato + layout |
| `Header.tsx` | Header stats + branding |
| `SearchPanel.tsx` | Sidebar desktop + timeline mobile |
| `MobileBottomBar.tsx` | MobileDockToolbar |
| `MobileSheet.tsx` | Bottom sheet generico |
| `DesktopActionRail.tsx` | Rail azioni desktop dx |

### Mappa
| File | Ruolo |
|------|-------|
| `MushroomMap.tsx` | Switch 2D/3D + error boundary |
| `MushroomMapLeaflet.tsx` | Mappa 2D completa |
| `MushroomMap3D.tsx` | Globo Cesium 3D |
| `map/MapViewModeToggle.tsx` | Toggle 2D / 3D T |
| `map/mushroomMapProps.ts` | Props condivise mappa |
| `map/MapLabelLayers.tsx` | Overlay etichette Leaflet |
| `map/MapPreviewCard.tsx` | Preview hover zona |
| `map/MapPreviewOverlay.tsx` | Overlay preview |

### Dettaglio zona
| File | Ruolo |
|------|-------|
| `LocationDetailPanel.tsx` | Pannello dettaglio zona selezionata |
| `ZoneEnvironmentAlerts.tsx` | Alert larve, malluvione, vento |
| `CollectionWindowChart.tsx` | Grafico score per ora |
| `SoilFruitingSection.tsx` | Modello suolo/fruttificazione |
| `SeasonalSpeciesBanner.tsx` | Banner stagionalità specie |

### Chat & AI
| File | Ruolo |
|------|-------|
| `MushroomChatPanel.tsx` | UI chat Mastro Fungaiolo |
| `MastroChatFab.tsx` | FAB chat verde floating |

### Guide & educazione
| File | Ruolo |
|------|-------|
| `BeginnerGuidePanel.tsx` | Guida principianti multi-specie |
| `BeginnerGuideBanner.tsx` | Banner draggable "Non so niente" |
| `PatentinoGuidePanel.tsx` | Guida patentino/tesserino |
| `CompassGuidePanel.tsx` | Bussola + guida territorio |
| `CompassRose.tsx` | Rosa dei venti SVG |
| `CompassMiniStrip.tsx` | Strip bussola compatta |
| `TerritoryGuideSection.tsx` | Media Wikipedia/YouTube territorio |
| `MycologyKnowledgeSections.tsx` | Sezioni micologia |
| `HealthSafetyBanner.tsx` | Avvisi sicurezza |
| `LegalGatekeeperModal.tsx` | Termini legali obbligatori |

### Meteo & monitor
| File | Ruolo |
|------|-------|
| `WeatherSpyRadarPanel.tsx` | Meteo storico + funghi spia |
| `WeatherHistoryChart.tsx` | Grafico piogge Chart.js |
| `ClimateAlertBox.tsx` | Monitor climatico draggable |
| `FunghiMagazineContent.tsx` | Feed editoriale FM |
| `FunghiMagazineBanner.tsx` | Banner FM |

### Segnalazioni & spia
| File | Ruolo |
|------|-------|
| `ReportMushroomSheet.tsx` | Form segnalazione + offline |
| `ReportDetailPanel.tsx` | Dettaglio report |
| `UserReportMarkers.tsx` | Marker report su mappa 2D |
| `SpyZonePastePanel.tsx` | Incolla link Maps |
| `SpyZoneDetailPanel.tsx` | Dettaglio zona spia |
| `SpyZoneMarkers.tsx` | Marker spy su mappa 2D |

### Ricerca & setup
| File | Ruolo |
|------|-------|
| `CitySearchBar.tsx` | Ricerca città + preview giorno |
| `AdvancedSearchDrawer.tsx` | Filtri avanzati |
| `OriginPicker.tsx` | Selettore origine |
| `OriginSetupModal.tsx` | Modal setup origine |
| `SetupWizardModal.tsx` | Wizard first-run |
| `TimelineSlider.tsx` | Slider giorni timeline |
| `SpeciesFilter.tsx` | Filtro specie |
| `SpeciesFilterContent.tsx` | Contenuto filtro specie |

### Altro UI
| File | Ruolo |
|------|-------|
| `LegendContent.tsx` | Legenda probabilità + simboli |
| `CertifiedSourcesPanel.tsx` | Fonti certificate verificate |
| `DataSourcesBanner.tsx` | Banner fonti dati |
| `PremiumUpgradeBanner.tsx` | Banner premium |
| `SyncToast.tsx` | Toast sync |
| `ServiceWorkerRegister.tsx` | Registrazione SW |

---

## 15. Hooks (`src/hooks/`)

| Hook | Ruolo |
|------|-------|
| `useLiveZones.ts` | Fetch zone/meteo, refresh 3 min |
| `useHotspotCalculation.ts` | Pipeline hotspot + filtri |
| `useMushroomChat.ts` | Chat Gemini + fallback |
| `useMushroomReports.ts` | Report server + sync offline |
| `useSpyZones.ts` | Zone spia |
| `useClimateAlerts.ts` | Alert climatici |
| `useWeatherHistory.ts` | Storico meteo grafici |
| `useGeocodeSearch.ts` | Autocomplete città |
| `useLivePosition.ts` | GPS utente |
| `useDeviceCompass.ts` | Bussola device |
| `useMapCompactDebounce.ts` | Debounce drag mappa → dock |
| `useMapMarkerActivation.ts` | Click/double-click marker |

---

## 16. Librerie core (`src/lib/`)

### Predizione & zone
| File | Ruolo |
|------|-------|
| `predictionEngine.ts` | ★ Sprout Score + buildHotspots |
| `mockData.ts` | 28 zone fungine statiche |
| `zoneRegistry.ts` | Coordinate zone |
| `zoneFilters.ts` | Filtri regione/raggio |
| `zoneWeather.ts` | Meteo per zona/data |
| `environmentalMalus.ts` | Malluvione, vento |
| `infestationEngine.ts` | Larve |
| `funghimagazineData.ts` | Semaforo FM regionale |
| `socialScraper.ts` | Bonus social |
| `foragingPresets.ts` | Preset ricerca |
| `benevento.ts` | Default origine + raggio |

### Mappa & GPS
| File | Ruolo |
|------|-------|
| `mapUtils.ts` | Probabilità, colori, link Maps/Earth |
| `tierUtils.ts` | Free/premium, blur coords |
| `loadCesium.ts` | Loader Cesium statico |
| `cesiumMapConfig.ts` | Config globo 3D, camera, layer |
| `cesiumZoneVisuals.ts` | Territori colorati 3D |
| `zoneCoordinateService.ts` | Centro mappa per tier |
| `bearingUtils.ts` | Calcolo bearing bussola |
| `geoUtils.ts` | Distanze, bearing |

### Chat & guida
| File | Ruolo |
|------|-------|
| `geminiChatConfig.ts` | Prompt Mastro Fungaiolo |
| `mushroomChatEngine.ts` | Fallback NL rule-based |
| `beginnerGuide.ts` | Piano guida principianti |
| `patentinoGuideData.ts` | Dati patentino regionale |
| `territoryGuideData.ts` | Media territorio per zona |
| `chatFollowUp.ts` | Follow-up chat |

### Meteo & dati
| File | Ruolo |
|------|-------|
| `weatherAggregator.ts` | Aggregazione Open-Meteo |
| `weatherCache.ts` | Cache memory + Blob |
| `openMeteoHistory.ts` | Storico piogge |
| `regionalAgrometeo.ts` | Bias ARPA |
| `climateChangeAlerts.ts` | Alert anomalie clima |
| `citizenScienceAggregator.ts` | Dati citizen science |

### Report & spia
| File | Ruolo |
|------|-------|
| `reportStore.ts` | Persistenza report Blob |
| `reportOfflineStore.ts` | Coda IndexedDB offline |
| `reportValidationEngine.ts` | Validazione foto GPS |
| `spyZoneStore.ts` | Store zone spia Blob |
| `mapsLinkParser.ts` | Parse link Google Maps |

### Fonti & certificazione
| File | Ruolo |
|------|-------|
| `sourceRegistry.ts` | Registry fonti |
| `sourceCertificationEngine.ts` | Verifica URL fonti |
| `certifiedSources.ts` | Fonti attive |
| `dataSources.ts` | Metadata fonti |

### Store client
| File | Ruolo |
|------|-------|
| `originStore.ts` | Origine utente localStorage |
| `setupStore.ts` | Wizard setup flags |
| `guideBannerStore.ts` | Posizione banner guida |
| `climateMonitorStore.ts` | Stato monitor clima |
| `mobileLayout.ts` | Costanti layout mobile |

---

## 17. Stato applicativo principale (`MushroomRadarApp`)

| State | Descrizione |
|-------|-------------|
| `criteria: SearchCriteria` | Origine, data, fascia oraria (da→a), specie, regioni |
| `rangeKm` | Raggio ricerca km |
| `probabilityFilter` | all / alta / media / bassa |
| `selectedHotspot` | Zona cliccata |
| `mobilePanel` | Sheet mobile aperto |
| `mobileSearchExpanded` | Timeline espansa |
| `mapCompact` | true durante drag → UI compatta |
| `chatOpen` | Chat desktop aperta |
| `beginnerGuideResult` | Risultato guida N specie |
| `userReports` / `pendingCount` | Segnalazioni + coda offline |
| `spyZones` | Zone spia |
| `originReady` | Setup origine completato |

---

## 18. Regioni e zone (28 entro ~3h da Benevento)

**Macro-regioni:** matese | taburno | sannio | molise | campania | basilicata

**Specie:** porcino | galletto (finferlo) | estatino

**Colori specie (`SPECIES_COLORS`):**
- Porcino: `#e07830`
- Galletto: `#7ab872`
- Estatino: `#f59a4a`

**Colori territorio 3D (`REGION_TERRITORY_COLORS`):**
- Matese: teal `#14b8a6`
- Taburno: amber `#f59e0b`
- Sannio: green `#22c55e`
- Molise: blue `#3b82f6`
- Campania: orange `#e07830`
- Basilicata: purple `#a78bfa`

---

## 19. Modifiche recenti (giugno 2026)

| Commit | Contenuto |
|--------|-----------|
| `a628db1` | Rimossa probabilità dorata; territori più trasparenti |
| `9af4ae9` | Fix crash 3D (no import cesium webpack); fallback 2D |
| `51d68ca` | Mappa 3D stile videogioco + guida Patentino |
| `1263e60` | Mappa 3D HD, orbita 360°, layout premium |
| `2e912f9` | Guida principianti multi-specie + chat AI integrata |

---

## 20. Problemi noti / debito tecnico

1. **MushroomRadarApp.tsx** ~1200 righe — candidato a split in sub-layout
2. **Premium** senza pagamento reale (Stripe non integrato)
3. **Cesium Ion token** opzionale — terreno 3D usa token demo se assente
4. **Documento analisi esteso** (`MUSHROOMRADAR-ANALISI-GEMINI.md`) parzialmente datato rispetto a 3D/Patentino
5. Layout premium desktop parzialmente applicato (dock/sidebar ok, resto da rifinire)
6. Service worker PWA minimale (`sw.js`)

---

## 21. Flusso utente tipico

```
1. Apri radar-funghi.vercel.app
2. Accetta termini legali (LegalGatekeeperModal)
3. Setup origine (Benevento default) + wizard opzionale
4. Imposta giorno, fascia oraria (06:00–10:00 default), specie
5. Vede hotspot su mappa 2D (o passa a 3D T)
6. Clicca zona → LocationDetailPanel (score, alert, Maps, bussola)
7. Opzionale: "Non so niente" → guida principianti + chat AI
8. Opzionale: Patentino → guida abilitazione legale
9. Opzionale: Segnala funghi con foto GPS
10. Opzionale: Chiedi al Mastro Fungaiolo in chat
```

---

*Fine documento — pronto per upload su Gemini.*
