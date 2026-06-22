const TIME_CONFIRMED_KEY = "mushroomradar-time-confirmed";
const ORIGIN_PARKED_KEY = "mushroomradar-origin-parked";
const GUIDE_PARKED_KEY = "mushroomradar-guide-parked";

export function loadTimeWindowConfirmed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TIME_CONFIRMED_KEY) === "1";
}

export function saveTimeWindowConfirmed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TIME_CONFIRMED_KEY, "1");
}

export function loadOriginParked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ORIGIN_PARKED_KEY) === "1";
}

export function saveOriginParked(parked: boolean): void {
  if (typeof window === "undefined") return;
  if (parked) {
    localStorage.setItem(ORIGIN_PARKED_KEY, "1");
  } else {
    localStorage.removeItem(ORIGIN_PARKED_KEY);
  }
}

export function loadGuideParked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GUIDE_PARKED_KEY) === "1";
}

export function saveGuideParked(parked: boolean): void {
  if (typeof window === "undefined") return;
  if (parked) {
    localStorage.setItem(GUIDE_PARKED_KEY, "1");
  } else {
    localStorage.removeItem(GUIDE_PARKED_KEY);
  }
}
