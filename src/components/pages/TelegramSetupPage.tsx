"use client";

import Link from "next/link";
import Image from "next/image";
import TelegramCommunityBanner from "@/components/TelegramCommunityBanner";
import { TELEGRAM_COMMUNITY } from "@/lib/telegramCommunity";

export default function TelegramSetupPage() {
  return (
    <div className="max-w-lg mx-auto p-6 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="MushroomRadar"
          width={72}
          height={72}
          className="rounded-2xl shadow-[0_0_20px_rgba(0,255,102,0.3)]"
        />
        <div>
          <h1 className="font-display text-2xl text-sage-100">Community Telegram</h1>
          <p className="text-sm text-sage-400 mt-1">
            Bot @{TELEGRAM_COMMUNITY.bot.username} — menu interattivo zone
          </p>
        </div>
      </div>

      <TelegramCommunityBanner variant="banner" />

      <article className="enterprise-panel rounded-2xl p-5 space-y-3 text-sm text-sage-400">
        <p className="text-sage-200 font-semibold">Comandi bot</p>
        <ul className="space-y-1 text-xs">
          <li>/menu — pannello con pulsanti zona e report</li>
          <li>/zona — scegli Matese, Taburno, Partenio…</li>
          <li>/live — score oggi e ritrovamenti ≥70%</li>
          <li>/previsioni 0 7 — forecast da oggi a +7 giorni</li>
          <li>/clima — alert meteo sulla zona</li>
          <li>/iscriviti — aggiornamenti automatici</li>
        </ul>
        <p className="text-xs text-sage-500 pt-2">
          Invia GPS o foto fungo · nel gruppo /setalerts per allerte di gruppo
        </p>
      </article>

      <Link href="/" className="text-sm text-sage-500 hover:text-neon">
        ← Torna alla mappa
      </Link>
    </div>
  );
}
