"use client";

import { useCallback, useRef, useState } from "react";
import type { DockPosition } from "@/lib/telegramDockStore";
import { isMobileDevice } from "@/lib/deviceUtils";

const DRAG_THRESHOLD = 10;

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
  size: { w: number; h: number },
  enabled = true
) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    active: boolean;
  } | null>(null);

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !pos) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
        moved: false,
        active: false,
      };
    },
    [enabled, pos]
  );

  const onDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !dragRef.current || !pos) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!dragRef.current.active) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
          return;
        }
        dragRef.current.active = true;
        dragRef.current.moved = true;
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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
    [enabled, pos, setPos, size.w, size.h]
  );

  const onDragEnd = useCallback(
    (e: React.PointerEvent, onTap?: () => void) => {
      if (!dragRef.current) return;
      const wasTap = !dragRef.current.moved;
      const wasActive = dragRef.current.active;
      dragRef.current = null;
      setDragging(false);
      if (wasActive) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (wasTap && onTap) onTap();
    },
    []
  );

  return { dragging, onDragStart, onDragMove, onDragEnd, dragEnabled: enabled };
}
