"use client";

interface MobileBottomBarProps {
  onOpenFilters: () => void;
  onOpenFM: () => void;
  onOpenLegend: () => void;
}

export default function MobileBottomBar({
  onOpenFilters,
  onOpenFM,
  onOpenLegend,
}: MobileBottomBarProps) {
  return (
    <div className="md:hidden absolute bottom-[148px] left-3 right-3 z-[1001] pointer-events-auto">
      <div className="flex gap-2 justify-center">
        <BarButton onClick={onOpenFilters} icon="🍄" label="Specie" />
        <BarButton onClick={onOpenFM} icon="📡" label="FM Live" />
        <BarButton onClick={onOpenLegend} icon="🗺️" label="Legenda" />
      </div>
    </div>
  );
}

function BarButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 max-w-[110px] flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl bg-forest-900/95 backdrop-blur-md border border-forest-600/40 shadow-lg active:scale-95 transition-transform touch-manipulation"
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[10px] font-medium text-forest-300">{label}</span>
    </button>
  );
}
