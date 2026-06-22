import type { MushroomReport, MushroomSpecies } from "./types";
import { getSpeciesLabel } from "./predictionEngine";
import {
  findNearestZone,
  speciesMatchesZone,
} from "./zoneReportMatcher";
import {
  REPORT_RELIABILITY_BONUS,
  REPORT_RELIABILITY_BONUS_WEAK,
  updateZoneReliability,
  type ZoneReliabilityRecord,
} from "./zoneReliabilityStore";

export type ReportValidationStatus = "validated" | "too_far" | "no_zone";

export interface ReportValidationResult {
  report: MushroomReport;
  matchedZone: { id: string; name: string; distanceKm: number } | null;
  reliabilityRecord: ZoneReliabilityRecord | null;
  reliabilityBonusApplied: number;
  mastroMessage: string;
  status: ReportValidationStatus;
}

const MAX_MATCH_KM: Record<MushroomReport["reportType"], number> = {
  ritrovamento: 6,
  bottata: 8,
  spia: 10,
};

function buildMastroMessage(
  zoneName: string,
  species: MushroomSpecies | "sconosciuto",
  bonus: number,
  reportType: MushroomReport["reportType"]
): string {
  const speciesLabel =
    species === "sconosciuto" ? "funghi" : getSpeciesLabel(species);
  const typeHint =
    reportType === "bottata"
      ? "Bottata confermata"
      : reportType === "spia"
        ? "Fungo spia registrato"
        : "Ritrovamento validato";

  return `Mastro Fungaiolo: ${typeHint} — il terreno su **${zoneName}** ha risposto! (+${Math.round(bonus * 100)}% affidabilità zona per ${speciesLabel})`;
}

/** Valida un ritrovamento, aggiorna affidabilità zona e arricchisce il report. */
export async function processNewReport(
  report: MushroomReport
): Promise<ReportValidationResult> {
  const maxKm = MAX_MATCH_KM[report.reportType];
  const match = findNearestZone(report.lat, report.lng, maxKm);

  if (!match) {
    return {
      report: {
        ...report,
        validationStatus: "too_far",
        matchedZoneId: null,
        matchedZoneName: null,
        matchDistanceKm: null,
        reliabilityBonus: 0,
      },
      matchedZone: null,
      reliabilityRecord: null,
      reliabilityBonusApplied: 0,
      mastroMessage:
        "Mastro Fungaiolo: segnalazione registrata, ma troppo lontana dalle zone radar note (>6 km). Non applico bonus Sprout.",
      status: "too_far",
    };
  }

  const speciesOk = speciesMatchesZone(match.zone, report.species);
  const bonusIncrement = speciesOk
    ? REPORT_RELIABILITY_BONUS
    : REPORT_RELIABILITY_BONUS_WEAK;

  const reliabilityRecord = await updateZoneReliability({
    zoneId: match.zone.id,
    zoneName: match.zone.name,
    lastActivity: new Date(report.createdAt),
    speciesFound: report.species,
    reliabilityBonusIncrement: bonusIncrement,
    reportId: report.id,
  });

  const enriched: MushroomReport = {
    ...report,
    validationStatus: "validated",
    matchedZoneId: match.zone.id,
    matchedZoneName: match.zone.name,
    matchDistanceKm: match.distanceKm,
    reliabilityBonus: bonusIncrement,
  };

  const mastroMessage = buildMastroMessage(
    match.zone.name,
    report.species,
    bonusIncrement,
    report.reportType
  );

  return {
    report: enriched,
    matchedZone: {
      id: match.zone.id,
      name: match.zone.name,
      distanceKm: match.distanceKm,
    },
    reliabilityRecord,
    reliabilityBonusApplied: bonusIncrement,
    mastroMessage,
    status: "validated",
  };
}
