import type { FungalZone, MushroomSpecies } from "./types";
import { SOURCE_REGISTRY } from "./sourceRegistry";
import { YOUTUBE_FEATURED_VIDEOS } from "./youtubeSources";
import { VERIFIED_ZONE_BY_ID } from "./verifiedZoneCoords";
import { getRegionLabel } from "./regionLabels";

export type TerritoryMediaType = "video" | "guide" | "parco";

export interface TerritoryMediaItem {
  id: string;
  type: TerritoryMediaType;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  sourceLabel: string;
  level: "ufficiale" | "editoriale" | "community";
  species: (MushroomSpecies | "all")[];
}

const REGION_TOPIC_MAP: Record<FungalZone["region"], string[]> = {
  matese: ["Matese", "matese", "parco"],
  taburno: ["Taburno", "taburno", "Camposauro", "parco"],
  sannio: ["Sannio", "sannio", "Appennino"],
  molise: ["Molise", "molise", "Matese"],
  campania: ["Campania", "Partenio", "Cilento", "Irpinia"],
  basilicata: ["Basilicata", "Pollino", "Vulture", "Lucano"],
};

const SPECIES_TOPIC: Record<MushroomSpecies, string[]> = {
  porcino: ["porcini", "porcino", "boletus"],
  estatino: ["estatino", "estivo", "aestivalis", "giugno"],
  galletto: ["finferlo", "galletto", "cantarellus"],
};

function youtubeThumb(url: string): string | undefined {
  const m = url.match(/[?&]v=([^&]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : undefined;
}

function matchesSpecies(
  topics: string[],
  species: MushroomSpecies
): boolean {
  const keys = SPECIES_TOPIC[species];
  const blob = topics.join(" ").toLowerCase();
  return keys.some((k) => blob.includes(k.toLowerCase()));
}

function matchesRegion(
  sourceRegion: string | undefined,
  topics: string[],
  zoneRegion: FungalZone["region"]
): boolean {
  const keys = REGION_TOPIC_MAP[zoneRegion];
  const blob = `${sourceRegion ?? ""} ${topics.join(" ")}`.toLowerCase();
  return keys.some((k) => blob.includes(k.toLowerCase()));
}

export function getTerritoryMediaForZone(
  zone: FungalZone,
  species: MushroomSpecies
): TerritoryMediaItem[] {
  const items: TerritoryMediaItem[] = [];
  const seen = new Set<string>();

  const push = (item: TerritoryMediaItem) => {
    if (seen.has(item.url)) return;
    seen.add(item.url);
    items.push(item);
  };

  const meta = VERIFIED_ZONE_BY_ID.get(zone.id);
  if (meta) {
    push({
      id: `foraging-${zone.id}`,
      type: "parco",
      title: meta.foragingSourceLabel,
      description: `Area raccolta certificata · quota ${zone.altitude} m · ${zone.forestType}`,
      url: meta.foragingSourceUrl,
      sourceLabel: meta.foragingSourceLabel,
      level: meta.foragingSource === "parco-regionale" || meta.foragingSource === "parco-nazionale" ? "ufficiale" : "editoriale",
      species: ["all"],
    });
    if (meta.parkingSourceUrl !== meta.foragingSourceUrl) {
      push({
        id: `parking-${zone.id}`,
        type: "guide",
        title: meta.parkingSourceLabel,
        description: "Accesso stradale e parcheggio base per la zona",
        url: meta.parkingSourceUrl,
        sourceLabel: meta.parkingSourceLabel,
        level: "editoriale",
        species: ["all"],
      });
    }
  }

  for (const src of SOURCE_REGISTRY) {
    if (src.category !== "parco" && src.category !== "editoriale") continue;
    if (!matchesRegion(src.region, src.topics ?? [], zone.region)) continue;

    push({
      id: src.id,
      type: src.category === "parco" ? "parco" : "guide",
      title: src.shortName,
      description: src.description,
      url: src.url,
      sourceLabel: src.shortName,
      level: src.category === "parco" ? "ufficiale" : "editoriale",
      species: ["all"],
    });
  }

  for (const vid of YOUTUBE_FEATURED_VIDEOS) {
    const topics = vid.topics ?? [];
    const regionOk =
      !vid.region || matchesRegion(vid.region, topics, zone.region);
    const speciesOk =
      matchesSpecies(topics, species) ||
      topics.some((t) => t === "video" && regionOk);
    if (!regionOk) continue;
    if (!speciesOk && !matchesRegion(vid.region, topics, zone.region)) continue;

    push({
      id: vid.id,
      type: "video",
      title: vid.shortName,
      description: vid.description,
      url: vid.url,
      thumbnailUrl: youtubeThumb(vid.url),
      sourceLabel: "YouTube community (verificato)",
      level: "community",
      species: matchesSpecies(topics, species) ? [species] : ["all"],
    });
  }

  push({
    id: `zone-${zone.id}`,
    type: "guide",
    title: `${zone.name} — ${getRegionLabel(zone.region)}`,
    description: `${zone.forestType} · esposizione ${zone.exposure} · ${zone.altitude} m. Specie: ${zone.species.join(", ")}.`,
    url: `https://www.openstreetmap.org/#map=14/${zone.lat}/${zone.lng}`,
    sourceLabel: "OpenStreetMap",
    level: "editoriale",
    species: ["all"],
  });

  return items.slice(0, 12);
}

export function getTerritoryIntro(
  zone: FungalZone,
  species: MushroomSpecies,
  speciesLabel: string
): string {
  return `Guida al territorio **${zone.name}** (${getRegionLabel(zone.region)}) per **${speciesLabel}**: habitat ${zone.forestType}, quota ${zone.altitude} m, versante ${zone.exposure}. Usa la bussola per orientarti dal parcheggio verso l'area di raccolta.`;
}
