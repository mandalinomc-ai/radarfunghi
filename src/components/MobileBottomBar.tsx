"use client";

import { useState } from "react";

interface MobileDockToolbarProps {
  onOpenChat: () => void;
  onOpenGuide: () => void;
  onOpenFilters: () => void;
  onOpenReport: () => void;
  onOpenSpyZone: () => void;
  onOpenCompass: () => void;
  onOpenWeatherSpy: () => void;
  onOpenSources: () => void;
  onOpenFM: () => void;
  onOpenLegend: () => void;
  reportCount?: number;
  spyZoneCount?: number;
  pendingCount?: number;
}

/** Barra azioni mobile: 5 azioni principali + pannello Altro */
export function MobileDockToolbar({
  onOpenChat,
  onOpenGuide,
  onOpenFilters,
  onOpenReport,
  onOpenSpyZone,
  onOpenCompass,
  onOpenWeatherSpy,
  onOpenSources,
  onOpenFM,
  onOpenLegend,
  reportCount = 0,
  spyZoneCount = 0,
  pendingCount = 0,
}: MobileDockToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="md:hidden border-b border-forest-700/40">
      <div className="flex gap-1 px-1 pt-1.5 pb-1">
        <DockBtn onClick={onOpenChat} icon="💬" label="Chat" accent />
        <DockBtn onClick={onOpenFilters} icon="⚙️" label="Filtri" />
        <DockBtn onClick={onOpenGuide} icon="🍄" label="Guida" />
        <DockBtn
          onClick={onOpenReport}
          icon="📍"
          label="Segnala"
          badge={reportCount > 0 ? reportCount : undefined}
          pendingBadge={pendingCount}
        />
        <DockBtn
          onClick={() => setMoreOpen((v) => !v)}
          icon={moreOpen ? "▲" : "⋯"}
          label="Altro"
          highlight={moreOpen}
        />
      </div>
      {moreOpen && (
        <div className="grid grid-cols-4 gap-1 px-1 pb-1.5 border-t border-forest-800/60 pt-1.5">
          <DockBtn
            onClick={onOpenSpyZone}
            icon="👁"
            label="Spia"
            badge={spyZoneCount > 0 ? spyZoneCount : undefined}
            compact
          />
          <DockBtn onClick={onOpenCompass} icon="🧭" label="Bussola" compact />
          <DockBtn onClick={onOpenWeatherSpy} icon="🌧️" label="Meteo" compact />
          <DockBtn onClick={onOpenSources} icon="📊" label="Fonti" compact />
          <DockBtn onClick={onOpenFM} icon="📡" label="FM" compact />
          <DockBtn onClick={onOpenLegend} icon="🗺️" label="Legenda" compact />
        </div>
      )}
    </div>
  );
}

function DockBtn({
  onClick,
  icon,
  label,
  highlight,
  accent,
  badge,
  pendingBadge,
  compact,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  highlight?: boolean;
  accent?: boolean;
  badge?: number;
  pendingBadge?: number;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-xl touch-manipulation active:scale-95 ${
        compact ? "py-2 min-h-[52px]" : "flex-1 py-2 min-h-[56px]"
      } ${
        highlight
          ? "bg-forest-700/50"
          : accent
            ? "bg-mushroom-700/35"
            : "hover:bg-forest-800/50"
      }`}
    >
      <span className={`leading-none ${compact ? "text-sm" : "text-lg"}`}>
        {icon}
      </span>
      <span
        className={`font-medium mt-0.5 ${
          compact ? "text-[8px]" : "text-[9px]"
        } ${highlight || accent ? "text-white" : "text-forest-400"}`}
      >
        {label}
      </span>
      {pendingBadge !== undefined && pendingBadge > 0 && (
        <span className="absolute top-0.5 right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-orange-500 text-[7px] text-white font-bold flex items-center justify-center">
          {pendingBadge > 9 ? "9+" : pendingBadge}
        </span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1.5 w-3.5 h-3.5 rounded-full bg-mushroom-500 text-[7px] text-white flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

/** @deprecated usa MobileDockToolbar nel SearchPanel */
export default function MobileBottomBar(props: MobileDockToolbarProps) {
  return null;
}
