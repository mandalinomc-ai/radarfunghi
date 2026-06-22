/**
 * Fetch live citizen-science observations (iNaturalist + Mushroom Observer)
 * nel bounding box Campania / Molise / Basilicata.
 */
import { haversineKm } from "./geoUtils";
import type { MushroomSpecies } from "./types";

export interface CitizenObservation {
  source: "inaturalist" | "mushroom-observer";
  id: number;
  speciesGuess: string;
  observedOn: string;
  lat: number;
  lng: number;
  quality?: string;
}

export interface CitizenScienceSnapshot {
  fetchedAt: string;
  observations: CitizenObservation[];
  inatTotal: number;
  moTotal: number;
  sources: string[];
}

const RADAR_BBOX = {
  south: 39.8,
  north: 42.1,
  west: 13.8,
  east: 16.5,
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache: { at: number; data: CitizenScienceSnapshot } | null = null;

const FUNGI_TAXON_ID = "47170";

const SPECIES_KEYWORDS: Record<MushroomSpecies, RegExp[]> = {
  porcino: [/porcin/i, /boletus/i, /estatin/i, /aestivalis/i, /edulis/i],
  estatino: [/estatin/i, /aestivalis/i, /reticulat/i, /porcin.*est/i],
  galletto: [/finferl/i, /gallett/i, /cantharell/i, /chanterelle/i],
};

async function fetchINaturalistObservations(): Promise<{
  obs: CitizenObservation[];
  total: number;
}> {
  const params = new URLSearchParams({
    taxon_id: FUNGI_TAXON_ID,
    swlat: String(RADAR_BBOX.south),
    swlng: String(RADAR_BBOX.west),
    nelat: String(RADAR_BBOX.north),
    nelng: String(RADAR_BBOX.east),
    per_page: "200",
    order_by: "observed_on",
    order: "desc",
    geo: "true",
  });

  const res = await fetch(
    `https://api.inaturalist.org/v1/observations?${params}`,
    {
      headers: { "User-Agent": "MushroomRadar/1.0 (+https://radar-funghi.vercel.app)" },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!res.ok) throw new Error(`iNaturalist HTTP ${res.status}`);

  const data = (await res.json()) as {
    total_results?: number;
    results?: Array<{
      id: number;
      species_guess?: string;
      observed_on?: string;
      quality_grade?: string;
      geojson?: { coordinates?: [number, number] };
    }>;
  };

  const obs: CitizenObservation[] = (data.results ?? [])
    .filter((r) => r.geojson?.coordinates?.length === 2)
    .map((r) => ({
      source: "inaturalist" as const,
      id: r.id,
      speciesGuess: r.species_guess ?? "Fungi",
      observedOn: r.observed_on ?? "",
      lat: r.geojson!.coordinates![1],
      lng: r.geojson!.coordinates![0],
      quality: r.quality_grade,
    }));

  return { obs, total: data.total_results ?? obs.length };
}

async function fetchMushroomObserverObservations(): Promise<{
  obs: CitizenObservation[];
  total: number;
}> {
  const params = new URLSearchParams({
    format: "json",
    detail: "high",
    south: String(RADAR_BBOX.south),
    north: String(RADAR_BBOX.north),
    west: String(RADAR_BBOX.west),
    east: String(RADAR_BBOX.east),
    date: "20240101-20261231",
    has_public_lat_lng: "true",
  });

  const res = await fetch(
    `https://mushroomobserver.org/api2/observations?${params}`,
    {
      headers: { "User-Agent": "MushroomRadar/1.0" },
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!res.ok) throw new Error(`MushroomObserver HTTP ${res.status}`);

  const data = (await res.json()) as {
    number_of_records?: number;
    results?: Array<{
      id: number;
      date?: string;
      lat?: number;
      lng?: number;
      consensus_name?: string;
    }>;
  };

  const obs: CitizenObservation[] = (data.results ?? [])
    .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
    .map((r) => ({
      source: "mushroom-observer" as const,
      id: r.id,
      speciesGuess: r.consensus_name ?? "Fungi",
      observedOn: r.date ?? "",
      lat: r.lat!,
      lng: r.lng!,
    }));

  return { obs, total: data.number_of_records ?? obs.length };
}

export async function fetchCitizenScienceSnapshot(
  force = false
): Promise<CitizenScienceSnapshot> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }

  const [inat, mo] = await Promise.allSettled([
    fetchINaturalistObservations(),
    fetchMushroomObserverObservations(),
  ]);

  const inatObs = inat.status === "fulfilled" ? inat.value.obs : [];
  const moObs = mo.status === "fulfilled" ? mo.value.obs : [];
  const inatTotal =
    inat.status === "fulfilled" ? inat.value.total : 0;
  const moTotal = mo.status === "fulfilled" ? mo.value.total : moObs.length;

  const snapshot: CitizenScienceSnapshot = {
    fetchedAt: new Date().toISOString(),
    observations: [...inatObs, ...moObs],
    inatTotal,
    moTotal,
    sources: [
      "iNaturalist API (taxon Fungi)",
      "Mushroom Observer API2",
    ],
  };

  cache = { at: Date.now(), data: snapshot };
  return snapshot;
}

export function matchSpeciesFromGuess(
  guess: string,
  species: MushroomSpecies
): boolean {
  const patterns = SPECIES_KEYWORDS[species];
  return patterns.some((re) => re.test(guess));
}

export function observationsNearZone(
  snapshot: CitizenScienceSnapshot,
  lat: number,
  lng: number,
  radiusKm = 18,
  maxAgeDays = 21
): CitizenObservation[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return snapshot.observations.filter((o) => {
    if (o.observedOn && o.observedOn < cutoffIso) return false;
    return haversineKm(lat, lng, o.lat, o.lng) <= radiusKm;
  });
}

export function countSpeciesNearZone(
  snapshot: CitizenScienceSnapshot,
  lat: number,
  lng: number,
  species: MushroomSpecies,
  radiusKm = 18
): number {
  return observationsNearZone(snapshot, lat, lng, radiusKm).filter((o) =>
    matchSpeciesFromGuess(o.speciesGuess, species)
  ).length;
}
