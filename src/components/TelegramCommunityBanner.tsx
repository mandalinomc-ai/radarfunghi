"use client";

import { TELEGRAM_COMMUNITY, TELEGRAM_COMMUNITY_HEADLINE } from "@/lib/telegramCommunity";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

type Variant = "banner" | "compact" | "fab";

export default function TelegramCommunityBanner({
  variant = "banner",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const links = [
    TELEGRAM_COMMUNITY.bot,
    TELEGRAM_COMMUNITY.group,
    TELEGRAM_COMMUNITY.channel,
  ];

  if (variant === "compact") {
    return (
      <a
        href={TELEGRAM_COMMUNITY.bot.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/40 text-[#5ec8f8] text-[10px] font-semibold hover:bg-[#229ED9]/25 transition-colors shrink-0 ${className}`}
        title={TELEGRAM_COMMUNITY_HEADLINE}
      >
        <TelegramIcon className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Community</span>
      </a>
    );
  }

  if (variant === "fab") {
    return (
      <a
        href={TELEGRAM_COMMUNITY.bot.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-20 right-4 z-[1999] flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/30 hover:bg-[#1a8bc4] transition-colors touch-manipulation ${className}`}
      >
        <TelegramIcon className="w-5 h-5" />
        <span className="text-xs font-bold max-w-[140px] leading-tight">
          {TELEGRAM_COMMUNITY_HEADLINE}
        </span>
      </a>
    );
  }

  return (
    <article
      className={`enterprise-glass rounded-2xl p-4 border border-[#229ED9]/30 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[#229ED9]/20 flex items-center justify-center text-[#229ED9]">
          <TelegramIcon className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-sage-100 leading-snug">
            {TELEGRAM_COMMUNITY_HEADLINE}
          </p>
          <p className="text-[11px] text-sage-400 mt-0.5">
            Gruppo e canale con aggiornamenti costanti su meteo, score e
            raccolta.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {links.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#229ED9]/15 text-[#5ec8f8] border border-[#229ED9]/35 hover:bg-[#229ED9]/25 transition-colors"
                title={item.description}
              >
                <TelegramIcon className="w-3.5 h-3.5" />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
