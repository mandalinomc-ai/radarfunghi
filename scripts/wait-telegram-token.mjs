#!/usr/bin/env node
/**
 * Attende token BotFather (clipboard o argv) → Vercel + webhook + deploy
 * Usage: node scripts/wait-telegram-token.mjs [TOKEN]
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const TOKEN_RE = /(\d{8,10}:[A-Za-z0-9_-]{30,})/;

function readClipboardWindows() {
  try {
    const out = execSync("powershell -NoProfile -Command Get-Clipboard", {
      encoding: "utf8",
    });
    return out.trim();
  } catch {
    return "";
  }
}

function extractToken(text) {
  const m = text.match(TOKEN_RE);
  return m?.[1] ?? null;
}

async function validateToken(token) {
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) =>
    r.json()
  );
  return me.ok ? me.result.username : null;
}

async function pollClipboard(maxSec = 180) {
  console.log("In attesa del token BotFather (copialo negli appunti)…");
  console.log("BotFather: https://t.me/BotFather?start=newbot\n");
  const deadline = Date.now() + maxSec * 1000;
  let last = "";
  while (Date.now() < deadline) {
    const clip = readClipboardWindows();
    if (clip && clip !== last) {
      last = clip;
      const tok = extractToken(clip);
      if (tok) {
        const user = await validateToken(tok);
        if (user) {
          console.log(`\n✅ Token rilevato: @${user}`);
          return tok;
        }
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

async function main() {
  let token = process.argv[2]?.trim();
  if (token && !TOKEN_RE.test(token)) {
    const ex = extractToken(token);
    token = ex ?? token;
  }

  if (!token) {
    token = await pollClipboard(300);
  } else {
    const user = await validateToken(token);
    if (!user) {
      console.error("❌ Token non valido");
      process.exit(1);
    }
    console.log(`✅ Bot: @${user}`);
  }

  if (!token) {
    console.error("\n❌ Timeout — crea il bot su @BotFather e copia il token.");
    process.exit(1);
  }

  spawnSync("node", ["scripts/register-telegram-token.mjs", token], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
