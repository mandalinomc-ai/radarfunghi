import { head, put } from "@vercel/blob";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { MushroomReport } from "./types";

const MANIFEST_BLOB_PATH = "mushroom-reports/manifest.json";
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_MANIFEST = path.join(LOCAL_DATA_DIR, "reports.json");

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readLocalManifest(): Promise<MushroomReport[]> {
  try {
    const raw = await readFile(LOCAL_MANIFEST, "utf-8");
    const parsed = JSON.parse(raw) as MushroomReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalManifest(reports: MushroomReport[]): Promise<void> {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
  await writeFile(LOCAL_MANIFEST, JSON.stringify(reports, null, 2), "utf-8");
}

async function readBlobManifest(): Promise<MushroomReport[]> {
  try {
    const blob = await head(MANIFEST_BLOB_PATH);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = (await res.json()) as MushroomReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBlobManifest(reports: MushroomReport[]): Promise<void> {
  await put(MANIFEST_BLOB_PATH, JSON.stringify(reports), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getAllReports(): Promise<MushroomReport[]> {
  const reports = hasBlobStorage()
    ? await readBlobManifest()
    : await readLocalManifest();
  return reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveReportPhoto(
  id: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (hasBlobStorage()) {
    const blob = await put(`mushroom-reports/photos/${id}.jpg`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const photosDir = path.join(LOCAL_DATA_DIR, "photos");
  await mkdir(photosDir, { recursive: true });
  const filePath = path.join(photosDir, `${id}.jpg`);
  await writeFile(filePath, buffer);
  return `/api/reports/photo/${id}`;
}

export async function addReport(report: MushroomReport): Promise<MushroomReport> {
  const reports = await getAllReports();
  const updated = [report, ...reports].slice(0, 500);
  if (hasBlobStorage()) {
    await writeBlobManifest(updated);
  } else {
    await writeLocalManifest(updated);
  }
  return report;
}

export async function getLocalPhoto(id: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(LOCAL_DATA_DIR, "photos", `${id}.jpg`);
    return await readFile(filePath);
  } catch {
    return null;
  }
}
