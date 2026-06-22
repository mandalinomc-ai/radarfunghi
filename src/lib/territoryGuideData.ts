import type { FungalZone, MushroomSpecies } from "./types";
import { SOURCE_REGISTRY } from "./sourceRegistry";
import { YOUTUBE_FEATURED_VIDEOS } from "./youtubeSources";
import { VERIFIED_ZONE_BY_ID } from "./verifiedZoneCoords";
import { getRegionLabel } from "./regionLabels";

export type TerritoryMediaType = "video" | "guide" | "parco" | "wiki";

export interface TerritoryMediaItem {
  id: string;
  type: TerritoryMediaType;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  embedUrl?: string;
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

const WIKI_ZONE: Partial<Record<FungalZone["region"], { title: string; url: string; thumb: string }>> = {
  taburno: {
    title: "Parco regionale Taburno Camposauro",
    url: "https://it.wikipedia.org/wiki/Parco_regionale_Taburno_Camposauro",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Taburno_camposauro.jpg/320px-Taburno_camposauro.jpg",
  },
  matese: {
    title: "Parco regionale del Matese",
    url: "https://it.wikipedia.org/wiki/Parco_regionale_del_Matese",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lago_del_Matese.jpg/320px-Lago_del_Matese.jpg",
  },
  sannio: {
    title: "Sannio",
    url: "https://it.wikipedia.org/wiki/Sannio",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Benevento_Duomo.jpg/320px-Benevento_Duomo.jpg",
  },
  campania: {
    title: "Partenio",
    url: "https://it.wikipedia.org/wiki/Monti_del_Partenio",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Monti_del_Partenio.jpg/320px-Monti_del_Partenio.jpg",
  },
  basilicata: {
    title: "Parco nazionale del Pollino",
    url: "https://it.wikipedia.org/wiki/Parco_nazionale_del_Pollino",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Pollino_NP.jpg/320px-Pollino_NP.jpg",
  },
  molise: {
    title: "Molise",
    url: "https://it.wikipedia.org/wiki/Molise",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Campobasso_centro_storico.jpg/320px-Campobasso_centro_storico.jpg",
  },
};

const WIKI_SPECIES: Record<MushroomSpecies, { title: string; url: string; thumb: string }> = {
  porcino: {
    title: "Porcino (Boletus edulis)",
    url: "https://it.wikipedia.org/wiki/Boletus_edulis",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Boletus_edulis_1.jpg/320px-Boletus_edulis_1.jpg",
  },
  estatino: {
    title: "Porcino estivo (Boletus aestivalis)",
    url: "https://it.wikipedia.org/wiki/Boletus_aestivalis",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Boletus_aestivalis.jpg/320px-Boletus_aestivalis.jpg",
  },
  galletto: {
    title: "Finferlo (Cantharellus lutescens)",
    url: "https://it.wikipedia.org/wiki/Cantharellus_lutescens",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Cantharellus_lutescens.jpg/320px-Cantharellus_lutescens.jpg",
  },
};

function youtubeVideoId(url: string): string | undefined {
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return watch[1];
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  return undefined;
}

function youtubeThumb(url: string): string | undefined {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
}

function youtubeEmbed(url: string): string | undefined {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
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

  const wikiZone = WIKI_ZONE[zone.region];
  if (wikiZone) {
    push({
      id: `wiki-zone-${zone.region}`,
      type: "wiki",
      title: wikiZone.title,
      description: `Territorio e habitat — fonte Wikipedia`,
      url: wikiZone.url,
      thumbnailUrl: wikiZone.thumb,
      sourceLabel: "Wikipedia",
      level: "editoriale",
      species: ["all"],
    });
  }

  const wikiSp = WIKI_SPECIES[species];
  push({
    id: `wiki-sp-${species}`,
    type: "wiki",
    title: wikiSp.title,
    description: `Scheda micologica — morfologia, habitat, stagionalità`,
    url: wikiSp.url,
    thumbnailUrl: wikiSp.thumb,
    sourceLabel: "Wikipedia",
    level: "editoriale",
    species: [species],
  });

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
      embedUrl: youtubeEmbed(vid.url),
      sourceLabel: "YouTube community (verificato)",
      level: "community",
      species: matchesSpecies(topics, species) ? [species] : ["all"],
    });
  }

  return items.slice(0, 14);
}

export function getTerritoryIntro(
  zone: FungalZone,
  species: MushroomSpecies,
  speciesLabel: string
): string {
  return `Guida al territorio **${zone.name}** (${getRegionLabel(zone.region)}) per **${speciesLabel}**: habitat ${zone.forestType}, quota ${zone.altitude} m, versante ${zone.exposure}. Usa la bussola per orientarti dal parcheggio verso l'area di raccolta.`;
}
