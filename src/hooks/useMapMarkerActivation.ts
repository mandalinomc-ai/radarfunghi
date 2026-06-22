"use client";

import { useCallback, useRef } from "react";
import type { LeafletMouseEvent } from "leaflet";

const DOUBLE_ACTIVATE_MS = 340;
const PREVIEW_DELAY_MS = 360;

type TapState = {
  id: string;
  time: number;
  timer: ReturnType<typeof setTimeout> | null;
};

function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function isTouchLike(event: LeafletMouseEvent): boolean {
  const oe = event.originalEvent;
  if ("pointerType" in oe && oe.pointerType === "touch") return true;
  return isCoarsePointer();
}

export function useMapMarkerActivation() {
  const tapRef = useRef<TapState>({ id: "", time: 0, timer: null });

  const clearPreviewTimer = useCallback(() => {
    if (tapRef.current.timer) {
      clearTimeout(tapRef.current.timer);
      tapRef.current.timer = null;
    }
  }, []);

  const activate = useCallback(
    (
      markerId: string,
      event: LeafletMouseEvent,
      onPreview: () => void,
      onOpen: () => void
    ) => {
      event.originalEvent.stopPropagation();
      const now = Date.now();
      const tap = tapRef.current;

      if (tap.id === markerId && now - tap.time < DOUBLE_ACTIVATE_MS) {
        clearPreviewTimer();
        tapRef.current = { id: "", time: 0, timer: null };
        onOpen();
        return;
      }

      clearPreviewTimer();
      tapRef.current = { id: markerId, time: now, timer: null };

      if (isTouchLike(event)) {
        onPreview();
        return;
      }

      tapRef.current.timer = setTimeout(() => {
        if (tapRef.current.id === markerId) {
          onPreview();
        }
      }, PREVIEW_DELAY_MS);
    },
    [clearPreviewTimer]
  );

  const doubleActivate = useCallback(
    (event: LeafletMouseEvent, onOpen: () => void) => {
      event.originalEvent.stopPropagation();
      clearPreviewTimer();
      tapRef.current = { id: "", time: 0, timer: null };
      onOpen();
    },
    [clearPreviewTimer]
  );

  const hoverPreview = useCallback(
    (onPreview: () => void) => {
      if (isCoarsePointer()) return;
      clearPreviewTimer();
      onPreview();
    },
    [clearPreviewTimer]
  );

  const hoverEnd = useCallback(
    (onClear: () => void) => {
      if (isCoarsePointer()) return;
      clearPreviewTimer();
      onClear();
    },
    [clearPreviewTimer]
  );

  return { activate, doubleActivate, hoverPreview, hoverEnd };
}
