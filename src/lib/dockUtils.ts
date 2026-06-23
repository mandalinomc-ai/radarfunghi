import type { DockPosition } from "@/lib/telegramDockStore";

export function clampDockPosition(
  x: number,
  y: number,
  w: number,
  h: number
): DockPosition {
  if (typeof window === "undefined") return { x, y };
  const m = 8;
  const maxX = Math.max(m, window.innerWidth - w - m);
  const maxY = Math.max(m, window.innerHeight - h - m);
  return {
    x: Math.min(maxX, Math.max(m, x)),
    y: Math.min(maxY, Math.max(m, y)),
  };
}
