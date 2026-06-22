"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RESTORE_DELAY_MS = 1500;

/** Dock compatto durante drag; ripristino automatico 1.5s dopo il rilascio */
export function useMapCompactDebounce(delayMs = RESTORE_DELAY_MS) {
  const [mapCompact, setMapCompact] = useState(false);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRestoreTimer = useCallback(() => {
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  }, []);

  const onMapDragChange = useCallback(
    (dragging: boolean) => {
      if (dragging) {
        clearRestoreTimer();
        setMapCompact(true);
        return;
      }
      clearRestoreTimer();
      restoreTimerRef.current = setTimeout(() => {
        setMapCompact(false);
        restoreTimerRef.current = null;
      }, delayMs);
    },
    [clearRestoreTimer, delayMs]
  );

  useEffect(() => clearRestoreTimer, [clearRestoreTimer]);

  return { mapCompact, onMapDragChange, setMapCompact };
}
