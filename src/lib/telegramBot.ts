const TELEGRAM_API = "https://api.telegram.org/bot";

export async function telegramApi(
  method: string,
  token: string,
  body?: Record<string, unknown>
): Promise<Response> {
  return fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  parseMode: "Markdown" | "HTML" = "Markdown"
): Promise<boolean> {
  const res = await telegramApi(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  });
  return res.ok;
}

export const BOT_COMMANDS = [
  { command: "start", description: "Avvia MushroomRadar Bot" },
  { command: "radar", description: "Link alla mappa live" },
  { command: "diario", description: "Apri il diario fungaiolo" },
  { command: "aiuto", description: "Guida comandi e disclaimer" },
];
