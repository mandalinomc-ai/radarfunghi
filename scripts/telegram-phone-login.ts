#!/usr/bin/env npx tsx
/**
 * Login Telegram via SMS/app — fase 1: invia codice
 *   npx tsx scripts/telegram-phone-login.ts send +393483470654
 * Fase 2: verifica codice
 *   npx tsx scripts/telegram-phone-login.ts verify 12345
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");
const statePath = resolve(root, ".telegram-auth-state.json");
const sessionPath = resolve(root, ".telegram-session");

function parseEnv(): Map<string, string> {
  if (!existsSync(envPath)) return new Map();
  const map = new Map<string, string>();
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

function saveEnv(keys: Record<string, string>) {
  const map = parseEnv();
  for (const [k, v] of Object.entries(keys)) map.set(k, v);
  writeFileSync(
    envPath,
    [...map.entries()].map(([k, v]) => `${k}=${v}`).join("\n") + "\n",
    "utf8"
  );
}

async function getApiCreds(): Promise<{ apiId: number; apiHash: string }> {
  const env = parseEnv();
  let apiId = Number(process.env.TELEGRAM_API_ID || env.get("TELEGRAM_API_ID"));
  let apiHash = process.env.TELEGRAM_API_HASH || env.get("TELEGRAM_API_HASH");

  if (apiId && apiHash) return { apiId, apiHash };

  console.log("Recupero api_id da my.telegram.org…");
  const phone = process.argv[3] || "+393483470654";
  const sendRes = await fetch("https://my.telegram.org/auth/send_password", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `phone=${encodeURIComponent(phone)}`,
  });
  const sendText = await sendRes.text();
  if (!sendText.includes("true") && !sendRes.ok) {
    throw new Error(`my.telegram.org send_password: ${sendText}`);
  }
  console.log("✅ Codice inviato su Telegram (app) per ottenere API credentials.");
  console.log("   Incolla il codice: npx tsx scripts/telegram-phone-login.ts api <CODICE>");
  writeFileSync(
    statePath,
    JSON.stringify({ step: "api_login", phone, randomHash: sendText }),
    "utf8"
  );
  process.exit(0);
}

async function fetchApiFromMyTelegram(code: string) {
  const state = JSON.parse(readFileSync(statePath, "utf8")) as {
    phone: string;
    randomHash?: string;
  };
  let randomHash = state.randomHash ?? "";
  try {
    const parsed = JSON.parse(randomHash) as { random_hash?: string };
    if (parsed.random_hash) randomHash = parsed.random_hash;
  } catch {
    /* already plain hash */
  }

  const loginRes = await fetch("https://my.telegram.org/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `phone=${encodeURIComponent(state.phone)}&password=${encodeURIComponent(code)}&random_hash=${encodeURIComponent(randomHash)}`,
  });
  const loginText = await loginRes.text();
  if (!loginText.includes("true")) {
    throw new Error(`Login my.telegram.org fallito: ${loginText}`);
  }

  const setCookie = loginRes.headers.getSetCookie?.() ?? [];
  const cookie =
    setCookie.length > 0
      ? setCookie.map((c) => c.split(";")[0]).join("; ")
      : (loginRes.headers.get("set-cookie") ?? "").split(",").map((c) => c.split(";")[0]).join("; ");
  const appsRes = await fetch("https://my.telegram.org/apps", {
    headers: { Cookie: cookie },
  });
  const html = await appsRes.text();

  let apiId = html.match(/api_id["\s:]+(\d+)/i)?.[1];
  let apiHash = html.match(/api_hash["\s:]+["']([a-f0-9]+)/i)?.[1];

  if (!apiId || !apiHash) {
    const createRes = await fetch("https://my.telegram.org/apps/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
      body: new URLSearchParams({
        app_title: "MushroomRadar",
        app_shortname: "mushroomradar",
        app_url: "https://radar-funghi.vercel.app",
        app_platform: "desktop",
        app_desc: "Mushroom foraging radar",
      }).toString(),
    });
    await createRes.text();
    const apps2 = await fetch("https://my.telegram.org/apps", {
      headers: { Cookie: cookie },
    });
    const html2 = await apps2.text();
    apiId = html2.match(/api_id["\s:]+(\d+)/i)?.[1];
    apiHash = html2.match(/api_hash["\s:]+["']([a-f0-9]+)/i)?.[1];
  }

  if (!apiId || !apiHash) {
    throw new Error("Impossibile leggere api_id/api_hash da my.telegram.org");
  }

  saveEnv({
    TELEGRAM_API_ID: apiId,
    TELEGRAM_API_HASH: apiHash,
  });
  console.log(`✅ API credentials salvate (api_id=${apiId})`);
  return { apiId: Number(apiId), apiHash };
}

async function sendCode(phone: string) {
  const { apiId, apiHash } = await getApiCreds();
  const { TelegramClient } = await import("telegram");
  const { StringSession } = await import("telegram/sessions");

  let sessionStr = existsSync(sessionPath)
    ? readFileSync(sessionPath, "utf8").trim()
    : "";

  const client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  const result = await client.sendCode(
    { apiId, apiHash },
    phone
  );

  writeFileSync(
    statePath,
    JSON.stringify({
      step: "gramjs_verify",
      phone,
      phoneCodeHash: result.phoneCodeHash,
      apiId,
      apiHash,
    }),
    "utf8"
  );

  console.log(`✅ Codice inviato a ${phone} (SMS o app Telegram).`);
  console.log("   Quando lo ricevi, incollalo qui o esegui:");
  console.log("   npx tsx scripts/telegram-phone-login.ts verify <CODICE>");
  await client.disconnect();
}

async function verifyCode(code: string) {
  if (!existsSync(statePath)) {
    throw new Error("Nessuno stato auth. Esegui prima: ... send +39...");
  }
  const state = JSON.parse(readFileSync(statePath, "utf8"));

  if (state.step === "api_login") {
    await fetchApiFromMyTelegram(code);
    console.log("Riprovo invio codice GramJS…");
    await sendCode(state.phone);
    return;
  }

  const { TelegramClient } = await import("telegram");
  const { StringSession } = await import("telegram/sessions");

  const client = new TelegramClient(new StringSession(""), state.apiId, state.apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  await client.invoke(
    new (await import("telegram/tl")).Api.auth.SignIn({
      phoneNumber: state.phone,
      phoneCodeHash: state.phoneCodeHash,
      phoneCode: code,
    })
  );

  const saved = client.session.save();
  writeFileSync(sessionPath, saved, "utf8");
  saveEnv({ TELEGRAM_SESSION: saved });
  console.log("✅ Login Telegram completato. Sessione salvata.");
  await client.disconnect();

  console.log("\n— Creazione bot via BotFather —");
  const { spawnSync } = await import("node:child_process");
  spawnSync("npx", ["tsx", "scripts/provision-telegram.ts"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
}

const cmd = process.argv[2];
const arg = process.argv[3];

if (cmd === "send") {
  sendCode(arg || "+393483470654").catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (cmd === "verify") {
  if (!arg) {
    console.error("Uso: verify <CODICE>");
    process.exit(1);
  }
  verifyCode(arg).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (cmd === "api") {
  if (!arg) {
    console.error("Uso: api <CODICE>");
    process.exit(1);
  }
  fetchApiFromMyTelegram(arg)
    .then(() => sendCode("+393483470654"))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} else {
  console.log(`Uso:
  npx tsx scripts/telegram-phone-login.ts send [+39...]
  npx tsx scripts/telegram-phone-login.ts verify <codice>
  npx tsx scripts/telegram-phone-login.ts api <codice>`);
}
