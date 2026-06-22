"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeoPoint } from "@/lib/geoUtils";
import {
  formatHour,
  formatHourRange,
  normalizeHourRange,
  type HourRange,
} from "@/lib/timeRange";
import { addDaysISO, dayOffsetFromToday, formatDateLabel, todayISO } from "@/lib/dateUtils";
import OriginPicker from "./OriginPicker";
import { defaultOrigin } from "@/lib/originStore";

type WizardStep = "when" | "where";

interface SetupWizardModalProps {
  open: boolean;
  step: WizardStep;
  selectedDate: string;
  hourRange: HourRange;
  initialOrigin: GeoPoint;
  maxDayOffset?: number;
  onDateChange: (date: string) => void;
  onHourRangeChange: (range: HourRange) => void;
  onConfirmTime: () => void;
  onConfirmOrigin: (origin: GeoPoint) => void;
  onParkOrigin: () => void;
}

const DAY_LABELS = ["Oggi", "Domani", "Dopodomani", "+3g", "+4g"];

export default function SetupWizardModal({
  open,
  step,
  selectedDate,
  hourRange,
  initialOrigin,
  maxDayOffset = 14,
  onDateChange,
  onHourRangeChange,
  onConfirmTime,
  onConfirmOrigin,
  onParkOrigin,
}: SetupWizardModalProps) {
  const [origin, setOrigin] = useState<GeoPoint>(initialOrigin);
  const [picked, setPicked] = useState(false);
  const [localStart, setLocalStart] = useState(hourRange.startHour);
  const [localEnd, setLocalEnd] = useState(hourRange.endHour);

  useEffect(() => {
    if (open) {
      setOrigin(initialOrigin);
      setPicked(false);
      setLocalStart(hourRange.startHour);
      setLocalEnd(hourRange.endHour);
    }
  }, [open, initialOrigin, hourRange]);

  const applyHours = useCallback(
    (start: number, end: number) => {
      const range = normalizeHourRange(start, end);
      setLocalStart(range.startHour);
      setLocalEnd(range.endHour);
      onHourRangeChange(range);
    },
    [onHourRangeChange]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-forest-950/92 backdrop-blur-md pointer-events-auto safe-top safe-bottom">
      <div
        className="w-full sm:max-w-md bg-forest-900 border border-mushroom-500/35 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-forest-700/50 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <StepPill n={1} active={step === "when"} done={step === "where"} label="Quando" />
            <span className="text-forest-600 text-xs">→</span>
            <StepPill n={2} active={step === "where"} done={false} label="Dove" />
          </div>
          <h2 className="text-lg font-bold text-forest-100">
            {step === "when"
              ? "Quando vuoi cercare i funghi?"
              : "Da dove parti oggi?"}
          </h2>
          <p className="text-xs text-forest-400 mt-2 leading-relaxed">
            {step === "when"
              ? "Scegli giorno e fascia oraria: tutti i consigli (mappa, chat, guida) si basano su questa finestra."
              : "Raggio, distanze e Mastro Fungaiolo usano questo punto. Puoi parcheggiare e impostarlo dopo."}
          </p>
        </div>

        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {step === "when" ? (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-2">
                  Giorno
                </p>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, i) => {
                    const offset = Math.min(i, maxDayOffset);
                    const date = addDaysISO(todayISO(), offset);
                    const active = selectedDate === date;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => onDateChange(date)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold touch-manipulation ${
                          active
                            ? "bg-mushroom-500 text-white"
                            : "bg-forest-800 text-forest-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-forest-500 mt-2">
                  {formatDateLabel(selectedDate)}
                  {dayOffsetFromToday(selectedDate) === 0 ? " · oggi" : ""}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-2">
                  Fascia oraria in bosco
                </p>
                <p className="text-sm font-semibold text-mushroom-300 mb-3">
                  {formatHourRange(hourRange)}
                </p>
                <label className="text-[11px] text-forest-400 block mb-1">
                  Inizio: {formatHour(localStart)}
                </label>
                <input
                  type="range"
                  min={5}
                  max={18}
                  value={localStart}
                  onChange={(e) =>
                    applyHours(Number(e.target.value), localEnd)
                  }
                  className="w-full h-2 rounded-full appearance-none bg-forest-800 accent-mushroom-400 touch-manipulation"
                />
                <label className="text-[11px] text-forest-400 block mt-3 mb-1">
                  Fine: {formatHour(localEnd)}
                </label>
                <input
                  type="range"
                  min={6}
                  max={20}
                  value={localEnd}
                  onChange={(e) =>
                    applyHours(localStart, Number(e.target.value))
                  }
                  className="w-full h-2 rounded-full appearance-none bg-forest-800 accent-mushroom-400 touch-manipulation"
                />
              </div>
            </>
          ) : (
            <>
              <OriginPicker
                origin={origin}
                onOriginChange={(next) => {
                  setOrigin(next);
                  setPicked(true);
                }}
                showLabel={false}
              />
              {!picked && (
                <p className="text-[11px] text-amber-400/90 leading-snug">
                  Scegli Benevento, GPS o scrivi la tua città, oppure parcheggia
                  per ora (useremo Benevento come base).
                </p>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-forest-700/50 flex flex-col gap-2 shrink-0">
          {step === "when" ? (
            <button
              type="button"
              onClick={onConfirmTime}
              className="w-full py-3 rounded-xl bg-mushroom-500 hover:bg-mushroom-400 text-white font-bold text-sm touch-manipulation"
            >
              Continua — scegli partenza
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onConfirmOrigin(origin)}
                disabled={!picked}
                className="w-full py-3 rounded-xl bg-mushroom-500 hover:bg-mushroom-400 disabled:opacity-40 text-white font-bold text-sm touch-manipulation"
              >
                Conferma partenza
              </button>
              <button
                type="button"
                onClick={onParkOrigin}
                className="w-full py-2.5 rounded-xl bg-forest-800 text-forest-300 text-sm font-medium touch-manipulation"
              >
                Parcheggia per ora — uso Benevento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepPill({
  n,
  active,
  done,
  label,
}: {
  n: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
        active
          ? "bg-mushroom-500/25 text-mushroom-200"
          : done
            ? "bg-green-900/40 text-green-300"
            : "bg-forest-800 text-forest-500"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
          active ? "bg-mushroom-500 text-white" : done ? "bg-green-600 text-white" : "bg-forest-700"
        }`}
      >
        {done ? "✓" : n}
      </span>
      {label}
    </span>
  );
}
