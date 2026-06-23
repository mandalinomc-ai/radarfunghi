"use client";

import Link from "next/link";
import TelegramCommunityBanner from "@/components/TelegramCommunityBanner";
import { TELEGRAM_COMMUNITY } from "@/lib/telegramCommunity";

export default function TelegramSetupPage() {
  return (
    <div className="max-w-lg mx-auto p-6 pb-24 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-sage-100">Community Telegram</h1>
        <p className="text-sm text-sage-400 mt-1">
          Bot @{TELEGRAM_COMMUNITY.bot.username} — attivo e collegato al radar
        </p>
      </div>

      <TelegramCommunityBanner variant="banner" />

      <article className="enterprise-panel rounded-2xl p-5 space-y-3 text-sm text-sage-400">
        <p className="text-sage-200 font-semibold">Comandi bot</p>
        <p>/start · /radar · /diario · /aiuto · /canale</p>
        <p>Invia GPS per Sprout Score · invia foto per classificazione AI</p>
        <p className="text-xs text-sage-600">
          Nel gruppo Pro invia /setalerts per registrare le allerte automatiche.
        </p>
      </article>

      <Link href="/" className="text-sm text-sage-500 hover:text-neon">
        ← Torna alla mappa
      </Link>
    </div>
  );
}
