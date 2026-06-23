"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMushroomRadarContext } from "@/context/MushroomRadarContext";
import TelegramCommunityBanner from "@/components/TelegramCommunityBanner";

const NAV = [
  { href: "/", label: "Mappa Live", icon: "🗺️" },
  { href: "/radar", label: "Radar & Filtri", icon: "📡" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/diario", label: "Diario Pro", icon: "📓" },
  { href: "/classifier", label: "Classificatore", icon: "🔬" },
  { href: "/telegram", label: "Bot TG", icon: "🤖" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { tier, isPremium } = useMushroomRadarContext();

  return (
    <div className="enterprise-shell min-h-dvh flex flex-col">
      <header className="enterprise-nav shrink-0 sticky top-0 z-[2000] border-b border-enterprise-border/60 bg-enterprise-bg/90 backdrop-blur-xl safe-top">
        <div className="flex items-center gap-2 px-3 md:px-5 h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
            <span className="text-neon text-lg font-bold tracking-tight">
              MushroomRadar
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-sage-400/80">
              Bloomberg dei Funghi
            </span>
          </Link>

          <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 px-2.5 md:px-3 py-2 rounded-lg text-[11px] md:text-xs font-semibold transition-colors touch-manipulation ${
                    active
                      ? "bg-neon/15 text-neon border border-neon/35"
                      : "text-sage-300/70 hover:text-sage-200 hover:bg-enterprise-panel/60"
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <TelegramCommunityBanner variant="compact" />

          <span
            className={`shrink-0 text-[9px] uppercase tracking-wider px-2 py-1 rounded-md border ${
              isPremium
                ? "border-neon/40 text-neon bg-neon/10"
                : "border-sage-600/40 text-sage-400"
            }`}
          >
            {tier}
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 relative">{children}</main>
    </div>
  );
}
