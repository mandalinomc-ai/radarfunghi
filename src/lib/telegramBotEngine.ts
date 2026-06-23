import { FUNGAL_ZONES } from "./mockData";
import type { FungalZone } from "./types";
import type { MushroomSpecies } from "./types";
import {
  buildHotspots,
  calculateSproutScore,
  getSpeciesLabel,
} from "./predictionEngine";
import { computeClimateChangeAlerts } from "./climateChangeAlerts";
import { addDaysISO, formatDateLabel, todayISO } from "./dateUtils";
import { getHoursInRange } from "./timeRange";
import { getProbabilityLevel } from "./mapUtils";
import {
  REGION_LABELS,
  REGIONS,
  type InlineKeyboard,
} from "./telegramBot";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

const HOUR_RANGE = { startHour: 6, endHour: 10 };
const SPECIES: MushroomSpecies[] = ["porcino", "estatino", "galletto"];

export function getZoneById(zoneId: string): FungalZone | undefined {
  return FUNGAL_ZONES.find((z) => z.id === zoneId);
}

export function zonesByRegion(region: FungalZone["region"]): FungalZone[] {
  return FUNGAL_ZONES.filter((z) => z.region === region);
}

function shortZoneName(zone: FungalZone): string {
  const part = zone.name.split("—").pop()?.trim() ?? zone.name;
  return part.length > 28 ? part.slice(0, 26) + "…" : part;
}

function scoreEmoji(score: number): string {
  if (score >= 80) return "🟢";
  if (score >= 70) return "🟡";
  if (score >= 50) return "🟠";
  return "🔴";
}

export function mainMenuText(zoneId: string | null): string {
  const zone = zoneId ? getZoneById(zoneId) : null;
  return (
    `*MushroomRadar Bot* 🍄📡\n\n` +
    (zone
      ? `Zona attiva: *${zone.name}*\nQuota ${zone.altitude} m · ${zone.forestType}\n\n`
      : `Nessuna zona selezionata — scegli *Zona*.\n\n`) +
    `*Cosa vuoi fare?*\n` +
    `• *Live* — score oggi e ritrovamenti ≥70%\n` +
    `• *Previsioni* — calendario da X a Y giorni\n` +
    `• *Clima* — cambiamenti meteo sulla zona\n` +
    `• *Iscriviti* — aggiornamenti automatici\n\n` +
    `Invia anche *GPS* o *foto fungo*.\n` +
    `[Apri mappa](${APP_URL})`
  );
}

export function mainMenuKeyboard(zoneId: string | null): InlineKeyboard {
  const rows: InlineKeyboard = [
    [
      { text: "📍 Scegli zona", callback_data: "pick:region" },
      { text: "📡 Score live", callback_data: zoneId ? `live:${zoneId}` : "need:zone" },
    ],
    [
      { text: "📅 Previsioni", callback_data: zoneId ? `fcstmenu:${zoneId}` : "need:zone" },
      { text: "🌦️ Alert clima", callback_data: zoneId ? `clim:${zoneId}` : "need:zone" },
    ],
    [
      { text: "🔔 Iscriviti live", callback_data: "sub:toggle" },
      { text: "🗺️ Mappa web", callback_data: "link:radar" },
    ],
  ];
  if (zoneId) {
    rows.push([{ text: "✏️ Cambia zona", callback_data: "pick:region" }]);
  }
  return rows;
}

export function regionPickerKeyboard(): InlineKeyboard {
  const rows: InlineKeyboard = [];
  for (let i = 0; i < REGIONS.length; i += 2) {
    const a = REGIONS[i];
    const b = REGIONS[i + 1];
    const row = [
      { text: `🌲 ${REGION_LABELS[a]}`, callback_data: `reg:${a}:0` },
    ];
    if (b) row.push({ text: `🌲 ${REGION_LABELS[b]}`, callback_data: `reg:${b}:0` });
    rows.push(row);
  }
  rows.push([{ text: "« Menu", callback_data: "menu" }]);
  return rows;
}

export function zonePickerKeyboard(
  region: FungalZone["region"],
  page = 0
): InlineKeyboard {
  const zones = zonesByRegion(region);
  const pageSize = 6;
  const start = page * pageSize;
  const slice = zones.slice(start, start + pageSize);
  const rows: InlineKeyboard = slice.map((z) => [
    { text: shortZoneName(z), callback_data: `zn:${z.id}` },
  ]);

  const nav: { text: string; callback_data: string }[] = [];
  if (start > 0) nav.push({ text: "◀️", callback_data: `reg:${region}:${page - 1}` });
  if (start + pageSize < zones.length) {
    nav.push({ text: "▶️", callback_data: `reg:${region}:${page + 1}` });
  }
  if (nav.length) rows.push(nav);

  rows.push([
    { text: "« Regioni", callback_data: "pick:region" },
    { text: "« Menu", callback_data: "menu" },
  ]);
  return rows;
}

export function forecastMenuKeyboard(zoneId: string): InlineKeyboard {
  return [
    [
      { text: "Oggi → +3 gg", callback_data: `fcst:${zoneId}:0:3` },
      { text: "+3 → +7 gg", callback_data: `fcst:${zoneId}:3:7` },
    ],
    [
      { text: "+7 → +14 gg", callback_data: `fcst:${zoneId}:7:14` },
      { text: "Prossimi 7 gg", callback_data: `fcst:${zoneId}:0:7` },
    ],
    [
      { text: "« Menu", callback_data: "menu" },
    ],
  ];
}

export function liveScoreReport(zone: FungalZone, minScore = 70): string {
  const date = todayISO();
  const hotspots = buildHotspots([zone], "all", HOUR_RANGE, date);
  const h = hotspots[0];
  const hours = getHoursInRange(HOUR_RANGE);

  const lines: string[] = [
    `*📡 Live Sprout Score*`,
    `*${zone.name}*`,
    `📅 ${formatDateLabel(date)} · fascia 06:00–10:00`,
    ``,
  ];

  for (const sp of SPECIES) {
    if (!zone.species.includes(sp) && sp !== "galletto") {
      /* still show all three for comparison */
    }
    const scores = hours.map((hour) => ({
      hour,
      result: calculateSproutScore(zone, sp, hour, date),
    }));
    const peak = scores.reduce((a, b) =>
      a.result.score > b.result.score ? a : b
    );
    const mark = peak.result.score >= minScore ? "✅" : "—";
    lines.push(
      `${scoreEmoji(peak.result.score)} *${getSpeciesLabel(sp)}*: *${peak.result.score}%* ${mark} (ore ${peak.hour}:00)`
    );
  }

  lines.push("");
  lines.push(
    `*Migliore oggi:* ${getSpeciesLabel(h?.activeSpecies ?? "porcino")} *${h?.activeScore ?? 0}%*`
  );

  const above = SPECIES.map((sp) => {
    const max = Math.max(
      ...hours.map((hour) => calculateSproutScore(zone, sp, hour, date).score)
    );
    return { sp, max };
  }).filter((x) => x.max >= minScore);

  if (above.length > 0) {
    lines.push("");
    lines.push(`*Ritrovamenti probabili ≥${minScore}%:*`);
    for (const { sp, max } of above) {
      lines.push(`• ${getSpeciesLabel(sp)} — ${getProbabilityLevel(max)} (${max}%)`);
    }
  } else {
    lines.push("");
    lines.push(`_Nessuna specie sopra ${minScore}% oggi in questa fascia._`);
  }

  lines.push(`\n[Dettaglio mappa](${APP_URL}/radar)`);
  return lines.join("\n");
}

export function forecastRangeReport(
  zone: FungalZone,
  startOffset: number,
  endOffset: number
): string {
  const today = todayISO();
  const lines: string[] = [
    `*📅 Previsioni Sprout Score*`,
    `*${zone.name}*`,
    `Dal *+${startOffset}* al *+${endOffset}* giorni`,
    ``,
  ];

  const hours = getHoursInRange(HOUR_RANGE);
  for (let d = startOffset; d <= endOffset; d++) {
    const iso = addDaysISO(today, d);
    let bestSp: MushroomSpecies = "porcino";
    let bestScore = 0;
    for (const sp of SPECIES) {
      for (const hour of hours) {
        const s = calculateSproutScore(zone, sp, hour, iso).score;
        if (s > bestScore) {
          bestScore = s;
          bestSp = sp;
        }
      }
    }
    const label = d === 0 ? "Oggi" : `+${d}g`;
    lines.push(
      `${scoreEmoji(bestScore)} *${label}* (${formatDateLabel(iso)}): *${bestScore}%* ${getSpeciesLabel(bestSp)}`
    );
  }

  const peaks = [];
  for (let d = startOffset; d <= endOffset; d++) {
    const iso = addDaysISO(today, d);
    for (const sp of SPECIES) {
      const max = Math.max(
        ...hours.map((h) => calculateSproutScore(zone, sp, h, iso).score)
      );
      if (max >= 70) peaks.push({ d, sp, max, iso });
    }
  }

  if (peaks.length) {
    lines.push("");
    lines.push("*Finestre ≥70%:*");
    const top = peaks.sort((a, b) => b.max - a.max).slice(0, 5);
    for (const p of top) {
      lines.push(
        `• ${formatDateLabel(p.iso)} — ${getSpeciesLabel(p.sp)} ${p.max}%`
      );
    }
  }

  return lines.join("\n");
}

export function climateReport(zone: FungalZone): string {
  const date = todayISO();
  const fetchedAt = new Date().toISOString();
  const hotspots = buildHotspots([zone], "all", HOUR_RANGE, date);
  const alerts = computeClimateChangeAlerts(
    [zone],
    hotspots,
    date,
    fetchedAt,
    null
  ).filter((a) => !a.zoneName || a.zoneName === zone.name);

  const lines: string[] = [
    `*🌦️ Alert climatici*`,
    `*${zone.name}*`,
    `Umidità suolo: ${zone.baseSoilMoisture}% · Shock termico: ${zone.nightThermalShock}°C`,
    ``,
  ];

  if (alerts.length === 0) {
    lines.push("_Nessun cambiamento critico rilevato ora._");
    lines.push("Monitora piogge e vento nelle prossime 48h.");
  } else {
    for (const a of alerts.slice(0, 6)) {
      const icon =
        a.severity === "likely" || a.severity === "critical"
          ? "⚠️"
          : a.isChange
            ? "🔄"
            : "ℹ️";
      lines.push(`${icon} *${a.headline}*`);
      lines.push(a.detail.slice(0, 220));
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

/** Tutte le zone con score ≥ soglia oggi (per broadcast) */
export function allZonesAboveThreshold(minScore = 70): string {
  const date = todayISO();
  const hotspots = buildHotspots(FUNGAL_ZONES, "all", HOUR_RANGE, date);
  const hits = hotspots
    .filter((h) => h.activeScore >= minScore)
    .sort((a, b) => b.activeScore - a.activeScore)
    .slice(0, 12);

  if (hits.length === 0) {
    return `*Radar live* 📡\nNessuna zona sopra *${minScore}%* oggi (fascia 06–10).\n[Apri mappa](${APP_URL})`;
  }

  const lines = [
    `*🍄 Zone con score ≥${minScore}%*`,
    `📅 ${formatDateLabel(date)}`,
    ``,
  ];
  for (const h of hits) {
    lines.push(
      `${scoreEmoji(h.activeScore)} *${h.zone.name}* — ${h.activeScore}% (${getSpeciesLabel(h.activeSpecies)})`
    );
  }
  lines.push(`\n[Apri radar](${APP_URL}/radar)`);
  return lines.join("\n");
}

export function parseForecastArgs(text: string): { from: number; to: number } | null {
  const m = text.match(/previsioni\s+(\d+)\s+(\d+)/i);
  if (!m) return null;
  const from = Math.min(14, Math.max(0, parseInt(m[1], 10)));
  const to = Math.min(14, Math.max(from, parseInt(m[2], 10)));
  return { from, to };
}

export function helpText(): string {
  return (
    `*Guida MushroomRadar Bot*\n\n` +
    `/menu — pannello interattivo\n` +
    `/zona — scegli area (Matese, Taburno, Partenio…)\n` +
    `/live — score oggi e ritrovamenti ≥70%\n` +
    `/previsioni 0 7 — forecast da oggi a +7 giorni\n` +
    `/clima — cambiamenti meteo sulla zona\n` +
    `/iscriviti — alert automatici giornalieri\n` +
    `/radar — link mappa web\n\n` +
    `Invia *GPS* per zona più vicina.\n` +
    `Invia *foto* per identificazione AI.\n\n` +
    `_Uso educativo. Verifica sempre con un micologo._`
  );
}
