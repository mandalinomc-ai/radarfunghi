#!/usr/bin/env node
/**
 * Registra token BotFather → .env.local + Vercel + webhook + deploy
 * Usage: node scripts/register-telegram-token.mjs "123456:ABC..."
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");
const APP_URL = "https://radar-funghi.vercel.app";

const token = process.argv[2]?.trim();
if (!token || !/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
  console.error(`Uso: node scripts/register-telegram-token.mjs "TOKEN_DA_BOTFATHER"`);
  console.error(`Ottieni il token: https://t.me/BotFather → /newbot`);
  process.exit(1);
}

function upsertEnv(key, value) {
  const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split("\n") : [];
  const map = new Map();
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  map.set(key, value);
  writeFileSync(
    envPath,
    [...map.entries()].map(([k, v]) => `${k}=${v}`).join("\n") + "\n",
    "utf8"
  );
}

async function main() {
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) =>
    r.json()
  );
  if (!me.ok) {
    console.error("❌ Token non valido:", me);
    process.exit(1);
  }
  console.log(`✅ Bot valido: @${me.result.username}`);

  upsertEnv("TELEGRAM_BOT_TOKEN", token);

  for (const env of ["production", "preview"]) {
    spawnSync("npx", ["vercel", "env", "rm", "TELEGRAM_BOT_TOKEN", env, "--yes"], {
      cwd: root,
      stdio: "pipe",
      shell: true,
    });
    spawnSync("npx", ["vercel", "env", "add", "TELEGRAM_BOT_TOKEN", env, "--force"], {
      cwd: root,
      input: token,
      encoding: "utf8",
      shell: true,
    });
    console.log(`✅ Vercel TELEGRAM_BOT_TOKEN (${env})`);
  }

  spawnSync("npx", ["tsx", "scripts/setup-telegram.ts"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, TELEGRAM_BOT_TOKEN: token, NEXT_PUBLIC_APP_URL: APP_URL },
  });

  console.log("\n— Deploy produzione —");
  execSync("npx vercel deploy --prod --yes", { cwd: root, stdio: "inherit", shell: true });
  console.log(`\n🍄 Bot @${me.result.username} attivo → ${APP_URL}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
