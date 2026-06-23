export interface DockPosition {
  x: number;
  y: number;
}

const POS_KEY = "mushroomradar-telegram-dock-pos";
const OPEN_KEY = "mushroomradar-telegram-dock-open";

export function defaultTelegramDockPosition(): DockPosition {
  if (typeof window === "undefined") return { x: 16, y: 400 };
  const isMd = window.innerWidth >= 768;
  return {
    x: isMd ? 24 : 16,
    y: window.innerHeight - (isMd ? 200 : 220),
  };
}

export function loadTelegramDockPosition(): DockPosition | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as DockPosition;
    if (typeof p.x === "number" && typeof p.y === "number") return p;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveTelegramDockPosition(pos: DockPosition) {
  localStorage.setItem(POS_KEY, JSON.stringify(pos));
}

export function loadTelegramDockOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveTelegramDockOpen(open: boolean) {
  localStorage.setItem(OPEN_KEY, open ? "1" : "0");
}
