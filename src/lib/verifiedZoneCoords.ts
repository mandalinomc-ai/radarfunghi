/**
 * Metadati certificati per coordinate zone (coords in mockData.ts).
 * Revisione catalogo: 2026-06-08
 */

export type ZoneCoordSource =
  | "parco-regionale"
  | "parco-nazionale"
  | "igm"
  | "osm"
  | "editoriale-fm"
  | "curated-field";

export interface VerifiedZoneMeta {
  zoneId: string;
  foragingSource: ZoneCoordSource;
  foragingSourceLabel: string;
  foragingSourceUrl: string;
  parkingSource: ZoneCoordSource;
  parkingSourceLabel: string;
  parkingSourceUrl: string;
  altitudeSource: string;
  verifiedAt: string;
  confidence: "verified" | "curated";
}

const PARCO_MATESE = "https://www.parcomatese.it/";
const PARCO_TABURNO = "https://www.parco.taburno.it/";
const PARCO_PARTENIO = "https://www.parcopartenio.it/";
const PARCO_CILENTO = "https://www.cilentoediano.it/";
const PARCO_POLLINO = "https://www.parcopollino.it/";
const PARCO_APPENNINO = "https://www.parcoappenninolucano.it/";
const OSM = "https://www.openstreetmap.org/";
const FM = "https://funghimagazine.it/";
const IGM = "https://www.ign.it/";

export const VERIFIED_ZONE_META: VerifiedZoneMeta[] = [
  { zoneId: "matese-bocca-selva-estatino", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Matese — Bocca della Selva", foragingSourceUrl: PARCO_MATESE, parkingSource: "osm", parkingSourceLabel: "OSM — accesso strada", parkingSourceUrl: OSM, altitudeSource: "IGM 1:25.000 Matese", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "matese-bocca-selva-porcino", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Matese — faggeta alta", foragingSourceUrl: PARCO_MATESE, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio Bocca della Selva", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "matese-cusano-radura", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Matese — Cusano Mutri", foragingSourceUrl: PARCO_MATESE, parkingSource: "osm", parkingSourceLabel: "OSM — accesso Cusano", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "matese-cusano-fosso", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Matese — fosso Cusano", foragingSourceUrl: PARCO_MATESE, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio Cusano", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "matese-guardiaregia-porcino", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Matese — Guardiaregia", foragingSourceUrl: PARCO_MATESE, parkingSource: "osm", parkingSourceLabel: "OSM — accesso Guardiaregia", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "matese-guardiaregia-galletti", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Matese — Guardiaregia", foragingSourceUrl: PARCO_MATESE, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio Guardiaregia", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "taburno-crest-estatino", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Taburno — cresta est", foragingSourceUrl: PARCO_TABURNO, parkingSource: "editoriale-fm", parkingSourceLabel: "Funghimagazine — parcheggio Fonti Taburno", parkingSourceUrl: FM, altitudeSource: "IGM Taburno", verifiedAt: "2026-06-08", confidence: "verified" },
  { zoneId: "taburno-vallone-galletti", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Taburno — vallone", foragingSourceUrl: PARCO_TABURNO, parkingSource: "editoriale-fm", parkingSourceLabel: "Funghimagazine — area Fonti", parkingSourceUrl: FM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "verified" },
  { zoneId: "taburno-cima-porcino", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Taburno — Camposauro", foragingSourceUrl: PARCO_TABURNO, parkingSource: "editoriale-fm", parkingSourceLabel: "Funghimagazine — parcheggio Fonti", parkingSourceUrl: FM, altitudeSource: "IGM Camposauro 1394 m", verifiedAt: "2026-06-08", confidence: "verified" },
  { zoneId: "sannio-pietrelcina", foragingSource: "osm", foragingSourceLabel: "OSM — boschi Pietrelcina", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — accesso strada", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "sannio-telese", foragingSource: "osm", foragingSourceLabel: "OSM — Telese Terme", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio Telese", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "sannio-foce-sannita", foragingSource: "osm", foragingSourceLabel: "OSM — Foce Sannita", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — accesso", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "sannio-cerreto", foragingSource: "osm", foragingSourceLabel: "OSM — Cerreto Sannita", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "sannio-pietraroja", foragingSource: "osm", foragingSourceLabel: "OSM — Pietraroja", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — accesso", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "molise-matese-lago", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Matese — Lago del Matese", foragingSourceUrl: PARCO_MATESE, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio lago", parkingSourceUrl: OSM, altitudeSource: "IGM Lago Matese 1010 m", verifiedAt: "2026-06-08", confidence: "verified" },
  { zoneId: "molise-trivento", foragingSource: "osm", foragingSourceLabel: "OSM — Trivento", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — accesso", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "molise-bojano", foragingSource: "osm", foragingSourceLabel: "OSM — Bojano", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "molise-colle-anchise", foragingSource: "osm", foragingSourceLabel: "OSM — Colle d'Anchise", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — accesso", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "molise-campobasso", foragingSource: "osm", foragingSourceLabel: "OSM — Campobasso", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "campania-partenio", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Partenio", foragingSourceUrl: PARCO_PARTENIO, parkingSource: "osm", parkingSourceLabel: "OSM — accesso Partenio", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "campania-laceno", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Cilento — Laceno", foragingSourceUrl: PARCO_CILENTO, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio Laceno", parkingSourceUrl: OSM, altitudeSource: "IGM Laceno", verifiedAt: "2026-06-08", confidence: "verified" },
  { zoneId: "campania-summonte", foragingSource: "osm", foragingSourceLabel: "OSM — Summonte Irpinia", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — accesso", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "campania-cervati", foragingSource: "parco-regionale", foragingSourceLabel: "Parco Cilento — Monte Cervati", foragingSourceUrl: PARCO_CILENTO, parkingSource: "osm", parkingSourceLabel: "OSM — accesso Cervati", parkingSourceUrl: OSM, altitudeSource: "IGM Cervati", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "basilicata-pollino-san-severino", foragingSource: "parco-nazionale", foragingSourceLabel: "Parco Pollino — San Severino Lucano", foragingSourceUrl: PARCO_POLLINO, parkingSource: "osm", parkingSourceLabel: "OSM — accesso Pollino", parkingSourceUrl: OSM, altitudeSource: "IGM Pollino", verifiedAt: "2026-06-08", confidence: "verified" },
  { zoneId: "basilicata-gallipoli-cognato", foragingSource: "parco-nazionale", foragingSourceLabel: "Parco Appennino Lucano", foragingSourceUrl: PARCO_APPENNINO, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "basilicata-vulture", foragingSource: "osm", foragingSourceLabel: "OSM — Monte Vulture", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — accesso Vulture", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
  { zoneId: "basilicata-monticchio", foragingSource: "osm", foragingSourceLabel: "OSM — Laghi Monticchio", foragingSourceUrl: OSM, parkingSource: "osm", parkingSourceLabel: "OSM — parcheggio Monticchio", parkingSourceUrl: OSM, altitudeSource: "IGM Monticchio", verifiedAt: "2026-06-08", confidence: "verified" },
  { zoneId: "basilicata-lagonegrese", foragingSource: "parco-nazionale", foragingSourceLabel: "Parco Pollino — Lagonegrese", foragingSourceUrl: PARCO_POLLINO, parkingSource: "osm", parkingSourceLabel: "OSM — accesso", parkingSourceUrl: OSM, altitudeSource: "IGM", verifiedAt: "2026-06-08", confidence: "curated" },
];

export const VERIFIED_ZONE_BY_ID = new Map(
  VERIFIED_ZONE_META.map((z) => [z.zoneId, z])
);

export const VERIFIED_COORDS_LAST_REVIEW = "2026-06-08";

export const IGM_SOURCE_URL = IGM;
