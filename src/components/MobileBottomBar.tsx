"use client";

interface MobileDockToolbarProps {
  onOpenChat: () => void;
  onOpenGuide: () => void;
  onOpenFilters: () => void;
  onOpenReport: () => void;
  onOpenSpyZone: () => void;
  onOpenCompass: () => void;
  onOpenSources: () => void;
  onOpenFM: () => void;
  onOpenLegend: () => void;
  reportCount?: number;
  spyZoneCount?: number;
  pendingCount?: number;
}

/** Barra azioni integrata nel dock inferiore (solo mobile) */
export function MobileDockToolbar({
  onOpenChat,
  onOpenGuide,
  onOpenFilters,
  onOpenReport,
  onOpenSpyZone,
  onOpenCompass,
  onOpenSources,
  onOpenFM,
  onOpenLegend,
  reportCount = 0,
  spyZoneCount = 0,
  pendingCount = 0,
}: MobileDockToolbarProps) {
  return (
    <div className="md:hidden flex gap-0.5 px-1 pt-1.5 pb-0.5 border-b border-forest-700/40 overflow-x-auto scrollbar-none">
      <DockBtn onClick={onOpenChat} icon="💬" label="Chat" accent />
      <DockBtn onClick={onOpenGuide} icon="🍄" label="Guida" />
      <DockBtn onClick={onOpenFilters} icon="⚙️" label="Filtri" />
      <DockBtn
        onClick={onOpenReport}
        icon="📍"
        label="Segnala"
        badge={reportCount > 0 ? reportCount : undefined}
        pendingBadge={pendingCount}
      />
      <DockBtn
        onClick={onOpenSpyZone}
        icon="👁"
        label="Spia"
        badge={spyZoneCount > 0 ? spyZoneCount : undefined}
      />
      <DockBtn onClick={onOpenCompass} icon="🧭" label="Bussola" />
      <DockBtn onClick={onOpenSources} icon="📊" label="Fonti" />
      <DockBtn onClick={onOpenFM} icon="📡" label="FM" />
      <DockBtn onClick={onOpenLegend} icon="🗺️" label="Legenda" />
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
}: {
  onClick: () => void;
  icon: string;
  label: string;
  highlight?: boolean;
  accent?: boolean;
  badge?: number;
  pendingBadge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center min-w-[52px] flex-1 max-w-[72px] py-1.5 rounded-lg touch-manipulation active:scale-95 ${
        highlight
          ? "bg-green-700/40"
          : accent
            ? "bg-mushroom-700/35"
            : "hover:bg-forest-800/50"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span
        className={`text-[8px] font-medium mt-0.5 ${
          highlight || accent ? "text-white" : "text-forest-400"
        }`}
      >
        {label}
      </span>
      {pendingBadge !== undefined && pendingBadge > 0 && (
        <span className="absolute top-0 right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-orange-500 text-[7px] text-white font-bold flex items-center justify-center">
          {pendingBadge > 9 ? "9+" : pendingBadge}
        </span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0.5 right-1 w-3.5 h-3.5 rounded-full bg-mushroom-500 text-[7px] text-white flex items-center justify-center">
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
