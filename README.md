# MushroomRadar 🍄

Applicazione web (SPA) per la predizione e mappatura satellitare delle zone a più alta probabilità di nascita di funghi nel Sannio, Molise e Campania.

## Funzionalità

- **Motore predittivo (Fungal Sprout Score)**: calcolo orario del punteggio 0-100% basato su piogge, umidità del suolo, shock termico, quota ed esposizione
- **Integrazione Funghimagazine.it**: bollettino meteo live, semaforo nascite per regione, aggiornamento 08/06/2026
- **Guida per principianti**: pulsante "NON SO NIENTE — DIMMI TUTTO!" genera roadmap completa con orari, quantità stimata, attrezzatura e navigatore
- **Mappa satellitare interattiva**: vista ibrida Esri World Imagery con zoom fino al dettaglio arboreo
- **Overlay heatmap**: cerchi sfumati semitrasparenti per visualizzare le aree ad alta probabilità
- **Pannello dettaglio**: coordinate GPS, tipo di macchia boschiva, grafico finestra di raccolta, deep link Google Maps
- **Timeline oraria**: slider per simulare previsioni a giorni e ore diverse
- **Dark mode**: interfaccia scura con palette verde foresta e arancione fungo

## Zone mock incluse

- **Matese**: Bocca della Selva, Cusano Mutri, Guardiaregia
- **Taburno**: Camposauro, Vallone delle Ginestre
- **Sannio, Molise, Campania**: zone aggiuntive

## Avvio

```bash
cd "radar funghi"
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React Leaflet + tile satellitari Esri

## Google Maps API (opzionale)

Per usare Google Maps al posto dei tile Esri, aggiungi la chiave API in `.env.local`:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
```
