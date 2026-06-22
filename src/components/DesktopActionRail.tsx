"use client";

interface DesktopActionRailProps {
  onOpenChat: () => void;
  onOpenReport: () => void;
  onOpenSpyZone: () => void;
  onOpenCompass: () => void;
  onOpenGuide: () => void;
  onOpenLegend?: () => void;
  reportCount?: number;
  spyZoneCount?: number;
  pendingCount?: number;
  hidden?: boolean;
}

export default function DesktopActionRail({
  onOpenChat,
  onOpenReport,
  onOpenSpyZone,
  onOpenCompass,
  onOpenGuide,
  onOpenLegend,
  reportCount = 0,
  spyZoneCount = 0,
  pendingCount = 0,
  hidden = false,
}: DesktopActionRailProps) {
  if (hidden) return null;

  const totalReports = reportCount + pendingCount;

  return (
    <aside
      className="hidden md:flex fixed right-0 top-[72px] bottom-0 w-14 z-[1003] flex-col items-center gap-1.5 py-3 px-1 bg-forest-950/80 backdrop-blur-md border-l border-forest-700/40 pointer-events-auto safe-bottom"
      aria-label="Azioni rapide"
    >
      <RailBtn
        onClick={onOpenChat}
        icon="💬"
        label="Chat"
        highlight
        title="Mastro Fungaiolo — chat"
      />
      <RailBtn
        onClick={onOpenGuide}
        icon="🍄"
        label="Guida"
        title="Non so niente — guida principianti"
      />
      <RailBtn
        onClick={onOpenCompass}
        icon="🧭"
        label="Bussola"
        title="Bussola e guida territorio"
      />
      <RailBtn
        onClick={onOpenReport}
        icon="📍"
        label="Segnala"
        badge={totalReports > 0 ? totalReports : pendingCount > 0 ? pendingCount : undefined}
        pendingBadge={pendingCount}
        title="Segnala funghi con foto"
      />
      <RailBtn
        onClick={onOpenSpyZone}
        icon="👁"
        label="Spia"
        badge={spyZoneCount > 0 ? spyZoneCount : undefined}
        title="Zona spia da link Maps"
      />
      {onOpenLegend && (
        <RailBtn
          onClick={onOpenLegend}
          icon="🗺️"
          label="Legenda"
          title="Legenda mappa"
        />
      )}
    </aside>
  );
}

function RailBtn({
  onClick,
  icon,
  label,
  highlight,
  badge,
  pendingBadge,
  title,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  highlight?: boolean;
  badge?: number;
  pendingBadge?: number;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors ${
        highlight
          ? "bg-mushroom-700/50 hover:bg-mushroom-600/60 text-mushroom-100"
          : "bg-forest-800/60 hover:bg-forest-700/70 text-forest-200"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[7px] font-medium leading-none opacity-90">{label}</span>
      {pendingBadge !== undefined && pendingBadge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-orange-500 text-[7px] text-white font-bold flex items-center justify-center">
          {pendingBadge > 9 ? "9+" : pendingBadge}
        </span>
      )}
      {badge !== undefined && badge > 0 && !pendingBadge && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-mushroom-500 text-[7px] text-white font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
