#!/usr/bin/env node
/** Verifica che sendMessage usi URL Telegram corretto */
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN mancante");
  process.exit(1);
}

const expectedUrl = `https://api.telegram.org/bot${token}/sendMessage`;
const body = {
  chat_id: process.env.TEST_CHAT_ID || "123456789",
  text: "MushroomRadar — test bot API",
};

const res = await fetch(expectedUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json();

if (json.ok) {
  console.log("✅ sendMessage OK — bot risponde");
  process.exit(0);
}

if (json.error_code === 400 && json.description?.includes("chat not found")) {
  console.log("✅ URL API corretto (chat di test inesistente, atteso)");
  process.exit(0);
}

console.error("❌ sendMessage fallito:", json);
process.exit(1);
