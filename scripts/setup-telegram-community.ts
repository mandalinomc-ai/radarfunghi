#!/usr/bin/env npx tsx
/**
 * Branding Telegram + istruzioni community
 * Usage: TELEGRAM_BOT_TOKEN=xxx NEXT_PUBLIC_APP_URL=https://... npx tsx scripts/setup-telegram-community.ts
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { BOT_COMMANDS } from "../src/lib/telegramBot";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";
const logoPath = join(root, "public", "logo.png");
const groupId = process.env.TELEGRAM_GROUP_CHAT_ID?.trim();
const channelId = process.env.TELEGRAM_CHANNEL_CHAT_ID?.trim();

async function tg(method: string, body?: Record<string, unknown> | FormData) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN mancante");
  const isForm = body instanceof FormData;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: isForm ? undefined : body ? { "Content-Type": "application/json" } : undefined,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return json as { ok: boolean; description?: string; result?: unknown };
}

async function setBotPhoto() {
  const form = new FormData();
  const blob = new Blob([readFileSync(logoPath)], { type: "image/png" });
  form.append("photo", blob, "logo.png");
  const r = await tg("setProfilePhoto", form);
  console.log(r.ok ? "✅ Foto profilo bot" : `⚠️ Foto bot: ${r.description}`);
}

async function setChatPhoto(chatId: string, label: string) {
  const form = new FormData();
  form.append("chat_id", chatId);
  const blob = new Blob([readFileSync(logoPath)], { type: "image/png" });
  form.append("photo", blob, "logo.png");
  const r = await tg("setChatPhoto", form);
  console.log(r.ok ? `✅ Foto ${label}` : `⚠️ Foto ${label}: ${r.description}`);
}

async function main() {
  console.log("MushroomRadar — Community Telegram + branding\n");

  if (!token) {
    console.log("Imposta TELEGRAM_BOT_TOKEN");
    process.exit(1);
  }

  await tg("setMyCommands", { commands: BOT_COMMANDS });
  console.log("✅ Comandi bot aggiornati");

  await tg("setMyDescription", {
    description:
      "Radar predittivo funghi: score live, previsioni, alert clima. Scegli la zona e ricevi aggiornamenti ≥70%. MushroomRadar — Bloomberg dei Funghi.",
  });
  await tg("setMyShortDescription", {
    short_description: "Sprout Score live, previsioni e community fungaioli Sud Italia.",
  });
  console.log("✅ Descrizione bot");

  await setBotPhoto();

  if (groupId) await setChatPhoto(groupId, "gruppo");
  if (channelId) await setChatPhoto(channelId, "canale");

  const me = await tg("getMe");
  const username = (me.result as { username?: string })?.username ?? "RADARFUNGHIBOT";

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CREA COMMUNITY (una tantum su Telegram)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. GRUPPO
   • Telegram → Nuovo gruppo → "MushroomRadar Community"
   • Aggiungi @${username} come amministratore
   • Nel gruppo scrivi: /setalerts
   • Copia TELEGRAM_GROUP_CHAT_ID su Vercel

2. CANALE
   • Nuovo canale → "MushroomRadar Alert"
   • Aggiungi @${username} come admin
   • Collega il gruppo come chat di discussione del canale
   • Imposta TELEGRAM_CHANNEL_CHAT_ID su Vercel (opzionale foto)

3. LOGO
   • Sito: ${appUrl}/logo.png
   • Icona: ${appUrl}/icon.svg

4. Riesegui questo script dopo aver impostato gli ID chat
   TELEGRAM_GROUP_CHAT_ID=-100xxx npx tsx scripts/setup-telegram-community.ts

Bot: https://t.me/${username}
Sito: ${appUrl}
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
