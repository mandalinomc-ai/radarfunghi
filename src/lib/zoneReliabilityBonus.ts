import type { ZoneReliabilityRecord } from "./zoneReliabilityStore";

let reliabilityByZone: Record<string, ZoneReliabilityRecord> = {};

export function setZoneReliabilityFromSync(
  records: ZoneReliabilityRecord[] | Record<string, ZoneReliabilityRecord>
): void {
  if (Array.isArray(records)) {
    reliabilityByZone = Object.fromEntries(records.map((r) => [r.zoneId, r]));
  } else {
    reliabilityByZone = records;
  }
}

function decayedBonus(record: ZoneReliabilityRecord): number {
  const daysSince =
    (Date.now() - new Date(record.lastActivity).getTime()) /
    (1000 * 60 * 60 * 24);

  let bonus = record.reliabilityBonus;
  if (daysSince > 7) bonus *= 0.5;
  if (daysSince > 14) bonus *= 0.5;
  if (daysSince > 30) bonus = 0;
  return bonus;
}

export function getReportReliabilityMultiplier(zoneId: string): {
  multiplier: number;
  bonusPercent: number;
  active: boolean;
  lastActivity: string | null;
} {
  const record = reliabilityByZone[zoneId];
  if (!record) {
    return {
      multiplier: 1,
      bonusPercent: 0,
      active: false,
      lastActivity: null,
    };
  }

  const bonus = decayedBonus(record);
  if (bonus <= 0) {
    return {
      multiplier: 1,
      bonusPercent: 0,
      active: false,
      lastActivity: record.lastActivity,
    };
  }

  return {
    multiplier: 1 + bonus,
    bonusPercent: Math.round(bonus * 100),
    active: true,
    lastActivity: record.lastActivity,
  };
}

export function getZoneReliabilitySnapshot(): ZoneReliabilityRecord[] {
  return Object.values(reliabilityByZone);
}
