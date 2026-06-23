import type { FungalZone } from "./types";

export type InlineKeyboard = { text: string; callback_data: string }[][];

export interface TelegramApiResult {
  ok: boolean;
  error?: string;
}

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

async function parseTelegramError(res: Response): Promise<string> {
  let error = `HTTP ${res.status}`;
  try {
    const json = (await res.json()) as { description?: string };
    error = json.description ?? error;
  } catch {
    /* ignore */
  }
  return error;
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  options?: {
    parseMode?: "Markdown" | "HTML";
    replyMarkup?: InlineKeyboard;
  }
): Promise<TelegramApiResult> {
  const parseMode = options?.parseMode ?? "Markdown";
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  };
  if (options?.replyMarkup) {
    body.reply_markup = { inline_keyboard: options.replyMarkup };
  }

  const res = await telegramApi("sendMessage", token, body);
  if (res.ok) return { ok: true };

  const error = await parseTelegramError(res);

  if (parseMode === "Markdown") {
    const plain = await telegramApi("sendMessage", token, {
      chat_id: chatId,
      text: text.replace(/[*_`[\]]/g, ""),
      reply_markup: options?.replyMarkup
        ? { inline_keyboard: options.replyMarkup }
        : undefined,
    });
    if (plain.ok) return { ok: true };
    return { ok: false, error: await parseTelegramError(plain) };
  }

  return { ok: false, error };
}

export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await telegramApi("answerCallbackQuery", token, {
    callback_query_id: callbackQueryId,
    text: text?.slice(0, 200),
    show_alert: false,
  });
}

export async function editTelegramMessage(
  token: string,
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard
): Promise<TelegramApiResult> {
  const res = await telegramApi("editMessageText", token, {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "Markdown",
    reply_markup: replyMarkup ? { inline_keyboard: replyMarkup } : undefined,
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: await parseTelegramError(res) };
}

export async function setChatPhotoFromUrl(
  token: string,
  chatId: string,
  photoUrl: string
): Promise<TelegramApiResult> {
  const res = await telegramApi("setChatPhoto", token, {
    chat_id: chatId,
    photo: photoUrl,
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: await parseTelegramError(res) };
}

export const BOT_COMMANDS = [
  { command: "start", description: "Menu principale MushroomRadar" },
  { command: "menu", description: "Apri menu zone e report" },
  { command: "zona", description: "Scegli zona di raccolta" },
  { command: "live", description: "Score live oggi (soglia 70%)" },
  { command: "previsioni", description: "Previsioni da X a Y giorni" },
  { command: "clima", description: "Alert climatici sulla zona" },
  { command: "iscriviti", description: "Ricevi aggiornamenti automatici" },
  { command: "radar", description: "Apri mappa live sul sito" },
  { command: "aiuto", description: "Guida comandi bot" },
];

export const REGIONS: FungalZone["region"][] = [
  "matese",
  "taburno",
  "sannio",
  "molise",
  "campania",
  "basilicata",
];

export const REGION_LABELS: Record<FungalZone["region"], string> = {
  matese: "Matese",
  taburno: "Taburno",
  sannio: "Sannio",
  molise: "Molise",
  campania: "Campania",
  basilicata: "Basilicata",
};
