"use client";

import { todayISO } from "@/lib/dateUtils";
import {
  getSpeciesInSeasonForMonth,
  getMonthFromDate,
  MONTH_NAMES_IT,
} from "@/lib/seasonalCalendar";
import { getSpeciesLabel } from "@/lib/predictionEngine";

export default function SeasonalSpeciesBanner() {
  const month = getMonthFromDate(todayISO());
  const { peak, active } = getSpeciesInSeasonForMonth(month);

  if (peak.length === 0 && active.length === 0) return null;

  return (
    <div className="rounded-xl bg-forest-950/60 border border-mushroom-500/25 px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-wider text-mushroom-400 font-semibold">
        Stagione {MONTH_NAMES_IT[month]} — Sud Italia
      </p>
      {peak.length > 0 && (
        <p className="text-[11px] text-forest-300 mt-1">
          <span className="text-mushroom-300 font-medium">Picco:</span>{" "}
          {peak.map(getSpeciesLabel).join(", ")}
        </p>
      )}
      {active.length > 0 && (
        <p className="text-[10px] text-forest-500 mt-0.5">
          Attive: {active.map(getSpeciesLabel).join(", ")}
        </p>
      )}
      <p className="text-[9px] text-forest-600 mt-1">
        Da Funghimagazine calendario porcini + guide habitat FM
      </p>
    </div>
  );
}
