"use client";

import { useCallback, useRef, useState } from "react";
import type { DockPosition } from "@/lib/telegramDockStore";

export function clampDockPosition(
  x: number,
  y: number,
  w: number,
  h: number
): DockPosition {
  const m = 8;
  const maxX = Math.max(m, window.innerWidth - w - m);
  const maxY = Math.max(m, window.innerHeight - h - m);
  return {
    x: Math.min(maxX, Math.max(m, x)),
    y: Math.min(maxY, Math.max(m, y)),
  };
}

export function useDraggableDock(
  pos: DockPosition | null,
  setPos: (p: DockPosition) => void,
  size: { w: number; h: number }
) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const onDragStart = useCallback(
    (e: React.PointerEvent, dragHandle?: boolean) => {
      if (!dragHandle && (e.target as HTMLElement).closest("a,button,input")) {
        return;
      }
      if (!pos) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
        moved: false,
      };
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const onDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !pos) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragRef.current.moved = true;
      }
      setPos(
        clampDockPosition(
          dragRef.current.originX + dx,
          dragRef.current.originY + dy,
          size.w,
          size.h
        )
      );
    },
    [pos, setPos, size.w, size.h]
  );

  const onDragEnd = useCallback(
    (e: React.PointerEvent, onTap?: () => void) => {
      if (!dragRef.current) return;
      const wasTap = !dragRef.current.moved;
      dragRef.current = null;
      setDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (wasTap && onTap) onTap();
    },
    []
  );

  return { dragging, onDragStart, onDragMove, onDragEnd };
}
