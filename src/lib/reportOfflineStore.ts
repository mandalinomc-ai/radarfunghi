import type { MushroomReport, MushroomSpecies, ReportType } from "./types";

const DB_NAME = "mushroomradar-reports";
const DB_VERSION = 1;
const QUEUE_STORE = "pendingUploads";

export interface PendingReportRecord {
  id: string;
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  reportType: ReportType;
  species: MushroomSpecies | "sconosciuto";
  note: string;
  photoBlob: Blob;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function queueReportRecord(
  record: PendingReportRecord
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).put(record);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function listPendingReports(): Promise<PendingReportRecord[]> {
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, "readonly");
  const req = tx.objectStore(QUEUE_STORE).getAll();
  const items = await new Promise<PendingReportRecord[]>((res, rej) => {
    req.onsuccess = () => res(req.result as PendingReportRecord[]);
    req.onerror = () => rej(req.error);
  });
  db.close();
  return items;
}

export async function removePendingReport(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).delete(id);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

function recordToFormData(record: PendingReportRecord): FormData {
  const fd = new FormData();
  fd.append("lat", String(record.lat));
  fd.append("lng", String(record.lng));
  if (record.accuracyMeters != null) {
    fd.append("accuracyMeters", String(record.accuracyMeters));
  }
  fd.append("reportType", record.reportType);
  fd.append("species", record.species);
  fd.append("note", record.note);
  fd.append("photo", record.photoBlob, "report.jpg");
  return fd;
}

export interface SyncPendingResult {
  synced: MushroomReport[];
  failedCount: number;
  lastError: string | null;
}

export async function syncPendingReports(): Promise<SyncPendingResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: [], failedCount: 0, lastError: null };
  }

  const pending = await listPendingReports();
  const synced: MushroomReport[] = [];
  let failedCount = 0;
  let lastError: string | null = null;

  for (const item of pending) {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        body: recordToFormData(item),
      });
      if (!res.ok) {
        failedCount++;
        const data = await res.json().catch(() => ({}));
        lastError =
          (data as { error?: string }).error ??
          `Invio fallito (${res.status}) per segnalazione offline`;
        continue;
      }
      const data = await res.json();
      if (data.report) {
        synced.push(data.report as MushroomReport);
        await removePendingReport(item.id);
      }
    } catch (e) {
      failedCount++;
      lastError =
        e instanceof Error
          ? e.message
          : "Errore di rete durante la sincronizzazione offline";
    }
  }

  return { synced, failedCount, lastError };
}

export async function pendingReportCount(): Promise<number> {
  const list = await listPendingReports();
  return list.length;
}
