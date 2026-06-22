import { head, put } from "@vercel/blob";
import type { AggregatedWeatherSnapshot } from "./weatherAggregator";
import { todayISO } from "./dateUtils";

const CACHE_PATH = "weather-cache/latest.json";

/** Oggi: 30 min; date storiche/future lontane: 1 h (audit Gemini §3.2) */
export function getWeatherCacheTtlMs(targetDate?: string): number {
  const today = todayISO();
  if (!targetDate || targetDate === today) {
    return 30 * 60 * 1000;
  }
  return 60 * 60 * 1000;
}

let memoryCache: {
  snapshot: AggregatedWeatherSnapshot;
  expiresAt: number;
} | null = null;

function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readWeatherCache(): Promise<AggregatedWeatherSnapshot | null> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.snapshot;
  }

  if (!hasBlob()) return memoryCache?.snapshot ?? null;

  try {
    const blob = await head(CACHE_PATH);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return memoryCache?.snapshot ?? null;
    const snapshot = (await res.json()) as AggregatedWeatherSnapshot;
    const ttl = getWeatherCacheTtlMs(snapshot.targetDate);
    memoryCache = { snapshot, expiresAt: Date.now() + ttl };
    return snapshot;
  } catch {
    return memoryCache?.snapshot ?? null;
  }
}

export async function writeWeatherCache(
  snapshot: AggregatedWeatherSnapshot
): Promise<void> {
  const ttl = getWeatherCacheTtlMs(snapshot.targetDate);
  memoryCache = { snapshot, expiresAt: Date.now() + ttl };

  if (!hasBlob()) return;

  await put(CACHE_PATH, JSON.stringify(snapshot), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export function isCacheFresh(
  snapshot: AggregatedWeatherSnapshot,
  maxAgeMs?: number
): boolean {
  const ttl = maxAgeMs ?? getWeatherCacheTtlMs(snapshot.targetDate);
  return Date.now() - new Date(snapshot.fetchedAt).getTime() < ttl;
}

/** @deprecated use getWeatherCacheTtlMs */
export const CACHE_TTL_MS = 30 * 60 * 1000;
