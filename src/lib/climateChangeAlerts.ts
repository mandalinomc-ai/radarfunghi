import type { FungalZone, MapHotspot, MushroomSpecies } from "./types";
import {
  analyzeSoilFruiting,
  computeEffectiveSoilMoisture,
  getDevelopmentStageLabel,
  getWetnessLabel,
} from "./soilFruitingModel";
import { getSpeciesLabel } from "./predictionEngine";
import { getSeasonPhase, getMonthFromDate } from "./seasonalCalendar";

export type AlertSeverity = "info" | "watch" | "likely" | "critical";

export interface ClimateChangeAlert {
  id: string;
  severity: AlertSeverity;
  headline: string;
  detail: string;
  zoneName?: string;
  species?: MushroomSpecies[];
  isChange: boolean;
  timestamp: string;
}

export interface ZoneWeatherMetrics {
  soilMoisture: number;
  rainNext48h: number;
  thermalShock: number;
  avgHumidity: number;
  avgWind: number;
}

export interface WeatherSnapshot {
  fetchedAt: string;
  selectedDate: string;
  zones: Record<string, ZoneWeatherMetrics>;
}

function rainNext48h(zone: FungalZone, selectedDate: string): number {
  const today = selectedDate;
  const slice = zone.forecastsByDate?.[today] ?? zone.hourlyForecasts;
  const next48 = slice.slice(0, 48);
  if (next48.length === 0) return 0;

  const rainFromHistory = zone.rainHistory
    .filter((d) => d.date > today)
    .slice(0, 2)
    .reduce((s, d) => s + d.mm, 0);

  const humidityProxy =
    next48.reduce((s, f) => s + f.humidity, 0) / next48.length;
  const rainProxy = humidityProxy > 78 ? 4 + (humidityProxy - 78) * 0.35 : 0;

  return Math.round((rainFromHistory + rainProxy) * 10) / 10;
}

function avgWind(zone: FungalZone): number {
  const recent = zone.hourlyForecasts.slice(0, 24);
  if (recent.length === 0) return 8;
  return (
    recent.reduce(
      (s, f) => s + (f.windSpeed ?? Math.max(4, 28 - f.humidity * 0.22)),
      0
    ) / recent.length
  );
}

export function buildWeatherSnapshot(
  zones: FungalZone[],
  selectedDate: string,
  fetchedAt: string
): WeatherSnapshot {
  const map: Record<string, ZoneWeatherMetrics> = {};
  for (const zone of zones) {
    const slice = zone.hourlyForecasts.slice(0, 24);
    map[zone.id] = {
      soilMoisture: computeEffectiveSoilMoisture(zone, selectedDate),
      rainNext48h: rainNext48h(zone, selectedDate),
      thermalShock: zone.nightThermalShock,
      avgHumidity:
        slice.length > 0
          ? slice.reduce((s, f) => s + f.humidity, 0) / slice.length
          : 65,
      avgWind: avgWind(zone),
    };
  }
  return { fetchedAt, selectedDate, zones: map };
}

function deltaAlerts(
  zones: FungalZone[],
  current: WeatherSnapshot,
  previous: WeatherSnapshot | null
): ClimateChangeAlert[] {
  if (!previous || previous.selectedDate !== current.selectedDate) return [];
  const alerts: ClimateChangeAlert[] = [];
  const ts = current.fetchedAt;

  for (const zone of zones) {
    const cur = current.zones[zone.id];
    const prev = previous.zones[zone.id];
    if (!cur || !prev) continue;

    const rainDelta = cur.rainNext48h - prev.rainNext48h;
    const moistureDelta = cur.soilMoisture - prev.soilMoisture;
    const shockDelta = cur.thermalShock - prev.thermalShock;
    const windDelta = cur.avgWind - prev.avgWind;

    if (rainDelta >= 4) {
      const species = zone.species.filter(
        (s) => getSeasonPhase(s, getMonthFromDate(current.selectedDate)) !== "off"
      );
      alerts.push({
        id: `rain-${zone.id}-${ts}`,
        severity: rainDelta >= 10 ? "likely" : "watch",
        headline: `${zone.name} — piogge in aumento`,
        detail: `Previsto +${rainDelta.toFixed(0)} mm nelle prossime 48h. ${
          species.length > 0
            ? `Potrebbero svilupparsi ${species.map(getSpeciesLabel).join(", ")} tra 6–14 giorni.`
            : "Monitora umidità suolo e shock termico."
        }`,
        zoneName: zone.name,
        species,
        isChange: true,
        timestamp: ts,
      });
    }

    if (moistureDelta >= 6) {
      alerts.push({
        id: `moist-${zone.id}-${ts}`,
        severity: "watch",
        headline: `${zone.name} — suolo in umidificazione`,
        detail: `Umidità suolo +${moistureDelta.toFixed(0)}% dall'ultimo aggiornamento. Condizioni favorevoli al micelio.`,
        zoneName: zone.name,
        isChange: true,
        timestamp: ts,
      });
    } else if (moistureDelta <= -8) {
      alerts.push({
        id: `dry-${zone.id}-${ts}`,
        severity: "info",
        headline: `${zone.name} — suolo in essiccamento`,
        detail: `−${Math.abs(moistureDelta).toFixed(0)}% umidità. Primordi a rischio se vento persiste.`,
        zoneName: zone.name,
        isChange: true,
        timestamp: ts,
      });
    }

    if (shockDelta >= 3) {
      alerts.push({
        id: `shock-${zone.id}-${ts}`,
        severity: "likely",
        headline: `${zone.name} — shock termico in aumento`,
        detail: `+${shockDelta.toFixed(1)}°C shock termico notturno — stimolo frutificazione per porcini ed estatini.`,
        zoneName: zone.name,
        species: zone.species.filter((s) => s !== "galletto"),
        isChange: true,
        timestamp: ts,
      });
    }

    if (windDelta >= 5 && cur.avgWind > 14) {
      alerts.push({
        id: `wind-${zone.id}-${ts}`,
        severity: "watch",
        headline: `${zone.name} — vento secco in aumento`,
        detail: `Vento medio ${cur.avgWind.toFixed(0)} km/h. Funghimagazine: inibitore n.1 delle nascite.`,
        zoneName: zone.name,
        isChange: true,
        timestamp: ts,
      });
    }
  }

  return alerts;
}

function staticAlerts(
  zones: FungalZone[],
  hotspots: MapHotspot[],
  selectedDate: string,
  fetchedAt: string
): ClimateChangeAlert[] {
  const alerts: ClimateChangeAlert[] = [];
  const ranked = [...hotspots].sort((a, b) => b.activeScore - a.activeScore);
  const top = ranked.slice(0, 5);

  for (const hotspot of top) {
    const { zone } = hotspot;
    const analysis = analyzeSoilFruiting(zone, selectedDate);
    const imminent = analysis.speciesEstimates.filter(
      (e) =>
        e.developmentStage === "fruttificazione_imminente" ||
        e.developmentStage === "finestra_attiva" ||
        e.developmentStage === "primordi_in_formazione"
    );

    if (imminent.length === 0) continue;

    const names = imminent.map((e) => e.label).join(", ");
    const stages = imminent
      .map((e) => `${e.label}: ${getDevelopmentStageLabel(e.developmentStage)}`)
      .join(" · ");

    alerts.push({
      id: `fruit-${zone.id}-${selectedDate}`,
      severity:
        analysis.wetnessStatus === "ottimale" || analysis.wetnessStatus === "umido"
          ? "likely"
          : "watch",
      headline: `${zone.name} — possibile sviluppo ${names}`,
      detail: `${getWetnessLabel(analysis.wetnessStatus)} (${analysis.effectiveMoisturePct}%). ${stages}. ${analysis.summary}`,
      zoneName: zone.name,
      species: imminent.map((e) => e.species),
      isChange: false,
      timestamp: fetchedAt,
    });
  }

  for (const zone of zones.slice(0, 8)) {
    const metrics = computeEffectiveSoilMoisture(zone, selectedDate);
    const rain48 = rainNext48h(zone, selectedDate);
    if (rain48 >= 8 && metrics < 55) {
      alerts.push({
        id: `pre-rain-${zone.id}`,
        severity: "watch",
        headline: `${zone.name} — pioggia in arrivo`,
        detail: `~${rain48} mm previsti su suolo secco — possibile cambio locale. Dopo 7–12 gg: porcini/galletti se quota e stagione ok.`,
        zoneName: zone.name,
        species: zone.species,
        isChange: false,
        timestamp: fetchedAt,
      });
    }
  }

  return alerts;
}

export function computeClimateChangeAlerts(
  zones: FungalZone[],
  hotspots: MapHotspot[],
  selectedDate: string,
  fetchedAt: string | null,
  previousSnapshot: WeatherSnapshot | null
): ClimateChangeAlert[] {
  const ts = fetchedAt ?? new Date().toISOString();
  const snapshot = buildWeatherSnapshot(zones, selectedDate, ts);

  const changeAlerts = deltaAlerts(zones, snapshot, previousSnapshot);
  const baseline = staticAlerts(zones, hotspots, selectedDate, ts);

  const merged = [...changeAlerts, ...baseline];
  const seen = new Set<string>();
  const unique: ClimateChangeAlert[] = [];

  for (const a of merged) {
    const key = `${a.headline}-${a.zoneName ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(a);
  }

  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    likely: 1,
    watch: 2,
    info: 3,
  };

  return unique
    .sort((a, b) => {
      if (a.isChange !== b.isChange) return a.isChange ? -1 : 1;
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 8);
}
