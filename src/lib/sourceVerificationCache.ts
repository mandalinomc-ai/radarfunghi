/** Cache verifiche URL fonti — TTL 6 ore */
import type { SourceVerificationResult } from "./sourceCertificationEngine";

let cache: {
  results: SourceVerificationResult[];
  fetchedAt: number;
} | null = null;

const TTL_MS = 6 * 60 * 60 * 1000;

export function getCachedVerifications(): SourceVerificationResult[] | null {
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > TTL_MS) {
    cache = null;
    return null;
  }
  return cache.results;
}

export function setCachedVerifications(
  results: SourceVerificationResult[]
): void {
  cache = { results, fetchedAt: Date.now() };
}

export function getCacheAgeMinutes(): number | null {
  if (!cache) return null;
  return Math.round((Date.now() - cache.fetchedAt) / 60000);
}
