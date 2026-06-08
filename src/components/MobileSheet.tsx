"use client";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function MobileSheet({
  open,
  onClose,
  title,
  children,
}: MobileSheetProps) {
  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[1003] pointer-events-auto">
      <button
        className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Chiudi"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[75dvh] bg-forest-900 border-t border-forest-600/40 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col safe-bottom">
        <div className="flex items-center justify-between px-4 py-3 border-b border-forest-700/40 shrink-0">
          <h3 className="text-sm font-semibold text-forest-200">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-forest-800 text-forest-300 flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4">{children}</div>
      </div>
    </div>
  );
}
