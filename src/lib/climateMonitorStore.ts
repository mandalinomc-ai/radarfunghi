const CLIMATE_PARKED_KEY = "mushroomradar-climate-parked";
const CLIMATE_POS_KEY = "mushroomradar-climate-pos";

export interface ClimateMonitorPosition {
  x: number;
  y: number;
}

export function loadClimateParked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CLIMATE_PARKED_KEY) === "1";
}

export function saveClimateParked(parked: boolean): void {
  if (typeof window === "undefined") return;
  if (parked) {
    localStorage.setItem(CLIMATE_PARKED_KEY, "1");
  } else {
    localStorage.removeItem(CLIMATE_PARKED_KEY);
  }
}

export function loadClimatePosition(): ClimateMonitorPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLIMATE_POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ClimateMonitorPosition;
    if (typeof p.x === "number" && typeof p.y === "number") return p;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveClimatePosition(pos: ClimateMonitorPosition): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIMATE_POS_KEY, JSON.stringify(pos));
}

export function defaultClimatePosition(): ClimateMonitorPosition {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const w = window.innerWidth;
  return isDesktop
    ? { x: Math.max(16, w - 380), y: 80 }
    : { x: 12, y: 12 };
}
