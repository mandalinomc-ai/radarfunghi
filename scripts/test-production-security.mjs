#!/usr/bin/env node
/** Test sicurezza + pagine produzione MushroomRadar */
const BASE = process.env.TEST_URL || "https://radar-funghi.vercel.app";

const pages = ["/", "/radar", "/analytics", "/diario", "/classifier", "/telegram"];

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
  console.log(`Test produzione → ${BASE}\n`);
  let ok = 0;
  let total = 0;

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

  total++;
  if (
    await test("Cron notify senza auth → 401", async () => {
      const r = await fetch(`${BASE}/api/telegram/notify`);
      if (r.status !== 401) throw new Error(`Atteso 401, ricevuto ${r.status}`);
    })
  )
    ok++;

  total++;
  if (
    await test("Cron refresh senza auth → 401", async () => {
      const r = await fetch(`${BASE}/api/cron/refresh`);
      if (r.status !== 401) throw new Error(`Atteso 401, ricevuto ${r.status}`);
    })
  )
    ok++;

  total++;
  if (
    await test("Classify senza immagine → 400", async () => {
      const r = await fetch(`${BASE}/api/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (r.status !== 400) throw new Error(`Atteso 400, ricevuto ${r.status}`);
    })
  )
    ok++;

  total++;
  if (
    await test("Security header X-Frame-Options", async () => {
      const r = await fetch(`${BASE}/`);
      const h = r.headers.get("x-frame-options");
      if (!h || h.toLowerCase() !== "deny") throw new Error(`Header mancante: ${h}`);
    })
  )
    ok++;

  total++;
  if (
    await test("Setup TG GET senza auth → 401", async () => {
      const r = await fetch(`${BASE}/api/telegram/setup`);
      if (r.status !== 401) throw new Error(`Atteso 401, ricevuto ${r.status}`);
    })
  )
    ok++;

  console.log(`\n${ok}/${total} test passati`);
  process.exit(ok === total ? 0 : 1);
}

main();
