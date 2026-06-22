import type { MushroomSpecies } from "./types";
import {
  CAMPANIA_SOCIAL_FORAGING_TRENDS,
  type CampaniaSocialTrend,
  type SocialSourceEvidence,
  type SocialVerificationLevel,
} from "./campaniaSocialTrends";
import { getSpeciesLabel } from "./predictionEngine";

export interface SocialCitationSummary {
  trendId: string;
  trendTitle: string;
  authorName: string;
  handle: string;
  platform: CampaniaSocialTrend["platform"];
  postUrl: string;
  publishedAt: string;
  excerpt: string;
  verificationLevel: SocialVerificationLevel;
  verificationLabel: string;
  region: string;
  speciesLabels: string[];
  locationMentioned: string;
}

const VERIFICATION_LABELS: Record<SocialVerificationLevel, string> = {
  verified_public:
    "Post pubblico verificato (autore e link consultabili)",
  community:
    "Segnalazione community — non verificata sul campo dal radar",
  editorial: "Fonte editoriale / aggregatore",
};

const VAGUE_SOCIAL_PATTERNS: RegExp[] = [
  /In più,?\s*c['']?[èe]\s*un\s*bel\s*chiacchiericcio[^.\n]*[.\n]?/gi,
  /c['']?[èe]\s*un\s*bel\s*chiacchiericcio[^.\n]*[.\n]?/gi,
  /TikTok\s*(che\s*)?conferma[^.\n]*[.\n]?/gi,
  /sui\s*social[^.\n]*(?:conferma|ritrovament)[^.\n]*[.\n]?/gi,
  /(?:Instagram|TikTok|Facebook)\s*(?:conferma|segnala)[^.\n]*(?:senza|non)[^.\n]*[.\n]?/gi,
  /trend\s*social\s*(?:generico|vago|positivo)[^.\n]*[.\n]?/gi,
];

export function verificationLabel(
  level: SocialVerificationLevel
): string {
  return VERIFICATION_LABELS[level];
}

export function platformLabel(
  platform: CampaniaSocialTrend["platform"]
): string {
  const map: Record<CampaniaSocialTrend["platform"], string> = {
    tiktok: "TikTok",
    instagram: "Instagram",
    facebook: "Facebook",
    telegram: "Telegram",
    community: "Community",
  };
  return map[platform];
}

/** Rimuove frasi generiche sui social che Gemini tende a inventare */
export function sanitizeVagueSocialPhrases(text: string): string {
  let out = text;
  for (const pattern of VAGUE_SOCIAL_PATTERNS) {
    out = out.replace(pattern, "");
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function getRelevantSocialTrends(
  regions: string[],
  species: MushroomSpecies | "all"
): CampaniaSocialTrend[] {
  const regionSet = new Set(regions.map((r) => r.toLowerCase()));

  return CAMPANIA_SOCIAL_FORAGING_TRENDS.filter((t) => {
    if (t.radarAlignment === "attenzione") return false;
    if (!t.evidence?.length) return false;

    const regionMatch = t.regions.some((r) => regionSet.has(r.toLowerCase()));
    const speciesMatch =
      species === "all" ||
      t.species.some((s) => s === species) ||
      t.evidence.some((e) =>
        e.speciesMentioned.some((s) => s === species)
      );

    return regionMatch && speciesMatch;
  }).sort((a, b) => {
    const score = (t: CampaniaSocialTrend) =>
      (t.radarAlignment === "conferma" ? 2 : 1) +
      (t.confidenceLevel === "alta" ? 1 : 0);
    return score(b) - score(a);
  });
}

export function buildSocialCitationSummaries(
  trends: CampaniaSocialTrend[],
  maxItems = 4
): SocialCitationSummary[] {
  const citations: SocialCitationSummary[] = [];

  for (const trend of trends) {
    for (const ev of trend.evidence) {
      if (citations.length >= maxItems) break;
      citations.push({
        trendId: trend.id,
        trendTitle: trend.title,
        authorName: ev.authorName,
        handle: ev.handle,
        platform: ev.platform,
        postUrl: ev.postUrl,
        publishedAt: ev.publishedAt,
        excerpt: ev.excerpt,
        verificationLevel: ev.verificationLevel,
        verificationLabel: verificationLabel(ev.verificationLevel),
        region: ev.locationMentioned,
        speciesLabels: ev.speciesMentioned.map(getSpeciesLabel),
        locationMentioned: ev.locationMentioned,
      });
    }
  }

  return citations;
}

export function formatSocialEvidenceMarkdown(
  citations: SocialCitationSummary[]
): string {
  if (citations.length === 0) return "";

  const lines = citations.map((c, i) => {
    const verified =
      c.verificationLevel === "verified_public" ? "✓" : "○";
    return `${i + 1}. **${c.authorName}** (${c.handle}) · ${platformLabel(c.platform)} · ${c.publishedAt}
   ${verified} _${c.verificationLabel}_
   «${c.excerpt}»
   📍 ${c.locationMentioned} · Specie: ${c.speciesLabels.join(", ")}
   🔗 ${c.postUrl}`;
  });

  return `\n\n---\n**Fonti social pubbliche** _(solo post citabili — non sostituiscono lo Sprout Score)_\n\n${lines.join("\n\n")}`;
}

export function enrichMastroReplyWithSocialEvidence(
  reply: string,
  regions: string[],
  species: MushroomSpecies | "all"
): { reply: string; socialEvidence: SocialCitationSummary[] } {
  const cleaned = sanitizeVagueSocialPhrases(reply);
  const trends = getRelevantSocialTrends(regions, species);
  const citations = buildSocialCitationSummaries(trends);

  if (citations.length === 0) {
    return { reply: cleaned, socialEvidence: [] };
  }

  const verifiedOnly = citations.filter(
    (c) => c.verificationLevel === "verified_public"
  );
  const toShow = verifiedOnly.length > 0 ? verifiedOnly : citations.slice(0, 2);

  const hint =
    toShow.length > 0 && !cleaned.includes("Fonti social")
      ? `\n\n_Segnalazioni social pubbliche verificabili — vedi schede sotto._`
      : "";

  return {
    reply: cleaned + hint,
    socialEvidence: toShow,
  };
}

export function formatSocialTrendsForGeminiPrompt(
  regions: string[]
): string {
  const regionSet = new Set(regions.map((r) => r.toLowerCase()));
  const trends = CAMPANIA_SOCIAL_FORAGING_TRENDS.filter(
    (t) =>
      t.radarAlignment !== "attenzione" &&
      t.evidence?.length &&
      t.regions.some((r) => regionSet.has(r.toLowerCase()))
  );

  if (trends.length === 0) {
    return "Nessun trend social verificabile per le zone attive. NON menzionare TikTok, Instagram o «chiacchiericcio sui social».";
  }

  return trends
    .map((t) => {
      const evidenceBlock = t.evidence
        .map(
          (e) =>
            `    • ${e.authorName} (${e.handle}) — ${platformLabel(e.platform)} ${e.publishedAt}
      Citazione: «${e.excerpt}»
      Luogo citato: ${e.locationMentioned}
      Link: ${e.postUrl}
      Verifica: ${verificationLabel(e.verificationLevel)}`
        )
        .join("\n");

      return `- **${t.title}** [${t.radarAlignment}, confidenza ${t.confidenceLevel}, agg. ${t.updatedAt}]
  ${t.summary}
  Fonti pubbliche citabili:
${evidenceBlock}`;
    })
    .join("\n\n");
}
