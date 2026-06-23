"use client";

import Link from "next/link";

export default function TelegramSetupPage() {
  return (
    <div className="max-w-lg mx-auto p-6 pb-24 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-sage-100">Bot Telegram</h1>
        <p className="text-sm text-sage-400 mt-1">
          Mastro Fungaiolo su Telegram — GPS, foto funghi, allerte Pro
        </p>
      </div>

      <article className="enterprise-panel rounded-2xl p-5 space-y-4 border border-neon/20">
        <p className="text-sm text-sage-300">
          Il bot si attiva in 2 minuti con{" "}
          <strong className="text-neon">@BotFather</strong>:
        </p>
        <ol className="text-sm text-sage-400 space-y-2 list-decimal list-inside">
          <li>Apri BotFather e invia <code className="text-neon">/newbot</code></li>
          <li>Scegli nome e username (deve finire con <code>bot</code>)</li>
          <li>Copia il token e incollalo al team / in <code>.env.local</code></li>
          <li>
            Esegui:{" "}
            <code className="text-xs text-neon block mt-1 break-all">
              npm run telegram:register -- TOKEN
            </code>
          </li>
        </ol>
        <a
          href="https://t.me/BotFather?start=newbot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon/15 border border-neon/40 text-neon text-sm font-semibold hover:bg-neon/25 transition-colors"
        >
          Apri @BotFather →
        </a>
      </article>

      <p className="text-xs text-sage-600">
        Comandi bot: /start · /radar · /diario · /aiuto — invia GPS o foto per
        analisi live.
      </p>

      <Link href="/" className="text-sm text-sage-500 hover:text-neon">
        ← Torna alla mappa
      </Link>
    </div>
  );
}
