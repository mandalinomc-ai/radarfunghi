import {
  answerCallbackQuery,
  editTelegramMessage,
  REGION_LABELS,
  sendTelegramMessage,
} from "@/lib/telegramBot";
import {
  climateReport,
  forecastMenuKeyboard,
  forecastRangeReport,
  getZoneById,
  helpText,
  liveScoreReport,
  mainMenuKeyboard,
  mainMenuText,
  parseForecastArgs,
  regionPickerKeyboard,
  zonePickerKeyboard,
} from "@/lib/telegramBotEngine";
import {
  getUserPrefs,
  setZone,
  toggleSubscribe,
} from "@/lib/telegramUserStore";
import type { FungalZone } from "@/lib/types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

export interface TelegramMessage {
  message_id?: number;
  chat: { id: number; type?: string };
  text?: string;
  location?: { latitude: number; longitude: number };
  photo?: { file_id: string; file_size?: number }[];
}

export interface TelegramCallbackQuery {
  id: string;
  from: { id: number };
  message?: { message_id: number; chat: { id: number } };
  data?: string;
}

export interface TelegramUpdate {
  update_id?: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

async function sendMenu(token: string, chatId: string, zoneId: string | null) {
  await sendTelegramMessage(token, chatId, mainMenuText(zoneId), {
    replyMarkup: mainMenuKeyboard(zoneId),
  });
}

async function requireZone(
  token: string,
  chatId: string,
  zoneId: string | null
): Promise<FungalZone | null> {
  if (!zoneId) {
    await sendTelegramMessage(
      token,
      chatId,
      "Seleziona prima una *zona* con il pulsante sotto o /zona",
      { replyMarkup: regionPickerKeyboard() }
    );
    return null;
  }
  const zone = getZoneById(zoneId);
  if (!zone) {
    await sendTelegramMessage(token, chatId, "Zona non trovata. Riprova con /zona");
    return null;
  }
  return zone;
}

export async function handleCallbackQuery(
  token: string,
  query: TelegramCallbackQuery
): Promise<void> {
  const data = query.data ?? "";
  const chatId = String(query.message?.chat.id ?? query.from.id);
  const messageId = query.message?.message_id;
  const prefs = await getUserPrefs(chatId);

  await answerCallbackQuery(token, query.id);

  const edit = async (text: string, keyboard?: ReturnType<typeof mainMenuKeyboard>) => {
    if (messageId) {
      const r = await editTelegramMessage(token, chatId, messageId, text, keyboard);
      if (!r.ok) {
        await sendTelegramMessage(token, chatId, text, { replyMarkup: keyboard });
      }
    } else {
      await sendTelegramMessage(token, chatId, text, { replyMarkup: keyboard });
    }
  };

  if (data === "menu") {
    await edit(mainMenuText(prefs.zoneId), mainMenuKeyboard(prefs.zoneId));
    return;
  }

  if (data === "pick:region") {
    await edit("*Scegli la regione:*", regionPickerKeyboard());
    return;
  }

  if (data === "need:zone") {
    await edit("📍 *Seleziona la zona* per il report:", regionPickerKeyboard());
    return;
  }

  if (data === "link:radar") {
    await sendTelegramMessage(token, chatId, `🗺️ Mappa live: ${APP_URL}`);
    return;
  }

  if (data === "sub:toggle") {
    const next = !prefs.subscribed;
    await toggleSubscribe(chatId, next);
  const zoneLine = prefs.zoneId
      ? `\nZona: *${getZoneById(prefs.zoneId)?.name ?? prefs.zoneId}*`
      : "\n_Seleziona una zona per report mirati._";
    await sendTelegramMessage(
      token,
      chatId,
      next
        ? `🔔 *Iscrizione attiva!* Riceverai aggiornamenti live (score ≥${prefs.minScore}%).${zoneLine}`
        : `🔕 Iscrizione disattivata.`,
      { replyMarkup: mainMenuKeyboard(prefs.zoneId) }
    );
    return;
  }

  if (data.startsWith("reg:")) {
    const [, region, pageStr] = data.split(":");
    const page = parseInt(pageStr ?? "0", 10) || 0;
    const r = region as FungalZone["region"];
    await edit(
      `*${REGION_LABELS[r] ?? r}* — scegli la zona:`,
      zonePickerKeyboard(r, page)
    );
    return;
  }

  if (data.startsWith("zn:")) {
    const zoneId = data.slice(3);
    const zone = getZoneById(zoneId);
    if (!zone) {
      await sendTelegramMessage(token, chatId, "Zona non valida.");
      return;
    }
    await setZone(chatId, zoneId);
    await edit(
      `✅ Zona impostata:\n*${zone.name}*\n\n${mainMenuText(zoneId)}`,
      mainMenuKeyboard(zoneId)
    );
    return;
  }

  if (data.startsWith("live:")) {
    const zoneId = data.slice(5);
    const zone = getZoneById(zoneId);
    if (!zone) return;
    await setZone(chatId, zoneId);
    await sendTelegramMessage(token, chatId, liveScoreReport(zone, prefs.minScore), {
      replyMarkup: mainMenuKeyboard(zoneId),
    });
    return;
  }

  if (data.startsWith("fcstmenu:")) {
    const zoneId = data.slice(9);
    await edit("*Scegli intervallo previsioni:*", forecastMenuKeyboard(zoneId));
    return;
  }

  if (data.startsWith("fcst:")) {
    const parts = data.split(":");
    const zoneId = parts[1];
    const from = parseInt(parts[2] ?? "0", 10);
    const to = parseInt(parts[3] ?? "7", 10);
    const zone = getZoneById(zoneId);
    if (!zone) return;
    await setZone(chatId, zoneId);
    await sendTelegramMessage(
      token,
      chatId,
      forecastRangeReport(zone, from, to),
      { replyMarkup: mainMenuKeyboard(zoneId) }
    );
    return;
  }

  if (data.startsWith("clim:")) {
    const zoneId = data.slice(5);
    const zone = getZoneById(zoneId);
    if (!zone) return;
    await setZone(chatId, zoneId);
    await sendTelegramMessage(token, chatId, climateReport(zone), {
      replyMarkup: mainMenuKeyboard(zoneId),
    });
    return;
  }
}

export async function handleTextCommand(
  token: string,
  chatId: string,
  rawText: string
): Promise<boolean> {
  const text = rawText.toLowerCase().trim();
  const prefs = await getUserPrefs(chatId);

  if (
    text.startsWith("/start") ||
    text.startsWith("/menu") ||
    text === "menu"
  ) {
    await sendMenu(token, chatId, prefs.zoneId);
    return true;
  }

  if (text.startsWith("/aiuto") || text.startsWith("/help")) {
    await sendTelegramMessage(token, chatId, helpText(), {
      replyMarkup: mainMenuKeyboard(prefs.zoneId),
    });
    return true;
  }

  if (text.startsWith("/zona") || text.startsWith("/zone")) {
    await sendTelegramMessage(token, chatId, "*Scegli la regione:*", {
      replyMarkup: regionPickerKeyboard(),
    });
    return true;
  }

  if (text.startsWith("/live") || text.startsWith("/score")) {
    const zone = await requireZone(token, chatId, prefs.zoneId);
    if (!zone) return true;
    await sendTelegramMessage(token, chatId, liveScoreReport(zone, prefs.minScore), {
      replyMarkup: mainMenuKeyboard(zone.id),
    });
    return true;
  }

  if (text.startsWith("/previsioni") || text.startsWith("/forecast")) {
    const zone = await requireZone(token, chatId, prefs.zoneId);
    if (!zone) return true;
    const range = parseForecastArgs(text);
    if (range) {
      await sendTelegramMessage(
        token,
        chatId,
        forecastRangeReport(zone, range.from, range.to),
        { replyMarkup: mainMenuKeyboard(zone.id) }
      );
    } else {
      await sendTelegramMessage(token, chatId, "*Scegli intervallo:*", {
        replyMarkup: forecastMenuKeyboard(zone.id),
      });
    }
    return true;
  }

  if (text.startsWith("/clima") || text.startsWith("/meteo")) {
    const zone = await requireZone(token, chatId, prefs.zoneId);
    if (!zone) return true;
    await sendTelegramMessage(token, chatId, climateReport(zone), {
      replyMarkup: mainMenuKeyboard(zone.id),
    });
    return true;
  }

  if (text.startsWith("/iscriviti") || text.startsWith("/subscribe")) {
    const on = !text.includes("off") && !text.includes("stop");
    await toggleSubscribe(chatId, on);
    await sendTelegramMessage(
      token,
      chatId,
      on
        ? `🔔 Iscrizione *attiva* (soglia ${prefs.minScore}%).\nUsa /zona per impostare l'area.`
        : "🔕 Iscrizione disattivata.",
      { replyMarkup: mainMenuKeyboard(prefs.zoneId) }
    );
    return true;
  }

  if (text.startsWith("/radar")) {
    await sendTelegramMessage(token, chatId, `🗺️ Mappa live: ${APP_URL}`);
    return true;
  }

  if (text.startsWith("/diario")) {
    await sendTelegramMessage(token, chatId, `📓 Diario: ${APP_URL}/diario`);
    return true;
  }

  if (text.startsWith("/canale")) {
    await sendTelegramMessage(
      token,
      chatId,
      `*Community MushroomRadar*\n\n` +
        `Gruppo: aggiungi @RADARFUNGHIBOT al gruppo\n` +
        `Canale: ${APP_URL}/telegram\n` +
        `Nel gruppo: /setalerts per allerte automatiche`
    );
    return true;
  }

  return false;
}
