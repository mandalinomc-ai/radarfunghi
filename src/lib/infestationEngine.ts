import type { FungalZone } from "./types";

export type InfestationRisk = "BASSO" | "MEDIO" | "ALTO";

export interface InfestationAssessment {
  risk: InfestationRisk;
  avgTemp72h: number;
  minNightTemp72h: number;
  alertMessage: string | null;
}

/** Indice termico vespatura/larve — Specifica Master §5.2.3 */
export function assessInfestationRisk(zone: FungalZone): InfestationAssessment {
  const recent = zone.hourlyForecasts.slice(-72);
  if (recent.length === 0) {
    return {
      risk: "MEDIO",
      avgTemp72h: 0,
      minNightTemp72h: 0,
      alertMessage: null,
    };
  }

  const temps = recent.map((f) => f.temperature);
  const nightTemps = recent.filter((f) => f.hour < 6 || f.hour >= 21).map((f) => f.temperature);
  const avgTemp72h =
    temps.reduce((s, t) => s + t, 0) / Math.max(temps.length, 1);
  const minNightTemp72h =
    nightTemps.length > 0 ? Math.min(...nightTemps) : Math.min(...temps);

  const sustainedHeat = avgTemp72h > 18 && minNightTemp72h > 14;

  if (sustainedHeat) {
    return {
      risk: "ALTO",
      avgTemp72h: Math.round(avgTemp72h * 10) / 10,
      minNightTemp72h: Math.round(minNightTemp72h * 10) / 10,
      alertMessage:
        "Rischio larve elevato. Si consiglia la ricerca ad altitudini superiori (+200m) o su versanti esposti a Nord.",
    };
  }

  if (avgTemp72h > 16) {
    return {
      risk: "MEDIO",
      avgTemp72h: Math.round(avgTemp72h * 10) / 10,
      minNightTemp72h: Math.round(minNightTemp72h * 10) / 10,
      alertMessage: null,
    };
  }

  return {
    risk: "BASSO",
    avgTemp72h: Math.round(avgTemp72h * 10) / 10,
    minNightTemp72h: Math.round(minNightTemp72h * 10) / 10,
    alertMessage: null,
  };
}
