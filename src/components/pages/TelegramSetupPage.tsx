"use client";

import Link from "next/link";
import { useState } from "react";

export default function TelegramSetupPage() {
  const [status, setStatus] = useState<string | null>(null);

  const openBotFather = () => {
    window.open("https://t.me/BotFather?start=newbot", "_blank");
    setStatus("BotFather aperto — crea il bot, copia il token e incollalo qui sotto.");
  };

  const registerToken = async (token: string) => {
    setStatus("Registrazione in corso…");
    try {
      const res = await fetch("/api/telegram/register-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; bot?: string; error?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? "Errore registrazione");
        return;
      }
      setStatus(`Bot @${data.bot} attivo! Webhook configurato.`);
    } catch {
      setStatus("Errore di rete. Usa: npm run telegram:register -- TOKEN");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 pb-24 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-sage-100">Bot Telegram</h1>
        <p className="text-sm text-sage-400 mt-1">
          Mastro Fungaiolo su Telegram — GPS, foto funghi, allerte Pro
        </p>
      </div>

      <article className="enterprise-panel rounded-2xl p-5 space-y-4 border border-neon/20">
        <button
          type="button"
          onClick={openBotFather}
          className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-neon/15 border border-neon/40 text-neon text-sm font-semibold hover:bg-neon/25 transition-colors touch-manipulation"
        >
          1. Crea bot su @BotFather →
        </button>

        <div>
          <label className="text-xs text-sage-500 block mb-1">
            2. Incolla il token qui
          </label>
          <input
            type="password"
            placeholder="123456789:ABCdefGHI..."
            className="w-full px-3 py-2.5 rounded-xl bg-enterprise-bg border border-enterprise-border text-sage-200 text-sm"
            onPaste={(e) => {
              const t = e.clipboardData.getData("text");
              if (t.includes(":")) void registerToken(t);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value;
                if (v) void registerToken(v);
              }
            }}
          />
        </div>

        {status && (
          <p className="text-sm text-sage-300 border-t border-enterprise-border pt-3">
            {status}
          </p>
        )}
      </article>

      <p className="text-xs text-sage-600">
        Comandi: /start · /radar · /diario · /aiuto
      </p>

      <Link href="/" className="text-sm text-sage-500 hover:text-neon">
        ← Torna alla mappa
      </Link>
    </div>
  );
}
