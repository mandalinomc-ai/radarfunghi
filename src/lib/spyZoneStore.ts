import { head, put } from "@vercel/blob";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { SpyZoneMarker } from "./types";

const MANIFEST_BLOB_PATH = "mushroom-reports/spy-zones.json";
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_MANIFEST = path.join(LOCAL_DATA_DIR, "spy-zones.json");
const MAX_ZONES = 300;

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readLocal(): Promise<SpyZoneMarker[]> {
  try {
    const raw = await readFile(LOCAL_MANIFEST, "utf-8");
    const parsed = JSON.parse(raw) as SpyZoneMarker[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(zones: SpyZoneMarker[]): Promise<void> {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
  await writeFile(LOCAL_MANIFEST, JSON.stringify(zones, null, 2), "utf-8");
}

async function readBlob(): Promise<SpyZoneMarker[]> {
  try {
    const blob = await head(MANIFEST_BLOB_PATH);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = (await res.json()) as SpyZoneMarker[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBlob(zones: SpyZoneMarker[]): Promise<void> {
  await put(MANIFEST_BLOB_PATH, JSON.stringify(zones), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getAllSpyZones(): Promise<SpyZoneMarker[]> {
  const zones = hasBlobStorage() ? await readBlob() : await readLocal();
  return zones.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addSpyZone(zone: SpyZoneMarker): Promise<SpyZoneMarker> {
  const zones = await getAllSpyZones();
  const updated = [zone, ...zones.filter((z) => z.id !== zone.id)].slice(
    0,
    MAX_ZONES
  );
  if (hasBlobStorage()) await writeBlob(updated);
  else await writeLocal(updated);
  return zone;
}

export async function removeSpyZone(id: string): Promise<boolean> {
  const zones = await getAllSpyZones();
  const next = zones.filter((z) => z.id !== id);
  if (next.length === zones.length) return false;
  if (hasBlobStorage()) await writeBlob(next);
  else await writeLocal(next);
  return true;
}
