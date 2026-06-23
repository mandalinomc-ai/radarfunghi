#!/usr/bin/env node
/**
 * Test completo produzione MushroomRadar
 * Usage: TEST_URL=https://radar-funghi.vercel.app node scripts/test-all-production.mjs
 */
import { spawnSync } from "node:child_process";

const BASE = process.env.TEST_URL || "https://radar-funghi.vercel.app";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (e) {
    console.log(`❌ ${name}: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

async function main() {
  console.log(`\n🍄 MushroomRadar — test completo → ${BASE}\n`);

  let ok = 0;
  let total = 0;

  const pages = ["/", "/radar", "/analytics", "/diario", "/classifier", "/telegram"];
  for (const p of pages) {
    total++;
    if (
      await test(`Pagina ${p}`, async () => {
        const r = await fetch(`${BASE}${p}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      })
    )
      ok++;
  }

  total++;
  if (
    await test("API weather", async () => {
      const r = await fetch(`${BASE}/api/weather?lat=41.13&lng=14.78`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (!j) throw new Error("Risposta vuota");
    })
  )
    ok++;

  total++;
  if (
    await test("Webhook TG senza secret → 403/503", async () => {
      const r = await fetch(`${BASE}/api/telegram/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (r.status !== 403 && r.status !== 503) {
        throw new Error(`Atteso 403/503, ricevuto ${r.status}`);
      }
    })
  )
    ok++;

  if (WEBHOOK_SECRET) {
    total++;
    if (
      await test("Webhook TG /start con secret → 200", async () => {
        const r = await fetch(`${BASE}/api/telegram/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Bot-Api-Secret-Token": WEBHOOK_SECRET,
          },
          body: JSON.stringify({
            update_id: 999999998,
            message: {
              message_id: 1,
              chat: { id: 1, type: "private" },
              text: "/start",
            },
          }),
        });
        if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!j.ok) throw new Error(JSON.stringify(j));
      })
    )
      ok++;
  } else {
    console.log("⏭️  Webhook /start — salta (TELEGRAM_WEBHOOK_SECRET non impostato)");
  }

  if (BOT_TOKEN) {
    total++;
    if (
      await test("Bot Telegram getMe", async () => {
        const r = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
        );
        const j = await r.json();
        if (!j.ok) throw new Error(JSON.stringify(j));
        if (!j.result?.username) throw new Error("Username mancante");
      })
    )
      ok++;

    total++;
    if (
      await test("Webhook Telegram registrato", async () => {
        const r = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
        );
        const j = await r.json();
        if (!j.ok) throw new Error(JSON.stringify(j));
        const url = j.result?.url || "";
        if (!url.includes("api/telegram/webhook")) {
          throw new Error(`URL webhook errato: ${url || "(vuoto)"}`);
        }
        if (j.result?.last_error_message) {
          throw new Error(j.result.last_error_message);
        }
      })
    )
      ok++;
  } else {
    console.log("⏭️  Bot getMe/webhook — salta (TELEGRAM_BOT_TOKEN non impostato)");
  }

  total++;
  if (
    await test("Bundle layout contiene dock Telegram", async () => {
      const r = await fetch(`${BASE}/`);
      const html = await r.text();
      const layoutMatch = html.match(
        /\/_next\/static\/chunks\/app\/layout-[a-f0-9]+\.js/
      );
      if (!layoutMatch) throw new Error("Chunk layout non trovato");
      const lr = await fetch(`${BASE}${layoutMatch[0]}`);
      const js = await lr.text();
      if (!js.includes("Community Telegram")) {
        throw new Error("Dock Telegram assente dal bundle");
      }
      if (!js.includes("startgroup")) {
        throw new Error("URL gruppo Telegram errato nel bundle");
      }
    })
  )
    ok++;

  total++;
  if (
    await test("Manifest PWA", async () => {
      const r = await fetch(`${BASE}/manifest.json`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (!j.name) throw new Error("manifest senza name");
    })
  )
    ok++;

  console.log(`\n${ok}/${total} test passati\n`);

  const sec = spawnSync("node", ["scripts/test-production-security.mjs"], {
    stdio: "inherit",
    env: { ...process.env, TEST_URL: BASE },
  });

  if (sec.status !== 0) {
    process.exit(1);
  }

  if (ok !== total) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
