"use client";

import type { FungalZone } from "@/lib/types";
import { assessInfestationRisk } from "@/lib/infestationEngine";
import { calculateEnvironmentalMalus } from "@/lib/environmentalMalus";
import { getSocialBonusForRegion } from "@/lib/socialScraper";
import { getReportReliabilityMultiplier } from "@/lib/zoneReliabilityBonus";

interface ZoneEnvironmentAlertsProps {
  zone: FungalZone;
  selectedDate: string;
  compact?: boolean;
}

export default function ZoneEnvironmentAlerts({
  zone,
  selectedDate,
  compact,
}: ZoneEnvironmentAlertsProps) {
  const infestation = assessInfestationRisk(zone);
  const malus = calculateEnvironmentalMalus(zone, selectedDate);
  const social = getSocialBonusForRegion(zone.region);
  const reportRel = getReportReliabilityMultiplier(zone.id);

  const alerts: { tone: "orange" | "amber" | "green" | "blue"; text: string }[] =
    [];

  if (infestation.alertMessage) {
    alerts.push({ tone: "orange", text: infestation.alertMessage });
  } else if (infestation.risk === "MEDIO") {
    alerts.push({
      tone: "amber",
      text: "Rischio larve moderato — preferisci raccolta mattutina e controllo visivo.",
    });
  }

  if (malus.floodMultiplier < 1) {
    alerts.push({
      tone: "blue",
      text: `Stasi idrica da piogge intense (${malus.rainLast3DaysMm} mm/3g) — Sprout Score ridotto del ${Math.round((1 - malus.floodMultiplier) * 100)}%.`,
    });
  }

  if (malus.windMultiplier < 1) {
    alerts.push({
      tone: "amber",
      text: `Vento/raffiche (${malus.windyHoursLast48}h critiche) — lettiera a rischio, malus vento.`,
    });
  }

  if (malus.pressureMultiplier < 1 && malus.avgPressureHpa) {
    alerts.push({
      tone: "amber",
      text: `Alta pressione (${malus.avgPressureHpa} hPa) e cielo sereno — suolo più secco, malus pressione.`,
    });
  } else if (malus.pressureMultiplier > 1) {
    alerts.push({
      tone: "green",
      text: `Fronte umido in arrivo (pressione in calo) — bonus micelio da Open-Meteo.`,
    });
  }

  if (reportRel.active) {
    alerts.push({
      tone: "green",
      text: `Ritrovamento utente recente in zona (+${reportRel.bonusPercent}% Sprout Score da segnalazioni verificate).`,
    });
  }

  if (social.socialTrendActive) {
    alerts.push({
      tone: "green",
      text: "Trend social attivo in zona (+15% Sprout Score da segnalazioni community).",
    });
  }

  if (alerts.length === 0) return null;

  const toneClass = {
    orange: "border-orange-500/40 bg-orange-950/40 text-orange-200",
    amber: "border-amber-500/40 bg-amber-950/40 text-amber-200",
    green: "border-green-500/40 bg-green-950/40 text-green-200",
    blue: "border-blue-500/40 bg-blue-950/40 text-blue-200",
  };

  return (
    <div className={`space-y-2 ${compact ? "" : "mt-1"}`}>
      {alerts.map((a, i) => (
        <p
          key={i}
          className={`text-[11px] leading-relaxed rounded-lg px-3 py-2 border ${toneClass[a.tone]}`}
        >
          {a.text}
        </p>
      ))}
    </div>
  );
}
