const GUIDE_BANNER_POS_KEY = "mushroomradar-guide-banner-pos";

export interface GuideBannerPosition {
  x: number;
  y: number;
}

export function loadGuideBannerPosition(): GuideBannerPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUIDE_BANNER_POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as GuideBannerPosition;
    if (typeof p.x === "number" && typeof p.y === "number") return p;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveGuideBannerPosition(pos: GuideBannerPosition): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUIDE_BANNER_POS_KEY, JSON.stringify(pos));
}

export function defaultGuideBannerPosition(): GuideBannerPosition {
  if (typeof window === "undefined") return { x: 16, y: 400 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const width = Math.min(320, w - 24);
  return {
    x: Math.max(12, (w - width) / 2),
    y: Math.max(80, h - 300),
  };
}

export function clampGuideBannerPosition(
  x: number,
  y: number,
  boxW: number,
  boxH: number
): GuideBannerPosition {
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - boxW - margin);
  const maxY = Math.max(margin, window.innerHeight - boxH - margin);
  return {
    x: Math.min(maxX, Math.max(margin, x)),
    y: Math.min(maxY, Math.max(margin, y)),
  };
}
