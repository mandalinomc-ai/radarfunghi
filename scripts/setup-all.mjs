#!/usr/bin/env node
/**
 * Setup produzione MushroomRadar — env, Telegram (se token presente), redeploy.
 * Usage: node scripts/setup-all.mjs
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

function readEnvFile() {
  const map = new Map();
  if (!existsSync(envPath)) return map;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

function upsertEnvLocal(key, value) {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  content = re.test(content)
    ? content.replace(re, line)
    : content.trimEnd() + (content.endsWith("\n") ? "" : "\n") + line + "\n";
  writeFileSync(envPath, content, "utf8");
  console.log(`✅ .env.local → ${key}`);
}

function vercelEnvAdd(name, value, environments = ["production", "preview"]) {
  for (const env of environments) {
    const check = spawnSync("npx", ["vercel", "env", "ls"], {
      cwd: root,
      encoding: "utf8",
      shell: true,
    });
    if (check.stdout?.includes(name) && check.stdout.includes(env)) {
      console.log(`⏭️  Vercel ${name} (${env}) già presente`);
      continue;
    }
    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", name, env, "--force"],
      {
        cwd: root,
        input: value + "\n",
        encoding: "utf8",
        shell: true,
      }
    );
    if (r.status === 0) {
      console.log(`✅ Vercel ${name} (${env})`);
    } else {
      console.warn(`⚠️  Vercel ${name} (${env}):`, r.stderr || r.stdout);
    }
  }
}

async function main() {
  console.log("MushroomRadar — Setup produzione completo\n");

  const local = readEnvFile();
  let cronSecret = local.get("CRON_SECRET")?.trim();
  if (!cronSecret) {
    cronSecret = randomBytes(32).toString("hex");
    upsertEnvLocal("CRON_SECRET", cronSecret);
  } else {
    console.log("⏭️  CRON_SECRET già in .env.local");
  }

  upsertEnvLocal("NEXT_PUBLIC_APP_URL", APP_URL);

  console.log("\n— Sync variabili Vercel —");
  vercelEnvAdd("NEXT_PUBLIC_APP_URL", APP_URL);
  vercelEnvAdd("CRON_SECRET", cronSecret);

  const tgToken = local.get("TELEGRAM_BOT_TOKEN")?.trim();
  const tgGroup = local.get("TELEGRAM_GROUP_CHAT_ID")?.trim();

  if (tgToken) {
    vercelEnvAdd("TELEGRAM_BOT_TOKEN", tgToken);
    console.log("\n— Setup Telegram webhook —");
    spawnSync("npx", ["tsx", "scripts/setup-telegram.ts"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, TELEGRAM_BOT_TOKEN: tgToken, NEXT_PUBLIC_APP_URL: APP_URL },
    });
  } else {
    console.log(`
⚠️  TELEGRAM_BOT_TOKEN non trovato in .env.local
   1. Apri @BotFather → /newbot → copia il token
   2. Aggiungi in .env.local:
      TELEGRAM_BOT_TOKEN=...
      TELEGRAM_GROUP_CHAT_ID=-100xxxxxxxxxx
   3. Riesegui: node scripts/setup-all.mjs
`);
  }

  if (tgGroup) {
    vercelEnvAdd("TELEGRAM_GROUP_CHAT_ID", tgGroup);
  }

  console.log("\n— Deploy produzione —");
  execSync("npx vercel deploy --prod --yes", {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  console.log(`\n✅ Completato → ${APP_URL}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
