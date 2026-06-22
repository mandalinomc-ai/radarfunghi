"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampGuideBannerPosition,
  defaultGuideBannerPosition,
  loadGuideBannerPosition,
  saveGuideBannerPosition,
  type GuideBannerPosition,
} from "@/lib/guideBannerStore";

interface BeginnerGuideBannerProps {
  parked: boolean;
  compact?: boolean;
  onOpen: () => void;
  onPark: () => void;
  onOpenChat: () => void;
}

export default function BeginnerGuideBanner({
  parked,
  compact,
  onOpen,
  onPark,
  onOpenChat,
}: BeginnerGuideBannerProps) {
  const [pos, setPos] = useState<GuideBannerPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    setPos(loadGuideBannerPosition() ?? defaultGuideBannerPosition());
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      if (!target.closest("[data-guide-drag]")) return;
      e.preventDefault();
      const current = pos ?? defaultGuideBannerPosition();
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

  const onPointerDownChip = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const current = pos ?? defaultGuideBannerPosition();
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

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragRef.current.moved = true;
    }
    const el = parked ? chipRef.current : boxRef.current;
    const w = el?.offsetWidth ?? (parked ? 48 : 300);
    const h = el?.offsetHeight ?? (parked ? 48 : 120);
    setPos(
      clampGuideBannerPosition(
        dragRef.current.originX + dx,
        dragRef.current.originY + dy,
        w,
        h
      )
    );
  }, [parked]);

  const finishPointer = useCallback(
    (e: React.PointerEvent, onTap?: () => void) => {
      if (!dragRef.current) return;
      const wasTap = !dragRef.current.moved;
      dragRef.current = null;
      setDragging(false);
      setPos((p) => {
        if (p) saveGuideBannerPosition(p);
        return p;
      });
      if (wasTap) onTap?.();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    []
  );

  if (!mounted || pos == null) return null;

  if (parked || compact) {
    return (
      <button
        ref={chipRef}
        type="button"
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={onPointerDownChip}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finishPointer(e, onOpen)}
        onPointerCancel={(e) => finishPointer(e)}
        className={`md:hidden fixed z-[1001] pointer-events-auto w-12 h-12 rounded-full bg-mushroom-600/95 text-white text-xl shadow-lg border border-mushroom-400/40 touch-manipulation flex items-center justify-center ${
          dragging ? "cursor-grabbing scale-105" : "cursor-grab"
        }`}
        title="Guida principianti"
        aria-label="Apri guida principianti"
      >
        🍄
      </button>
    );
  }

  return (
    <div
      ref={boxRef}
      style={{ left: pos.x, top: pos.y }}
      className={`md:hidden fixed z-[1001] pointer-events-auto w-[min(21rem,calc(100vw-1.5rem))] ${
        dragging ? "select-none" : ""
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finishPointer(e)}
      onPointerCancel={(e) => finishPointer(e)}
    >
      <div className="guide-banner-shell rounded-2xl overflow-hidden">
        <div
          data-guide-drag
          className={`flex items-center gap-2 px-3 py-2 border-b border-forest-700/30 bg-forest-900/60 ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <span className="text-forest-500/80 text-xs shrink-0" aria-hidden>
            ⠿
          </span>
          <p className="text-[9px] uppercase tracking-[0.2em] text-mushroom-400/90 font-semibold flex-1 truncate">
            Guida principianti
          </p>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onPark();
            }}
            className="shrink-0 w-7 h-7 rounded-lg bg-forest-950/60 border border-forest-700/40 text-forest-400 text-sm touch-manipulation"
            title="Minimizza"
            aria-label="Minimizza"
          >
            −
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onPark();
            }}
            className="shrink-0 w-7 h-7 rounded-lg bg-forest-950/60 border border-forest-700/40 text-forest-400 text-xs touch-manipulation"
            title="Chiudi"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={dragging}
          className="w-full px-4 py-3.5 text-left touch-manipulation border-b border-forest-800/40 hover:bg-forest-900/40 transition-colors"
        >
          <p className="font-display text-base text-forest-100 leading-snug">
            Non so niente — che fungo cerco?
          </p>
          <p className="text-[10px] text-forest-500 mt-1 uppercase tracking-wider">
            Dossier radar personalizzato
          </p>
        </button>

        <div className="p-3 guide-chat-cta rounded-none border-0 border-t border-emerald-500/20">
          <p className="text-[10px] text-forest-400 mb-2 leading-snug">
            Vuoi sapere di più? Chatta col Mastro AI
          </p>
          <button
            type="button"
            onClick={onOpenChat}
            disabled={dragging}
            className="w-full py-2.5 rounded-xl guide-chat-btn text-white font-bold text-xs touch-manipulation flex items-center justify-center gap-2"
          >
            <span aria-hidden>💬</span>
            Apri chat AI
          </button>
        </div>
      </div>
    </div>
  );
}
