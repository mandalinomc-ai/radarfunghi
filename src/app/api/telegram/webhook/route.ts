import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegramBot";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { distanceFromPoint } from "@/lib/geoUtils";
import { classifyMushroomImage } from "@/lib/mushroomClassifier";
import {
  handleCallbackQuery,
  handleTextCommand,
  type TelegramUpdate,
} from "@/lib/telegramWebhookHandler";
import { liveScoreReport } from "@/lib/telegramBotEngine";
import { setZone } from "@/lib/telegramUserStore";
import {
  isValidCoord,
  rateLimitResponse,
  sanitizeUserText,
  verifyTelegramWebhook,
} from "@/lib/security/apiGuard";
import { checkRateLimit, clientIp } from "@/lib/security/rateLimit";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function nearestZone(lat: number, lng: number) {
  let best = FUNGAL_ZONES[0];
  let bestD = Infinity;
  for (const z of FUNGAL_ZONES) {
    const d = distanceFromPoint(
      { lat, lng, name: "GPS" },
      z.lat,
      z.lng
    ).roadKm;
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return best;
}

function scoreReportForGps(lat: number, lng: number): string {
  const zone = nearestZone(lat, lng);
  return `*Report GPS* 📍\nZona più vicina impostata.\n\n${liveScoreReport(zone, 70)}`;
}
export async function POST(req: NextRequest) {
  const webhookBlock = verifyTelegramWebhook(req);
  if (webhookBlock) return webhookBlock;

  const rl = checkRateLimit(`tg-webhook:${clientIp(req)}`, 40, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "No bot token" }, { status: 503 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (update.callback_query) {
    try {
      await handleCallbackQuery(token, update.callback_query);
    } catch (e) {
      console.error("[telegram/webhook] callback:", e);
    }
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  if (!msg?.chat?.id) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);

  if (msg.location) {
    const { latitude, longitude } = msg.location;
    if (!isValidCoord(latitude, longitude)) {
      return NextResponse.json({ ok: true });
    }
    const zone = nearestZone(latitude, longitude);
    await setZone(chatId, zone.id);
    const text = scoreReportForGps(latitude, longitude);
    const sent = await sendTelegramMessage(token, chatId, text);
    if (!sent.ok) console.error("[telegram/webhook] GPS:", sent.error);
    return NextResponse.json({ ok: true });
  }

  if (msg.photo?.length) {
    const photo = msg.photo[msg.photo.length - 1];
    if (photo.file_size && photo.file_size > MAX_PHOTO_BYTES) {
      await sendTelegramMessage(
        token,
        chatId,
        "Foto troppo grande (max 5 MB). Invia un'immagine più leggera."
      );
      return NextResponse.json({ ok: true });
    }

    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(photo.file_id)}`
    );
    const fileJson = (await fileRes.json()) as {
      result?: { file_path?: string; file_size?: number };
    };
    const path = fileJson.result?.file_path;
    if (!path || path.includes("..")) {
      return NextResponse.json({ ok: true });
    }

    if (fileJson.result?.file_size && fileJson.result.file_size > MAX_PHOTO_BYTES) {
      await sendTelegramMessage(token, chatId, "Foto troppo grande (max 5 MB).");
      return NextResponse.json({ ok: true });
    }

    const imgRes = await fetch(
      `https://api.telegram.org/file/bot${token}/${path}`
    );
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.byteLength > MAX_PHOTO_BYTES) {
      return NextResponse.json({ ok: true });
    }

    const b64 = buf.toString("base64");
    const result = await classifyMushroomImage(b64, "image/jpeg");
    const plan = result.actionPlan.map((p) => `• ${sanitizeUserText(p, 200)}`).join("\n");
    await sendTelegramMessage(
      token,
      chatId,
      `*${sanitizeUserText(result.commonName, 80)}* (\`${sanitizeUserText(result.scientificName, 80)}\`)\n` +
        `Commestibilità: *${result.edibility}* (${result.confidence}%)\n\n` +
        `${plan}\n\n_${result.legalDisclaimer}_`
    );
    return NextResponse.json({ ok: true });
  }

  const rawText = msg.text ?? "";
  const text = sanitizeUserText(rawText.toLowerCase(), 300);

  if (text.startsWith("/setalerts")) {
    const chatType = msg.chat.type;
    const rawChatId = msg.chat.id;
    if (
      rawChatId &&
      (chatType === "group" || chatType === "supergroup" || chatType === "channel")
    ) {
      await sendTelegramMessage(
        token,
        chatId,
        `*Allerte Pro registrate* 🚨\n` +
          `Chat ID: \`${rawChatId}\`\n` +
          `Aggiungi su Vercel:\nTELEGRAM_GROUP_CHAT_ID=${rawChatId}\n\n` +
          `Allerte score ≥70% via cron giornaliero.`
      );
    } else {
      await sendTelegramMessage(
        token,
        chatId,
        "Usa /setalerts *dentro* il gruppo o canale dove vuoi le allerte."
      );
    }
    return NextResponse.json({ ok: true });
  }

  const handled = await handleTextCommand(token, chatId, rawText);
  if (!handled && text.length > 0) {
    const { getUserPrefs } = await import("@/lib/telegramUserStore");
    const { mainMenuKeyboard } = await import("@/lib/telegramBotEngine");
    const prefs = await getUserPrefs(chatId);
    await sendTelegramMessage(
      token,
      chatId,
      "Comandi: /menu /zona /live /previsioni /clima /iscriviti\nOppure invia GPS o foto fungo.",
      { replyMarkup: mainMenuKeyboard(prefs.zoneId) }
    );
  }

  return NextResponse.json({ ok: true });
}
