"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TELEGRAM_COMMUNITY,
  TELEGRAM_COMMUNITY_HEADLINE,
} from "@/lib/telegramCommunity";
import {
  defaultTelegramDockPosition,
  loadTelegramDockOpen,
  loadTelegramDockPosition,
  saveTelegramDockOpen,
  saveTelegramDockPosition,
  type DockPosition,
} from "@/lib/telegramDockStore";
import { useDraggableDock } from "@/hooks/useDraggableDock";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

const FAB_SIZE = 56;
const PANEL_W = 300;
const PANEL_H = 280;

export default function TelegramCommunityDock() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DockPosition | null>(null);

  useEffect(() => {
    setMounted(true);
    setOpen(loadTelegramDockOpen());
    setPos(loadTelegramDockPosition() ?? defaultTelegramDockPosition());
  }, []);

  const persistPos = useCallback((p: DockPosition) => {
    setPos(p);
    saveTelegramDockPosition(p);
  }, []);

  const size = open
    ? { w: PANEL_W, h: PANEL_H }
    : { w: FAB_SIZE, h: FAB_SIZE };

  const { dragging, onDragStart, onDragMove, onDragEnd } = useDraggableDock(
    pos,
    persistPos,
    size
  );

  const toggleOpen = useCallback(() => {
    setOpen((v) => {
      const next = !v;
      saveTelegramDockOpen(next);
      return next;
    });
  }, []);

  const minimize = useCallback(() => {
    setOpen(false);
    saveTelegramDockOpen(false);
  }, []);

  if (!mounted || !pos) return null;

  const links = [
    TELEGRAM_COMMUNITY.bot,
    TELEGRAM_COMMUNITY.group,
    TELEGRAM_COMMUNITY.channel,
  ];

  return (
    <div
      className="fixed z-[2490] pointer-events-none"
      style={{ left: pos.x, top: pos.y }}
    >
      {open ? (
        <div
          className={`pointer-events-auto w-[300px] enterprise-panel rounded-2xl border border-[#229ED9]/35 shadow-2xl overflow-hidden ${
            dragging ? "select-none" : ""
          }`}
        >
          <div
            className={`flex items-center justify-between px-3 py-2.5 border-b border-enterprise-border/50 bg-[#229ED9]/10 touch-none ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onPointerDown={(e) => onDragStart(e, true)}
            onPointerMove={onDragMove}
            onPointerUp={(e) => onDragEnd(e)}
            onPointerCancel={(e) => onDragEnd(e)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <TelegramIcon className="w-5 h-5 text-[#229ED9] shrink-0" />
              <p className="text-xs font-semibold text-sage-100 truncate">
                Community Telegram
              </p>
            </div>
            <button
              type="button"
              onClick={minimize}
              className="shrink-0 w-8 h-8 rounded-lg text-sage-400 hover:text-sage-200 hover:bg-enterprise-bg/60 touch-manipulation"
              aria-label="Minimizza"
            >
              ─
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm font-bold text-sage-100 leading-snug">
              {TELEGRAM_COMMUNITY_HEADLINE}
            </p>
            <p className="text-[11px] text-sage-400">
              Gruppo e canale con aggiornamenti costanti su meteo, score e
              raccolta.
            </p>
            <div className="flex flex-col gap-2">
              {links.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#229ED9]/12 text-[#5ec8f8] border border-[#229ED9]/30 hover:bg-[#229ED9]/22 transition-colors touch-manipulation"
                >
                  <TelegramIcon className="w-4 h-4 shrink-0" />
                  <span>
                    {item.label}
                    <span className="block text-[10px] font-normal text-sage-500 mt-0.5">
                      {item.description}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Apri community Telegram"
          title={TELEGRAM_COMMUNITY_HEADLINE}
          className={`pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-full bg-[#229ED9] hover:bg-[#1a8bc4] text-white shadow-[0_4px_24px_rgba(34,158,217,0.45)] transition-transform touch-manipulation ${
            dragging ? "cursor-grabbing scale-105" : "cursor-grab active:scale-95"
          }`}
          onPointerDown={(e) => onDragStart(e, false)}
          onPointerMove={onDragMove}
          onPointerUp={(e) => onDragEnd(e, toggleOpen)}
          onPointerCancel={(e) => onDragEnd(e)}
        >
          <span
            className="absolute inset-0 rounded-full bg-[#229ED9] animate-ping opacity-25"
            aria-hidden
          />
          <TelegramIcon className="relative w-7 h-7" />
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[9px] font-bold text-[#229ED9] flex items-center justify-center border-2 border-[#229ED9] shadow-md">
            TG
          </span>
        </button>
      )}
    </div>
  );
}
