/**
 * Incrocio meteo esteso + citizen science + AMINT + editoriale nel moltiplicatore Sprout.
 */
import type { FungalZone, MushroomSpecies } from "./types";
import {
  amintSignalMultiplier,
  getAmintHintForZone,
} from "./amintRegionalHints";
import {
  countSpeciesNearZone,
  fetchCitizenScienceSnapshot,
  type CitizenScienceSnapshot,
} from "./citizenScienceAggregator";

export interface CrossSourceZoneIntel {
  zoneId: string;
  multiplier: number;
  citizenObsCount: number;
  citizenSpeciesCount: number;
  amintSignal?: string;
  pressureMultiplier: number;
  sources: string[];
  notes: string[];
}

let intelCache: {
  at: number;
  snapshot: CitizenScienceSnapshot;
  byZone: Map<string, CrossSourceZoneIntel>;
} | null = null;

const INTEL_TTL_MS = 6 * 60 * 60 * 1000;

function citizenScienceMultiplier(speciesCount: number, totalCount: number): number {
  let m = 1;
  if (speciesCount >= 3) m += 0.12;
  else if (speciesCount >= 1) m += 0.07;
  else if (totalCount >= 2) m += 0.04;
  return m;
}

export async function buildCrossSourceIntel(
  zones: Pick<FungalZone, "id" | "lat" | "lng" | "region">[],
  force = false
): Promise<Map<string, CrossSourceZoneIntel>> {
  if (
    !force &&
    intelCache &&
    Date.now() - intelCache.at < INTEL_TTL_MS
  ) {
    return intelCache.byZone;
  }

  const snapshot = await fetchCitizenScienceSnapshot(force);
  const byZone = new Map<string, CrossSourceZoneIntel>();

  for (const zone of zones) {
    const near = snapshot.observations.filter(
      (o) =>
        Math.abs(o.lat - zone.lat) < 0.25 && Math.abs(o.lng - zone.lng) < 0.25
    );
    const notes: string[] = [];
    const sources = ["iNaturalist", "Mushroom Observer"];

    notes.push(
      `Citizen science: ${snapshot.inatTotal} osservazioni iNat nel radar, ${snapshot.moTotal} MO in bbox.`
    );

    byZone.set(zone.id, {
      zoneId: zone.id,
      multiplier: 1,
      citizenObsCount: near.length,
      citizenSpeciesCount: 0,
      pressureMultiplier: 1,
      sources,
      notes,
    });
  }

  intelCache = { at: Date.now(), snapshot, byZone };
  return byZone;
}

export function getCrossSourceMultiplier(
  zone: FungalZone,
  species: MushroomSpecies,
  snapshot: CitizenScienceSnapshot | null
): CrossSourceZoneIntel {
  const notes: string[] = [];
  const sources: string[] = [];

  let multiplier = 1;

  if (snapshot) {
    const speciesCount = countSpeciesNearZone(
      snapshot,
      zone.lat,
      zone.lng,
      species
    );
    const totalNear = snapshot.observations.filter(
      (o) =>
        Math.hypot(o.lat - zone.lat, o.lng - zone.lng) < 0.2
    ).length;
    const csMult = citizenScienceMultiplier(speciesCount, totalNear);
    if (csMult > 1) {
      notes.push(
        `iNaturalist/MO: ${speciesCount} ritrovamenti ${species} entro 18 km (ultimi 21 gg).`
      );
    }
    multiplier *= csMult;
    sources.push("iNaturalist", "Mushroom Observer");
  }

  const amint = getAmintHintForZone(zone.region, species);
  if (amint) {
    const amMult = amintSignalMultiplier(amint.signal);
    multiplier *= amMult;
    sources.push("AMINT (monitoraggio community)");
    notes.push(`AMINT/${zone.region}: ${amint.note}`);
  }

  sources.push("Funghimagazine (editoriale)");

  return {
    zoneId: zone.id,
    multiplier: Math.min(1.28, Math.max(0.82, multiplier)),
    citizenObsCount: snapshot
      ? snapshot.observations.length
      : 0,
    citizenSpeciesCount: snapshot
      ? countSpeciesNearZone(snapshot, zone.lat, zone.lng, species)
      : 0,
    amintSignal: amint?.signal,
    pressureMultiplier: 1,
    sources: [...new Set(sources)],
    notes,
  };
}

let sharedSnapshot: CitizenScienceSnapshot | null = null;
let sharedAt = 0;

export function getCachedCitizenSnapshot(): CitizenScienceSnapshot | null {
  return sharedSnapshot;
}

export async function getSharedCitizenSnapshot(
  force = false
): Promise<CitizenScienceSnapshot | null> {
  try {
    if (
      !force &&
      sharedSnapshot &&
      Date.now() - sharedAt < INTEL_TTL_MS
    ) {
      return sharedSnapshot;
    }
    sharedSnapshot = await fetchCitizenScienceSnapshot(force);
    sharedAt = Date.now();
    return sharedSnapshot;
  } catch {
    return sharedSnapshot;
  }
}

export function formatCrossSourceForGemini(
  intel: CrossSourceZoneIntel[],
  limit = 12
): string {
  return intel
    .slice(0, limit)
    .filter((i) => i.notes.length > 0 || i.multiplier !== 1)
    .map(
      (i) =>
        `- Zona ${i.zoneId}: moltiplicatore cross-fonte ×${i.multiplier.toFixed(2)} (${i.sources.join(", ")}). ${i.notes.join(" ")}`
    )
    .join("\n");
}
