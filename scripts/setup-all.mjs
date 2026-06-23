#!/usr/bin/env node
/**
 * Setup produzione MushroomRadar — env, Telegram, redeploy.
 * Usage: node scripts/setup-all.mjs
 *        TELEGRAM_BOT_TOKEN=xxx TELEGRAM_GROUP_CHAT_ID=yyy node scripts/setup-all.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");
const APP_URL = "https://radar-funghi.vercel.app";

/** Parse .env anche se righe concatenate senza newline */
function parseEnvRaw(raw) {
  const map = new Map();
  const flat = raw.replace(/\r\n/g, "\n").replace(/\n/g, "");
  const re = /([A-Z_][A-Z0-9_]*)=([^]*?)(?=[A-Z_][A-Z0-9_]*=|$)/g;
  let m;
  while ((m = re.exec(flat)) !== null) {
    map.set(m[1], m[2].trim());
  }
  return map;
}

function readEnvFile() {
  if (!existsSync(envPath)) return new Map();
  return parseEnvRaw(readFileSync(envPath, "utf8"));
}

function writeEnvFile(map) {
  const order = [
    "GEMINI_API_KEY",
    "GEMINI_CHAT_MODEL",
    "CRON_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_GROUP_CHAT_ID",
    "TELEGRAM_API_ID",
    "TELEGRAM_API_HASH",
    "TELEGRAM_SESSION",
  ];
  const seen = new Set();
  const lines = [];
  for (const key of order) {
    if (map.has(key)) {
      lines.push(`${key}=${map.get(key)}`);
      seen.add(key);
    }
  }
  for (const [key, val] of map) {
    if (!seen.has(key)) lines.push(`${key}=${val}`);
  }
  writeFileSync(envPath, lines.join("\n") + "\n", "utf8");
}

function upsertEnv(key, value) {
  const map = readEnvFile();
  map.set(key, value);
  writeEnvFile(map);
  console.log(`✅ .env.local → ${key}`);
}

function vercelEnvSet(name, value, environments = ["production", "preview"]) {
  for (const env of environments) {
    spawnSync("npx", ["vercel", "env", "rm", name, env, "--yes"], {
      cwd: root,
      stdio: "pipe",
      shell: true,
    });
    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", name, env, "--force"],
      {
        cwd: root,
        input: value,
        encoding: "utf8",
        shell: true,
      }
    );
    if (r.status === 0) {
      console.log(`✅ Vercel ${name} (${env})`);
    } else {
      console.warn(`⚠️  Vercel ${name} (${env}):`, (r.stderr || r.stdout || "").slice(0, 200));
    }
  }
}

async function main() {
  console.log("MushroomRadar — Setup completo\n");

  const local = readEnvFile();

  let cronSecret = process.env.CRON_SECRET?.trim() || local.get("CRON_SECRET")?.trim();
  if (!cronSecret) {
    cronSecret = randomBytes(32).toString("hex");
  }
  upsertEnv("CRON_SECRET", cronSecret);
  upsertEnv("NEXT_PUBLIC_APP_URL", APP_URL);

  const geminiKey = process.env.GEMINI_API_KEY?.trim() || local.get("GEMINI_API_KEY")?.trim();
  const geminiModel =
    process.env.GEMINI_CHAT_MODEL?.trim() ||
    local.get("GEMINI_CHAT_MODEL")?.trim() ||
    "gemini-2.5-flash";
  if (geminiKey) upsertEnv("GEMINI_API_KEY", geminiKey);
  upsertEnv("GEMINI_CHAT_MODEL", geminiModel);

  let tgToken =
    process.env.TELEGRAM_BOT_TOKEN?.trim() || local.get("TELEGRAM_BOT_TOKEN")?.trim();
  let tgGroup =
    process.env.TELEGRAM_GROUP_CHAT_ID?.trim() ||
    local.get("TELEGRAM_GROUP_CHAT_ID")?.trim();

  if (!tgToken) {
    const hasApiCreds =
      process.env.TELEGRAM_API_ID?.trim() ||
      local.get("TELEGRAM_API_ID")?.trim();
    if (hasApiCreds) {
      console.log("\n— Provisioning bot Telegram (GramJS + BotFather) —");
      const prov = spawnSync("npx", ["tsx", "scripts/provision-telegram.ts"], {
        cwd: root,
        stdio: "inherit",
        shell: true,
        env: { ...process.env, NEXT_PUBLIC_APP_URL: APP_URL },
        timeout: 180_000,
      });
      if (prov.status === 0) {
        const refreshed = readEnvFile();
        tgToken = refreshed.get("TELEGRAM_BOT_TOKEN")?.trim();
        tgGroup = refreshed.get("TELEGRAM_GROUP_CHAT_ID")?.trim() || tgGroup;
      }
    } else {
      console.log("\n— Invio codice login Telegram al telefono —");
      spawnSync("npx", ["tsx", "scripts/telegram-phone-login.ts", "send", "+393483470654"], {
        cwd: root,
        stdio: "inherit",
        shell: true,
        timeout: 90_000,
      });
    }
  }

  console.log("\n— Sync variabili Vercel —");
  vercelEnvSet("NEXT_PUBLIC_APP_URL", APP_URL);
  vercelEnvSet("CRON_SECRET", cronSecret);
  if (geminiKey) vercelEnvSet("GEMINI_API_KEY", geminiKey);
  vercelEnvSet("GEMINI_CHAT_MODEL", geminiModel, ["production"]);

  if (tgToken) {
    upsertEnv("TELEGRAM_BOT_TOKEN", tgToken);
    vercelEnvSet("TELEGRAM_BOT_TOKEN", tgToken);
    console.log("\n— Webhook Telegram —");
    spawnSync("npx", ["tsx", "scripts/setup-telegram.ts"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, TELEGRAM_BOT_TOKEN: tgToken, NEXT_PUBLIC_APP_URL: APP_URL },
    });
  } else {
    console.log("\n⚠️  Bot Telegram non provisionato (serve sessione GramJS o token manuale).");
  }

  if (tgGroup) {
    upsertEnv("TELEGRAM_GROUP_CHAT_ID", tgGroup);
    vercelEnvSet("TELEGRAM_GROUP_CHAT_ID", tgGroup);
  }

  console.log("\n— Deploy produzione —");
  execSync("npx vercel deploy --prod --yes", {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  console.log(`\n✅ Completato → ${APP_URL}`);
  if (tgToken) {
    const me = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`).then((r) =>
      r.json()
    );
    if (me.ok) console.log(`🤖 Bot attivo: @${me.result.username}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
