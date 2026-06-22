"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClimateChangeAlert } from "@/lib/climateChangeAlerts";
import {
  defaultClimatePosition,
  loadClimateParked,
  loadClimatePosition,
  saveClimateParked,
  saveClimatePosition,
  type ClimateMonitorPosition,
} from "@/lib/climateMonitorStore";

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

function clampPosition(
  x: number,
  y: number,
  boxW: number,
  boxH: number
): ClimateMonitorPosition {
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - boxW - margin);
  const maxY = Math.max(margin, window.innerHeight - boxH - margin);
  return {
    x: Math.min(maxX, Math.max(margin, x)),
    y: Math.min(maxY, Math.max(margin, y)),
  };
}

export default function ClimateAlertBox({
  alerts,
  hasFreshChange,
  loading,
  lastUpdate,
}: ClimateAlertBoxProps) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [parked, setParked] = useState(false);
  const [pos, setPos] = useState<ClimateMonitorPosition | null>(null);
  const [dragging, setDragging] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setParked(loadClimateParked());
    setPos(loadClimatePosition() ?? defaultClimatePosition());
  }, []);

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

  const handlePark = useCallback(() => {
    setParked(true);
    setExpanded(false);
    saveClimateParked(true);
    if (pos) saveClimatePosition(pos);
  }, [pos]);

  const handleUnpark = useCallback(() => {
    setParked(false);
    saveClimateParked(false);
    if (!pos) setPos(defaultClimatePosition());
  }, [pos]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (parked) return;
      const target = e.target as HTMLElement;
      if (!target.closest("[data-climate-drag]")) return;
      e.preventDefault();
      const current = pos ?? defaultClimatePosition();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: current.x,
        originY: current.y,
        moved: false,
      };
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [parked, pos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        dragRef.current.moved = true;
      }
      const w = boxRef.current?.offsetWidth ?? (parked ? 48 : 320);
      const h = boxRef.current?.offsetHeight ?? (parked ? 48 : 120);
      setPos(
        clampPosition(
          dragRef.current.originX + dx,
          dragRef.current.originY + dy,
          w,
          h
        )
      );
    },
    [parked]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const wasParkedTap = parked && !dragRef.current.moved;
      dragRef.current = null;
      setDragging(false);
      setPos((p) => {
        if (p) saveClimatePosition(p);
        return p;
      });
      if (wasParkedTap) handleUnpark();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [parked, handleUnpark]
  );

  const onPointerDownChip = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const current = pos ?? defaultClimatePosition();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: current.x,
        originY: current.y,
        moved: false,
      };
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const current = alerts[index];
  const styles = current
    ? SEVERITY_STYLES[current.severity]
    : SEVERITY_STYLES.info;

  const positionStyle: React.CSSProperties =
    pos != null
      ? { left: pos.x, top: pos.y, right: "auto" }
      : { left: 8, top: 8, right: 8 };

  if (!mounted) return null;

  if (parked) {
    const chipPos = pos ?? { x: 16, y: 80 };
    return (
      <button
        type="button"
        onPointerDown={onPointerDownChip}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ left: chipPos.x, top: chipPos.y }}
        className={`pointer-events-auto fixed z-[1001] w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-lg border touch-manipulation ${
          hasFreshChange
            ? "bg-mushroom-600/95 border-mushroom-400 animate-pulse"
            : "bg-forest-900/95 border-forest-600/60"
        } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        title="Monitor climatico — tap per aprire, trascina per spostare"
        aria-label="Apri monitor climatico"
      >
        🌡️
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-sky-600 text-[9px] text-white font-bold flex items-center justify-center">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      ref={boxRef}
      style={positionStyle}
      className={`pointer-events-auto fixed z-[1001] w-[min(22rem,calc(100vw-1.5rem))] ${
        dragging ? "cursor-grabbing select-none" : ""
      }`}
      aria-live="polite"
      aria-label="Avvisi cambiamento climatico"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={`rounded-xl border backdrop-blur-md bg-forest-950/88 shadow-xl transition-shadow duration-300 ${styles.border} ${
          hasFreshChange ? "ring-2 ring-mushroom-400/40 animate-pulse" : ""
        }`}
      >
        <div
          data-climate-drag
          className={`flex items-center gap-1 px-2 py-1.5 border-b border-forest-700/40 bg-forest-900/50 rounded-t-xl ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <span className="text-forest-600 text-xs px-1" aria-hidden>
            ⠿
          </span>
          <p className="text-[9px] uppercase tracking-wider text-forest-500 flex-1">
            Trascina · monitor climatico
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePark();
            }}
            className="w-7 h-7 rounded-lg bg-forest-800 text-forest-400 text-sm touch-manipulation hover:bg-forest-700"
            title="Parcheggia"
          >
            −
          </button>
        </div>

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
                  {current.zoneName && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300/90 mb-0.5">
                      📍 {current.zoneName}
                    </p>
                  )}
                  <p className="text-xs md:text-sm font-semibold text-forest-100 leading-snug">
                    {current.headline}
                  </p>
                  <p className="text-[11px] text-forest-300 leading-relaxed mt-1 line-clamp-2">
                    {current.detail}
                  </p>
                  {alerts.length > 1 && (
                    <p className="text-[9px] text-forest-500 mt-1.5">
                      {index + 1}/{alerts.length} avvisi · tap per{" "}
                      {expanded ? "chiudere" : "dettagli"}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-forest-400">
                  Nessun cambiamento rilevante. Monitor attivo su umidità suolo
                  e piogge.
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
                    i === index
                      ? `${s.border} bg-forest-900/60`
                      : "border-forest-700/40 text-forest-400"
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
