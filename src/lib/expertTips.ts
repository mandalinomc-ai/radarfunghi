import type { FungalZone, MushroomSpecies } from "./types";
import { getHabitatGuideForZone } from "./speciesHabitat";
import { getSeasonPhase, MONTH_NAMES_IT, getMonthFromDate } from "./seasonalCalendar";

export interface ExpertTip {
  id: string;
  species?: MushroomSpecies;
  regions?: FungalZone["region"][];
  zoneIds?: string[];
  monthRange?: [number, number];
  title: string;
  tip: string;
  source: string;
}

export const EXPERT_TIPS: ExpertTip[] = [
  {
    id: "fm-wind-inhibitor",
    title: "Vento = inibitore n.1",
    tip: "Funghimagazine sottolinea che per le nascite nobili conta più il vento che asciuga la superficie del suolo che la sola pioggia caduta. Dopo giornate ventose, preferisci versanti riparati e fossi.",
    source: "Funghimagazine Meteofunghi 22-05-2026",
  },
  {
    id: "fm-rain-window",
    title: "Finestra pioggia 7–10 giorni",
    tip: "Le nascite migliori arrivano 7–10 giorni dopo piogge significative, quando il suolo ha trattenuto umidità ma non è allagato.",
    source: "Funghimagazine — Tabelle nascite",
  },
  {
    id: "taburno-estatino",
    species: "estatino",
    regions: ["taburno", "campania"],
    monthRange: [5, 9],
    title: "Taburno — castagneti 800–1100 m",
    tip: "Porcini estivi e estatini sul Taburno: cerca sotto castagno su versante nord dopo piogge mid-giugno, fascia 05:30–09:00.",
    source: "Funghimagazine + trend FM Taburno 2026",
  },
  {
    id: "sannio-querceto",
    species: "estatino",
    regions: ["sannio"],
    title: "Sannio — querceti umidi",
    tip: "Colli Telese/Benevento: estatini su querceti umidi, spesso 06–10 con umidità >75%.",
    source: "Funghimagazine Sannio 2026",
  },
  {
    id: "matese-finferli",
    species: "galletto",
    regions: ["matese", "molise"],
    title: "Matese — finferli nei fossi",
    tip: "Dopo piogge 14–16 giugno, finferli in ripresa su versanti umidi del Matese medio; evita crinali esposti al vento.",
    source: "Funghimagazine Matese 2026",
  },
  {
    id: "pollino-faggeta",
    species: "porcino",
    regions: ["basilicata"],
    title: "Pollino — faggeta umida",
    tip: "Pollino occidentale: porcini ed estatini in faggeta 1000–1400 m; rispetto ambientale — niente geotag precisi.",
    source: "Funghimagazine Pollino 2026",
  },
  {
    id: "asl-control",
    title: "Controllo ASL",
    tip: "Prima di consumare, fai verificare ogni raccolta dal servizio micologico ASL. MushroomRadar non sostituisce l'identificazione ufficiale.",
    source: "Ministero Salute / L.R. Campania 8/2007",
  },
];

export function getExpertTipsForZone(
  zone: FungalZone,
  species: MushroomSpecies,
  selectedDate: string
): ExpertTip[] {
  const month = getMonthFromDate(selectedDate);
  return EXPERT_TIPS.filter((t) => {
    if (t.species && t.species !== species) return false;
    if (t.regions && !t.regions.includes(zone.region)) return false;
    if (t.zoneIds && !t.zoneIds.includes(zone.id)) return false;
    if (t.monthRange) {
      const [a, b] = t.monthRange;
      if (month < a || month > b) return false;
    }
    return true;
  }).slice(0, 4);
}

export function formatExpertTipsForGemini(
  zone: FungalZone,
  species: MushroomSpecies,
  selectedDate: string
): string {
  const tips = getExpertTipsForZone(zone, species, selectedDate);
  const habitat = getHabitatGuideForZone(zone, species);
  const phase = getSeasonPhase(species, getMonthFromDate(selectedDate));
  const month = MONTH_NAMES_IT[getMonthFromDate(selectedDate)];

  const lines = [
    `Zona: ${zone.name} (${zone.forestType}, ${zone.altitude}m)`,
    `Specie: ${species} — fase stagionale ${month}: ${phase}`,
    `Habitat score interno: ${habitat.habitatScore}%`,
    ...habitat.searchTips.map((s) => `• ${s}`),
    ...tips.map((t) => `[${t.source}] ${t.title}: ${t.tip}`),
  ];
  return lines.join("\n");
}

export function getGlobalExpertTips(): ExpertTip[] {
  return EXPERT_TIPS.filter((t) => !t.species && !t.regions);
}
