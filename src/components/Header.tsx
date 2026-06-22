"use client";

import { formatSourceAge } from "@/lib/dataSources";

interface HeaderProps {
  avgScore: number;
  hotspotCount: number;
  rangeKm: number;
  visibleZones: number;
  originName: string;
  dataLoading?: boolean;
  lastUpdate?: string | null;
  liveData?: boolean;
  weatherError?: string | null;
  originReady?: boolean;
  onChangeOrigin?: () => void;
}

export default function Header({
  avgScore,
  hotspotCount,
  rangeKm,
  visibleZones,
  originName,
  dataLoading,
  lastUpdate,
  liveData,
  weatherError,
  originReady = true,
  onChangeOrigin,
}: HeaderProps) {
  const updateAge = lastUpdate
    ? Math.round((Date.now() - new Date(lastUpdate).getTime()) / 60000)
    : null;

  const statusLine = dataLoading
    ? "Aggiornamento meteo..."
    : weatherError
      ? "⚠ Meteo in cache"
      : liveData && lastUpdate
        ? `Live · ${formatSourceAge(updateAge)}`
        : `Partenza: ${originName.split(",")[0]}`;

  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none safe-top">
      {/* Mobile */}
      <div className="md:hidden pointer-events-auto mx-2 mt-1.5">
        <div className="flex items-center gap-2 bg-forest-900/92 backdrop-blur-md border border-forest-600/40 rounded-xl px-2.5 py-2 shadow-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mushroom-500 to-forest-500 flex items-center justify-center text-base shrink-0">
            🍄
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-forest-300 leading-tight truncate">
              Mushroom<span className="text-mushroom-400">Radar</span>
            </h1>
            <p className="text-[9px] text-forest-500 truncate">{statusLine}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <MiniStat label="Score" value={`${avgScore}%`} highlight />
            <MiniStat label="Zone" value={String(hotspotCount)} />
            <MiniStat label="Km" value={String(rangeKm)} />
          </div>
        </div>
      </div>

      {/* Desktop — barra compatta solo sulla colonna mappa (320px–56px rail) */}
      <div className="hidden md:flex absolute top-0 left-[320px] right-14 h-[72px] items-center gap-3 px-4 pointer-events-none">
        <div className="pointer-events-auto min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-semibold text-forest-100 truncate">
              {originReady
                ? `Da ${originName.split(",")[0]}`
                : "Imposta la partenza"}
            </p>
            {originReady && onChangeOrigin && (
              <button
                type="button"
                onClick={onChangeOrigin}
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-forest-800 text-mushroom-400 hover:bg-forest-700 touch-manipulation"
              >
                Cambia
              </button>
            )}
          </div>
          <p className="text-[10px] text-forest-500 truncate">{statusLine}</p>
        </div>
        <div className="pointer-events-auto flex gap-2 shrink-0 flex-wrap justify-end max-w-[70%]">
          <StatCard label="Score" value={`${avgScore}%`} highlight compact />
          <StatCard label="Zone" value={String(hotspotCount)} compact />
          <StatCard label="Raggio" value={`${rangeKm} km`} compact hideMd />
          <StatCard label="Visibili" value={String(visibleZones)} compact hideMd />
        </div>
      </div>
    </header>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center px-1.5 py-0.5 rounded-lg bg-forest-950/60 min-w-[42px]">
      <p className="text-[8px] uppercase text-forest-500 leading-none">{label}</p>
      <p
        className={`text-xs font-bold leading-tight mt-0.5 ${
          highlight ? "text-mushroom-400" : "text-forest-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  compact,
  hideMd,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  compact?: boolean;
  hideMd?: boolean;
}) {
  return (
    <div
      className={`bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl text-center ${
        compact ? "px-3 py-1.5 min-w-[64px]" : "px-4 py-2.5 min-w-[80px]"
      } ${hideMd ? "hidden xl:block" : ""}`}
    >
      <p className="text-[9px] uppercase tracking-wider text-forest-400 truncate">
        {label}
      </p>
      <p
        className={`font-bold truncate ${
          compact
            ? highlight
              ? "text-lg text-mushroom-400"
              : "text-lg text-forest-300"
            : highlight
              ? "text-2xl text-mushroom-400"
              : "text-2xl text-forest-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
