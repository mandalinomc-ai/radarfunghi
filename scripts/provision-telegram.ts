#!/usr/bin/env npx tsx
/**
 * Crea bot MushroomRadar via @BotFather (GramJS MTProto).
 * Richiede TELEGRAM_API_ID + TELEGRAM_API_HASH da https://my.telegram.org
 * oppure sessione salvata in .telegram-session (gitignored).
 *
 * Prima esecuzione: scan QR su Telegram → Settings → Devices → Link Desktop Device
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");
const sessionPath = resolve(root, ".telegram-session");

const BOT_NAME = "MushroomRadar Pro";
const BOT_USERNAME = `mushroomradar_${Date.now().toString(36).slice(-6)}_bot`;

function parseEnv(): Map<string, string> {
  if (!existsSync(envPath)) return new Map();
  const map = new Map<string, string>();
  const raw = readFileSync(envPath, "utf8").replace(/\r\n/g, "\n");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

function saveEnvPair(key: string, value: string) {
  const map = parseEnv();
  map.set(key, value);
  const lines = [...map.entries()].map(([k, v]) => `${k}=${v}`);
  writeFileSync(envPath, lines.join("\n") + "\n", "utf8");
}

function extractToken(text: string): string | null {
  const m = text.match(/(\d{8,10}:[A-Za-z0-9_-]{30,})/);
  return m?.[1] ?? null;
}

async function main() {
  const env = parseEnv();
  const existing = env.get("TELEGRAM_BOT_TOKEN")?.trim();
  if (existing) {
    console.log("⏭️  TELEGRAM_BOT_TOKEN già presente");
    return;
  }

  const apiId = Number(
    process.env.TELEGRAM_API_ID?.trim() || env.get("TELEGRAM_API_ID")
  );
  const apiHash =
    process.env.TELEGRAM_API_HASH?.trim() || env.get("TELEGRAM_API_HASH");

  if (!apiId || !apiHash) {
    console.log("⏭️  TELEGRAM_API_ID/HASH non configurati — salto provisioning automatico");
    process.exit(1);
  }

  let sessionStr = "";
  if (existsSync(sessionPath)) {
    sessionStr = readFileSync(sessionPath, "utf8").trim();
  } else if (env.get("TELEGRAM_SESSION")?.trim()) {
    sessionStr = env.get("TELEGRAM_SESSION")!.trim();
  }

  const { TelegramClient } = await import("telegram");
  const { StringSession } = await import("telegram/sessions");
  const { NewMessage } = await import("telegram/events");

  const session = new StringSession(sessionStr);
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("Connessione Telegram MTProto…");

  await client.connect();

  if (!(await client.isUserAuthorized())) {
    const apiIdEnv = process.env.TELEGRAM_API_ID?.trim() || env.get("TELEGRAM_API_ID")?.trim();
    if (!apiIdEnv) {
      console.error(`
❌ Credenziali Telegram mancanti.

Per creare il bot automaticamente:
1. Vai su https://my.telegram.org → API development tools
2. Crea app e copia api_id + api_hash in .env.local:
   TELEGRAM_API_ID=12345678
   TELEGRAM_API_HASH=abcdef...
3. Riesegui: npm run setup:all

Oppure crea il bot manualmente con @BotFather e aggiungi:
   TELEGRAM_BOT_TOKEN=...
`);
      process.exit(1);
    }

    console.log("\n📱 Scansiona il QR con Telegram (Impostazioni → Dispositivi → Collega):");
    await client.signInUserWithQrCode(
      { apiId, apiHash },
      {
        qrCode: async (code) => {
          const token = Buffer.from(code.token).toString("base64url");
          const url = `tg://login?token=${token}`;
          console.log(`\n   ${url}\n`);
          console.log(
            `   QR: https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}\n`
          );
        },
        onError: (err) => console.error("QR error:", err),
      }
    );
    const saved = session.save();
    writeFileSync(sessionPath, saved, "utf8");
    saveEnvPair("TELEGRAM_SESSION", saved);
    console.log("✅ Sessione salvata in .telegram-session");
  }

  let botToken: string | null = null;
  let resolved = false;

  client.addEventHandler(async (event) => {
    const text = event.message?.message ?? "";
    if (text.includes("Done! Congratulations") || text.includes("HTTP API")) {
      const tok = extractToken(text);
      if (tok) {
        botToken = tok;
        resolved = true;
      }
    }
    if (text.includes("choose a name for your bot")) {
      await client.sendMessage("BotFather", { message: BOT_NAME });
    } else if (text.includes("choose a username for your bot")) {
      await client.sendMessage("BotFather", { message: BOT_USERNAME });
    } else if (text.includes("Sorry") && text.includes("username")) {
      const alt = `mr_radar_${Date.now().toString(36)}_bot`;
      await client.sendMessage("BotFather", { message: alt });
    }
  }, new NewMessage({ chats: ["BotFather"] }));

  console.log(`Creazione bot: ${BOT_NAME} (@${BOT_USERNAME})…`);
  await client.sendMessage("BotFather", { message: "/newbot" });

  const deadline = Date.now() + 90_000;
  while (!resolved && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
  }

  await client.disconnect();

  if (!botToken) {
    console.error("❌ Token bot non ricevuto da BotFather (timeout 90s)");
    process.exit(1);
  }

  saveEnvPair("TELEGRAM_BOT_TOKEN", botToken);
  console.log(`✅ Bot creato, token salvato in .env.local`);

  const me = await fetch(`https://api.telegram.org/bot${botToken}/getMe`).then((r) =>
    r.json()
  );
  if (me.ok) {
    console.log(`   @${me.result.username}`);
  }

  const groupId = env.get("TELEGRAM_GROUP_CHAT_ID")?.trim();
  if (!groupId) {
    console.log(
      "\nℹ️  TELEGRAM_GROUP_CHAT_ID: crea un canale/gruppo Pro, aggiungi il bot come admin, poi invia /start al bot e riesegui setup-all."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
