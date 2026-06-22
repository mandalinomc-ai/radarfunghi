"use client";

import { useEffect, useState } from "react";
import type { ClimateChangeAlert } from "@/lib/climateChangeAlerts";

interface ClimateAlertBoxProps {
  alerts: ClimateChangeAlert[];
  hasFreshChange: boolean;
  loading?: boolean;
  lastUpdate?: string | null;
}

const SEVERITY_STYLES: Record<
  ClimateChangeAlert["severity"],
  { border: string; dot: string; badge: string }
> = {
  critical: {
    border: "border-red-500/50",
    dot: "bg-red-400",
    badge: "bg-red-500/20 text-red-200",
  },
  likely: {
    border: "border-mushroom-400/50",
    dot: "bg-mushroom-400",
    badge: "bg-mushroom-500/20 text-mushroom-200",
  },
  watch: {
    border: "border-amber-500/45",
    dot: "bg-amber-400",
    badge: "bg-amber-500/20 text-amber-200",
  },
  info: {
    border: "border-sky-500/40",
    dot: "bg-sky-400",
    badge: "bg-sky-500/15 text-sky-200",
  },
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function ClimateAlertBox({
  alerts,
  hasFreshChange,
  loading,
  lastUpdate,
}: ClimateAlertBoxProps) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [alerts]);

  useEffect(() => {
    if (alerts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % alerts.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const current = alerts[index];
  const styles = current
    ? SEVERITY_STYLES[current.severity]
    : SEVERITY_STYLES.info;

  return (
    <div
      className={`pointer-events-auto absolute z-[1001] left-2 right-2 top-2 md:left-auto md:right-[4.5rem] md:w-[min(22rem,calc(100%-22rem))] xl:top-3`}
      aria-live="polite"
      aria-label="Avvisi cambiamento climatico"
    >
      <div
        className={`rounded-xl border backdrop-blur-md bg-forest-950/88 shadow-xl transition-all duration-500 ${styles.border} ${
          hasFreshChange ? "ring-2 ring-mushroom-400/40 animate-pulse" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full text-left p-3 md:p-3.5"
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${styles.dot} ${
                hasFreshChange ? "animate-ping" : ""
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-[10px] uppercase tracking-wider text-forest-400 font-medium">
                  Monitor climatico live
                </p>
                {current?.isChange && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${styles.badge}`}>
                    Cambiamento
                  </span>
                )}
                <span className="text-[9px] text-forest-500 ml-auto">
                  {loading ? "sync…" : formatTime(lastUpdate)}
                </span>
              </div>

              {current ? (
                <>
                  <p className="text-xs md:text-sm font-semibold text-forest-100 leading-snug">
                    {current.headline}
                  </p>
                  <p className="text-[11px] text-forest-300 leading-relaxed mt-1 line-clamp-2">
                    {current.detail}
                  </p>
                  {alerts.length > 1 && (
                    <p className="text-[9px] text-forest-500 mt-1.5">
                      {index + 1}/{alerts.length} avvisi · tap per {expanded ? "chiudere" : "dettagli"}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-forest-400">
                  Nessun cambiamento rilevante al momento. Monitor attivo su umidità suolo e piogge.
                </p>
              )}
            </div>
          </div>
        </button>

        {expanded && alerts.length > 0 && (
          <div className="border-t border-forest-700/50 max-h-48 overflow-y-auto px-3 pb-3 space-y-2">
            {alerts.map((a, i) => {
              const s = SEVERITY_STYLES[a.severity];
              return (
                <div
                  key={a.id}
                  className={`rounded-lg px-2.5 py-2 border text-[11px] leading-relaxed ${
                    i === index ? `${s.border} bg-forest-900/60` : "border-forest-700/40 text-forest-400"
                  }`}
                >
                  <p className="font-medium text-forest-200">{a.headline}</p>
                  <p className="mt-0.5">{a.detail}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
