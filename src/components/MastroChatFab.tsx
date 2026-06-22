"use client";

interface MastroChatFabProps {
  onClick: () => void;
  hidden?: boolean;
  /** Prima visita — mostra badge "Consigliato" */
  showRecommended?: boolean;
}

export default function MastroChatFab({
  onClick,
  hidden = false,
  showRecommended = true,
}: MastroChatFabProps) {
  if (hidden) return null;

  return (
    <div
      className="fixed z-[1004] pointer-events-none group
        bottom-[calc(var(--mobile-dock,104px)+12px+var(--safe-bottom))] right-4
        md:bottom-6 md:right-[calc(var(--desktop-rail,56px)+1rem)]"
    >
      {showRecommended && (
        <div
          className="pointer-events-none absolute -top-9 right-0 md:-top-10 md:right-0
            animate-[fab-hint_3s_ease-in-out_infinite]"
          aria-hidden
        >
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
              bg-forest-900/95 border border-mushroom-500/40 text-[10px] font-semibold
              text-mushroom-200 shadow-lg whitespace-nowrap"
          >
            <span className="text-green-400">●</span> Chiedi dove andare
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label="Apri chat Mastro Fungaiolo — consigliato"
        title="Mastro Fungaiolo — chiedi dove trovare funghi"
        className="mastro-chat-fab pointer-events-auto group relative flex items-center justify-center
          w-14 h-14 md:w-16 md:h-16 rounded-full
          bg-[#25D366] hover:bg-[#20bd5a] active:scale-95
          shadow-[0_4px_24px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_28px_rgba(37,211,102,0.55)]
          transition-all touch-manipulation"
      >
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30"
          aria-hidden
        />
        <span
          className="absolute inset-[-4px] rounded-full border-2 border-[#25D366]/40 animate-pulse"
          aria-hidden
        />
        <ChatBubbleIcon className="relative w-7 h-7 md:w-8 md:h-8 text-white" />
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full
            bg-mushroom-500 text-[9px] font-bold text-white flex items-center justify-center
            border-2 border-forest-950 shadow-md"
        >
          AI
        </span>
      </button>

      <p className="hidden md:block pointer-events-none text-center mt-2 text-[10px] font-medium text-forest-400 group-hover:text-mushroom-300">
        Mastro Fungaiolo
      </p>
    </div>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm.01 17.21c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24s8.24 3.7 8.24 8.24-3.69 8.24-8.33 8.24z" />
      <path d="M8.53 10.91c.55 0 .99-.44.99-.99s-.44-.99-.99-.99-.99.44-.99.99.44.99.99.99zm3.51 0c.55 0 .99-.44.99-.99s-.44-.99-.99-.99-.99.44-.99.99.44.99.99.99zm3.51 0c.55 0 .99-.44.99-.99s-.44-.99-.99-.99-.99.44-.99.99.44.99.99.99z" />
    </svg>
  );
}
