"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeoPoint } from "@/lib/geoUtils";
import OriginPicker from "./OriginPicker";
import { defaultOrigin } from "@/lib/originStore";

interface OriginSetupModalProps {
  open: boolean;
  initialOrigin?: GeoPoint;
  /** Prima configurazione — non si può chiudere senza confermare */
  required?: boolean;
  onConfirm: (origin: GeoPoint) => void;
  onCancel?: () => void;
}

export default function OriginSetupModal({
  open,
  initialOrigin,
  required = true,
  onConfirm,
  onCancel,
}: OriginSetupModalProps) {
  const [origin, setOrigin] = useState<GeoPoint>(
    () => initialOrigin ?? defaultOrigin()
  );
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (open) {
      setOrigin(initialOrigin ?? defaultOrigin());
      setPicked(!required);
    }
  }, [open, initialOrigin, required]);

  const handleOriginChange = useCallback((next: GeoPoint) => {
    setOrigin(next);
    setPicked(true);
  }, []);

  const handleConfirm = () => {
    if (!picked && required) return;
    onConfirm(origin);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-forest-950/92 backdrop-blur-md pointer-events-auto safe-top safe-bottom">
      <div
        className="w-full sm:max-w-md bg-forest-900 border border-mushroom-500/35 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="origin-setup-title"
      >
        <div className="px-5 py-4 border-b border-forest-700/50 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-mushroom-400 font-semibold">
            Passo 1 · obbligatorio
          </p>
          <h2
            id="origin-setup-title"
            className="text-lg font-bold text-forest-100 mt-1"
          >
            Da dove parti oggi?
          </h2>
          <p className="text-xs text-forest-400 mt-2 leading-relaxed">
            Raggio, distanze, guida principianti e Mastro Fungaiolo usano questo
            punto. Senza partenza corretta i consigli possono essere troppo
            lontani — o troppo vicini — rispetto a dove vuoi andare.
          </p>
        </div>

        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">
          <OriginPicker
            origin={origin}
            onOriginChange={handleOriginChange}
            showLabel={false}
          />
          {!picked && required && (
            <p className="text-[11px] text-amber-400/90 mt-3 leading-snug">
              Scegli Benevento, GPS o scrivi la tua città/paese, poi conferma.
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-forest-700/50 flex gap-2 shrink-0">
          {!required && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-forest-800 text-forest-300 font-semibold text-sm touch-manipulation"
            >
              Annulla
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={required && !picked}
            className="flex-1 py-3 rounded-xl bg-mushroom-500 hover:bg-mushroom-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm touch-manipulation shadow-lg shadow-mushroom-900/30"
          >
            {required ? "Conferma partenza e inizia" : "Salva partenza"}
          </button>
        </div>
      </div>
    </div>
  );
}
