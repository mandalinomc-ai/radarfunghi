"use client";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** panel = figlio gestisce scroll interno (chat); scroll = scroll unico esterno */
  layout?: "scroll" | "panel";
}

export default function MobileSheet({
  open,
  onClose,
  title,
  children,
  layout = "scroll",
}: MobileSheetProps) {
  if (!open) return null;

  const contentClass =
    layout === "panel"
      ? "flex-1 min-h-0 flex flex-col p-4 overflow-hidden"
      : "overflow-y-auto overscroll-contain p-4";

  return (
    <div className="fixed inset-0 z-[1004] pointer-events-auto">
      <button
        className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Chiudi"
      />

      {/* Mobile: bottom sheet */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 max-h-[85dvh] bg-forest-900 border-t border-forest-600/40 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col safe-bottom">
        <SheetHeader title={title} onClose={onClose} />
        <div className={contentClass}>{children}</div>
      </div>

      {/* Desktop: pannello laterale (non copre sidebar né action rail) */}
      <div className="hidden md:flex absolute right-14 top-[72px] bottom-0 w-[min(400px,calc(100vw-376px))] max-w-[440px] flex-col bg-forest-900/98 border-l border-forest-600/40 shadow-2xl overflow-hidden">
        <SheetHeader title={title} onClose={onClose} />
        <div className={contentClass}>{children}</div>
      </div>
    </div>
  );
}

function SheetHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-forest-700/40 shrink-0">
      <h3 className="text-sm font-semibold text-forest-200">{title}</h3>
      <button
        onClick={onClose}
        className="w-10 h-10 rounded-xl bg-forest-800 text-forest-300 flex items-center justify-center text-lg touch-manipulation"
        aria-label="Chiudi"
      >
        ✕
      </button>
    </div>
  );
}
