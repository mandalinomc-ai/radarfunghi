import type { MushroomSpecies } from "./types";

const DB_NAME = "mushroomradar-diario";
const DB_VERSION = 1;
const ENTRIES_STORE = "raccolti";

export interface DiarioEntry {
  id: string;
  date: string;
  lat: number;
  lng: number;
  species: MushroomSpecies | "sconosciuto";
  weightKg: number;
  forestNotes: string;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        const store = db.createObjectStore(ENTRIES_STORE, { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
      }
    };
  });
}

export async function listDiarioEntries(): Promise<DiarioEntry[]> {
  const db = await openDb();
  const tx = db.transaction(ENTRIES_STORE, "readonly");
  const req = tx.objectStore(ENTRIES_STORE).getAll();
  const items = await new Promise<DiarioEntry[]>((res, rej) => {
    req.onsuccess = () => res(req.result as DiarioEntry[]);
    req.onerror = () => rej(req.error);
  });
  db.close();
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveDiarioEntry(entry: DiarioEntry): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(ENTRIES_STORE, "readwrite");
  tx.objectStore(ENTRIES_STORE).put(entry);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function deleteDiarioEntry(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(ENTRIES_STORE, "readwrite");
  tx.objectStore(ENTRIES_STORE).delete(id);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}

export async function totalHarvestKg(): Promise<number> {
  const entries = await listDiarioEntries();
  return Math.round(entries.reduce((s, e) => s + e.weightKg, 0) * 100) / 100;
}

export function createDiarioEntry(
  partial: Omit<DiarioEntry, "id" | "createdAt">
): DiarioEntry {
  return {
    ...partial,
    id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
}
