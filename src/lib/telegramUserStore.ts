export interface TelegramUserPrefs {
  chatId: string;
  zoneId: string | null;
  subscribed: boolean;
  minScore: number;
  updatedAt: string;
}

interface StoreFile {
  users: Record<string, TelegramUserPrefs>;
}

const memory = new Map<string, TelegramUserPrefs>();
const BLOB_PATH = "telegram/user-prefs.json";

let cacheLoaded = false;

async function loadFromBlob(): Promise<StoreFile | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "telegram/", token });
    const hit = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!hit?.url) return null;
    const res = await fetch(hit.url);
    if (!res.ok) return null;
    return (await res.json()) as StoreFile;
  } catch {
    return null;
  }
}

async function saveToBlob(data: StoreFile): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;
  try {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATH, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      token,
      allowOverwrite: true,
    });
  } catch {
    /* ignore */
  }
}

async function ensureLoaded(): Promise<void> {
  if (cacheLoaded) return;
  const file = await loadFromBlob();
  if (file?.users) {
    for (const [id, prefs] of Object.entries(file.users)) {
      memory.set(id, prefs);
    }
  }
  cacheLoaded = true;
}

async function persist(): Promise<void> {
  const users: Record<string, TelegramUserPrefs> = {};
  for (const [id, prefs] of memory) users[id] = prefs;
  await saveToBlob({ users });
}

export async function getUserPrefs(chatId: string): Promise<TelegramUserPrefs> {
  await ensureLoaded();
  const existing = memory.get(chatId);
  if (existing) return existing;
  const fresh: TelegramUserPrefs = {
    chatId,
    zoneId: null,
    subscribed: false,
    minScore: 70,
    updatedAt: new Date().toISOString(),
  };
  memory.set(chatId, fresh);
  return fresh;
}

export async function updateUserPrefs(
  chatId: string,
  patch: Partial<Omit<TelegramUserPrefs, "chatId">>
): Promise<TelegramUserPrefs> {
  const current = await getUserPrefs(chatId);
  const next: TelegramUserPrefs = {
    ...current,
    ...patch,
    chatId,
    updatedAt: new Date().toISOString(),
  };
  memory.set(chatId, next);
  await persist();
  return next;
}

export async function listSubscribers(): Promise<TelegramUserPrefs[]> {
  await ensureLoaded();
  return [...memory.values()].filter((u) => u.subscribed && u.zoneId);
}

export async function setZone(chatId: string, zoneId: string): Promise<TelegramUserPrefs> {
  return updateUserPrefs(chatId, { zoneId });
}

export async function toggleSubscribe(
  chatId: string,
  on: boolean
): Promise<TelegramUserPrefs> {
  return updateUserPrefs(chatId, { subscribed: on });
}
