import { head, put } from "@vercel/blob";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { MushroomSpecies } from "./types";

export interface ZoneReliabilityRecord {
  zoneId: string;
  zoneName: string;
  lastActivity: string;
  speciesFound: (MushroomSpecies | "sconosciuto")[];
  reportCount: number;
  /** Bonus additivo al moltiplicatore Sprout (es. 0.15 = +15%) */
  reliabilityBonus: number;
  recentReportIds: string[];
}

const MANIFEST_BLOB_PATH = "mushroom-reports/zone-reliability.json";
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_MANIFEST = path.join(LOCAL_DATA_DIR, "zone-reliability.json");

const MAX_BONUS = 0.3;
export const REPORT_RELIABILITY_BONUS = 0.15;
export const REPORT_RELIABILITY_BONUS_WEAK = 0.08;

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readLocal(): Promise<ZoneReliabilityRecord[]> {
  try {
    const raw = await readFile(LOCAL_MANIFEST, "utf-8");
    const parsed = JSON.parse(raw) as ZoneReliabilityRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(records: ZoneReliabilityRecord[]): Promise<void> {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
  await writeFile(LOCAL_MANIFEST, JSON.stringify(records, null, 2), "utf-8");
}

async function readBlob(): Promise<ZoneReliabilityRecord[]> {
  try {
    const blob = await head(MANIFEST_BLOB_PATH);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = (await res.json()) as ZoneReliabilityRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBlob(records: ZoneReliabilityRecord[]): Promise<void> {
  await put(MANIFEST_BLOB_PATH, JSON.stringify(records), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getAllZoneReliability(): Promise<ZoneReliabilityRecord[]> {
  return hasBlobStorage() ? readBlob() : readLocal();
}

export async function getZoneReliabilityMap(): Promise<
  Record<string, ZoneReliabilityRecord>
> {
  const all = await getAllZoneReliability();
  return Object.fromEntries(all.map((r) => [r.zoneId, r]));
}

export interface UpdateZoneReliabilityInput {
  zoneId: string;
  zoneName: string;
  lastActivity: Date;
  speciesFound: MushroomSpecies | "sconosciuto";
  reliabilityBonusIncrement: number;
  reportId: string;
}

export async function updateZoneReliability(
  input: UpdateZoneReliabilityInput
): Promise<ZoneReliabilityRecord> {
  const records = await getAllZoneReliability();
  const idx = records.findIndex((r) => r.zoneId === input.zoneId);
  const existing = idx >= 0 ? records[idx] : null;

  const speciesFound = existing
    ? [...new Set([...existing.speciesFound, input.speciesFound])]
    : [input.speciesFound];

  const nextBonus = Math.min(
    MAX_BONUS,
    (existing?.reliabilityBonus ?? 0) + input.reliabilityBonusIncrement
  );

  const recentReportIds = [
    input.reportId,
    ...(existing?.recentReportIds ?? []),
  ].slice(0, 20);

  const updated: ZoneReliabilityRecord = {
    zoneId: input.zoneId,
    zoneName: input.zoneName,
    lastActivity: input.lastActivity.toISOString(),
    speciesFound,
    reportCount: (existing?.reportCount ?? 0) + 1,
    reliabilityBonus: Math.round(nextBonus * 1000) / 1000,
    recentReportIds,
  };

  if (idx >= 0) records[idx] = updated;
  else records.push(updated);

  if (hasBlobStorage()) await writeBlob(records);
  else await writeLocal(records);

  return updated;
}
