#!/usr/bin/env npx tsx
/**
 * Setup Telegram Bot per MushroomRadar
 * Usage: TELEGRAM_BOT_TOKEN=xxx NEXT_PUBLIC_APP_URL=https://... npx tsx scripts/setup-telegram.ts
 */

import { BOT_COMMANDS } from "../src/lib/telegramBot";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";
const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

async function tg(method: string, body?: Record<string, unknown>) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN mancante");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.ok) {
    console.error(`❌ ${method}:`, json);
    return false;
  }
  console.log(`✅ ${method}`);
  return true;
}

async function main() {
  console.log("MushroomRadar — Setup Telegram Bot\n");
  console.log(`Webhook URL: ${webhookUrl}\n`);

  if (!token) {
    console.log(`
ISTRUZIONI MANUALI:
1. Crea bot con @BotFather su Telegram → ottieni TELEGRAM_BOT_TOKEN
2. Imposta variabili su Vercel:
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_GROUP_CHAT_ID=... (canale/gruppo Pro)
   NEXT_PUBLIC_APP_URL=${appUrl}
3. Riesegui: TELEGRAM_BOT_TOKEN=xxx npx tsx scripts/setup-telegram.ts
`);
    process.exit(1);
  }

  await tg("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"],
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined,
    drop_pending_updates: true,
  });

  await tg("setMyCommands", {
    commands: BOT_COMMANDS,
  });

  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then(
    (r) => r.json()
  );
  if (me.ok) {
    console.log(`\nBot attivo: @${me.result.username}`);
  }

  console.log(`
Comandi configurati: ${BOT_COMMANDS.map((c) => c.command).join(", ")}
Cron allerte: aggiungi su Vercel GET /api/telegram/notify con CRON_SECRET
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
