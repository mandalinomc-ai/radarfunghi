import type { FungalZone } from "./types";
import { CAMPANIA_SOCIAL_FORAGING_TRENDS } from "./campaniaSocialTrends";

export const MONITORED_HASHTAGS = [
  "#porciniCampania",
  "#matese",
  "#taburnoFunghi",
  "#sannio",
  "#funghiBenevento",
  "#pollino",
] as const;

const ACTIVE_PHRASES = [
  "buttata incredibile",
  "trovati stamattina",
  "cacciata dei neri",
  "bottata",
  "spie",
  "raccolta oggi",
];

export interface SocialSignal {
  region: FungalZone["region"];
  videoCount: number;
  hashtags: string[];
  bonusPercent: number;
  socialTrendActive: boolean;
}

/** Analisi lessicale trend social — Specifica Master §6 */
export function analyzeSocialSignals(): SocialSignal[] {
  const byRegion = new Map<FungalZone["region"], SocialSignal>();

  for (const trend of CAMPANIA_SOCIAL_FORAGING_TRENDS) {
    if (trend.radarAlignment === "attenzione") continue;

    const text = `${trend.summary} ${trend.hashtags.join(" ")}`.toLowerCase();
    const phraseHits = ACTIVE_PHRASES.filter((p) => text.includes(p)).length;
    const videoWeight =
      trend.radarAlignment === "conferma" ? 2 : 1 + (phraseHits > 0 ? 1 : 0);

    for (const region of trend.regions) {
      const r = region as FungalZone["region"];
      const existing = byRegion.get(r) ?? {
        region: r,
        videoCount: 0,
        hashtags: [],
        bonusPercent: 0,
        socialTrendActive: false,
      };
      existing.videoCount += videoWeight;
      existing.hashtags.push(...trend.hashtags);
      byRegion.set(r, existing);
    }
  }

  return [...byRegion.values()].map((signal) => {
    const socialTrendActive = signal.videoCount >= 3;
    return {
      ...signal,
      hashtags: [...new Set(signal.hashtags)],
      bonusPercent: socialTrendActive ? 15 : 0,
      socialTrendActive,
    };
  });
}

export function getSocialBonusForRegion(
  region: FungalZone["region"]
): { bonusMultiplier: number; socialTrendActive: boolean } {
  const signal = analyzeSocialSignals().find((s) => s.region === region);
  if (!signal?.socialTrendActive) {
    return { bonusMultiplier: 1, socialTrendActive: false };
  }
  return { bonusMultiplier: 1.15, socialTrendActive: true };
}
