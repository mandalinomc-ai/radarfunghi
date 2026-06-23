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

export interface SendMessageResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  parseMode: "Markdown" | "HTML" = "Markdown"
): Promise<SendMessageResult> {
  const res = await telegramApi("sendMessage", token, {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  });

  if (res.ok) return { ok: true };

  let error = `HTTP ${res.status}`;
  try {
    const json = (await res.json()) as { description?: string };
    error = json.description ?? error;
  } catch {
    /* ignore */
  }

  if (parseMode === "Markdown") {
    const plain = await telegramApi("sendMessage", token, {
      chat_id: chatId,
      text: text.replace(/[*_`[\]]/g, ""),
    });
    if (plain.ok) return { ok: true };
  }

  return { ok: false, error };
}

export const BOT_COMMANDS = [
  { command: "start", description: "Avvia MushroomRadar Bot" },
  { command: "radar", description: "Link alla mappa live" },
  { command: "diario", description: "Apri il diario fungaiolo" },
  { command: "aiuto", description: "Guida comandi e disclaimer" },
];
