/**
 * API pubblica catalogo fonti — delega a sourceRegistry + sourceTypes.
 * La certificazione NON è statica: calcolata da sourceCertificationEngine.
 */
export type {
  CertifiedSource,
  CertifiedSourceCategory,
} from "./sourceTypes";

export { CATEGORY_LABELS } from "./sourceTypes";

export { SOURCE_REGISTRY } from "./sourceRegistry";

import { SOURCE_REGISTRY } from "./sourceRegistry";
import type { CertifiedSource, CertifiedSourceCategory } from "./sourceTypes";
import { CATEGORY_LABELS } from "./sourceTypes";
import {
  filterActiveSources,
  verifyAllSources,
  type SourceVerificationResult,
} from "./sourceCertificationEngine";

/** Catalogo grezzo — verificare con verifyAllSources prima di citare */
export const CERTIFIED_SOURCES: CertifiedSource[] = SOURCE_REGISTRY;

export const CERTIFIED_SOURCE_COUNT = SOURCE_REGISTRY.length;

export const CATALOG_META = {
  version: "2026.06.22-algo",
  lastReviewed: "2026-06-22T12:00:00.000Z",
  nextReviewDue: "2026-09-22T12:00:00.000Z",
  maintainer: "MushroomRadar",
  reviewPolicy:
    "Certificazione algoritmica: dominio PA/istituzionale, URL raggiungibile, oEmbed YouTube, incrocio tematico. Nessuna voce inventata.",
} as const;

export function getCertifiedSourcesByCategory(
  category: CertifiedSourceCategory
): CertifiedSource[] {
  return CERTIFIED_SOURCES.filter((s) => s.category === category);
}

export function getCertifiedSourcesByRegion(region: string): CertifiedSource[] {
  const norm = region.toLowerCase();
  return CERTIFIED_SOURCES.filter(
    (s) =>
      s.region?.toLowerCase().includes(norm) ||
      s.topics.some((t) => t.toLowerCase().includes(norm))
  );
}

export function searchCertifiedSources(query: string): CertifiedSource[] {
  const q = query.toLowerCase().trim();
  if (!q) return CERTIFIED_SOURCES;
  return CERTIFIED_SOURCES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.shortName.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.topics.some((t) => t.toLowerCase().includes(q)) ||
      s.region?.toLowerCase().includes(q)
  );
}

/** Solo fonti passate dalla verifica algoritmica */
export function formatVerifiedSourcesForGemini(
  verifications: SourceVerificationResult[],
  limit = 40
): string {
  const active = filterActiveSources(CERTIFIED_SOURCES, verifications);
  return active.slice(0, limit).map((s) => {
    const v = verifications.find((x) => x.sourceId === s.id);
    return `- [${v?.level ?? "?"}] ${s.shortName}: ${s.description} (${s.url})`;
  }).join("\n");
}

/** @deprecated usare formatVerifiedSourcesForGemini con verifiche runtime */
export function formatCertifiedSourcesForGemini(limit = 40): string {
  return CERTIFIED_SOURCES.slice(0, limit)
    .map(
      (s) =>
        `- [${CATEGORY_LABELS[s.category]}] ${s.shortName}: ${s.description} (${s.url})`
    )
    .join("\n");
}

export {
  verifyAllSources,
  filterActiveSources,
  type SourceVerificationResult,
} from "./sourceCertificationEngine";

export {
  LEVEL_LABELS,
  LEVEL_COLORS,
  type CertificationLevel,
} from "./sourceCertificationEngine";
