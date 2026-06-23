import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegramBot";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { buildHotspots, calculateSproutScore } from "@/lib/predictionEngine";
import { getHoursInRange } from "@/lib/timeRange";
import { todayISO } from "@/lib/dateUtils";
import { distanceFromPoint } from "@/lib/geoUtils";
import { classifyMushroomImage } from "@/lib/mushroomClassifier";
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

interface TelegramUpdate {
  update_id?: number;
  message?: {
    chat: { id: number };
    text?: string;
    location?: { latitude: number; longitude: number };
    photo?: { file_id: string; file_size?: number }[];
  };
}

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

function scoreReportForZone(lat: number, lng: number): string {
  const zone = nearestZone(lat, lng);
  const date = todayISO();
  const hourRange = { startHour: 6, endHour: 10 };
  const hotspots = buildHotspots([zone], "all", hourRange, date);
  const h = hotspots[0];
  const horizons = [10, 14, 20].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const iso = d.toISOString().slice(0, 10);
    const hours = getHoursInRange(hourRange);
    const scores = hours.flatMap((hour) =>
      zone.species.map((sp) => calculateSproutScore(zone, sp, hour, iso).score)
    );
    const max = Math.max(...scores, 0);
    return `+${offset}g: ${max}%`;
  });

  return (
    `*Report GPS* 📍\n` +
    `Zona: *${zone.name}* (${zone.region})\n` +
    `Score oggi: *${h?.activeScore ?? 0}%* (${h?.activeSpecies ?? "—"})\n` +
    `Trend: ${horizons.join(" · ")}\n` +
    `[Apri mappa](${APP_URL})`
  );
}

export async function POST(req: NextRequest) {
  const webhookBlock = verifyTelegramWebhook(req);
  if (webhookBlock) return webhookBlock;

  const rl = checkRateLimit(`tg-webhook:${clientIp(req)}`, 30, 60_000);
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

  if (!update.message) return NextResponse.json({ ok: true });

  const msg = update.message;
  if (!msg.chat?.id) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);

  if (msg.location) {
    const { latitude, longitude } = msg.location;
    if (!isValidCoord(latitude, longitude)) {
      return NextResponse.json({ ok: true });
    }
    const text = scoreReportForZone(latitude, longitude);
    const sent = await sendTelegramMessage(token, chatId, text);
    if (!sent.ok) {
      console.error("[telegram/webhook] sendMessage GPS:", sent.error);
    }
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

  const text = sanitizeUserText((msg.text ?? "").toLowerCase(), 200);

  if (text.startsWith("/start") || text.startsWith("/aiuto")) {
    const sent = await sendTelegramMessage(
      token,
      chatId,
      `*MushroomRadar Bot* 🍄\n\n` +
        `*Unisciti alla community:*\n` +
        `• Bot: @RADARFUNGHIBOT\n` +
        `• Gruppo: aggiungi il bot al gruppo (link startgroup)\n` +
        `• Canale: segui gli aggiornamenti su ${APP_URL}/telegram\n\n` +
        `/radar — mappa live\n` +
        `/diario — registro raccolti\n` +
        `Invia *posizione GPS* per report Sprout Score\n` +
        `Invia *foto* per identificazione (non sostituisce micologo)\n\n` +
        `_Uso educativo. Raccolta responsabile._`
    );
    if (!sent.ok) console.error("[telegram/webhook] /start:", sent.error);
  } else if (text.startsWith("/canale") || text === "canale") {
    const sent = await sendTelegramMessage(
      token,
      chatId,
      `*Canale aggiornamenti MushroomRadar*\n\n` +
        `Segui il sito per allerte score ≥80%:\n${APP_URL}\n\n` +
        `Per creare il canale ufficiale: aggiungi @RADARFUNGHIBOT come admin del canale e invia /setalerts nel gruppo Pro.`
    );
  } else if (text.startsWith("/setalerts")) {
    const chatType = (update.message as { chat?: { type?: string; id?: number; title?: string } })
      ?.chat?.type;
    const rawChatId = (update.message as { chat?: { id?: number } })?.chat?.id;
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
          `Le allerte score ≥80% arriveranno qui via cron giornaliero.`
      );
    } else {
      await sendTelegramMessage(
        token,
        chatId,
        "Usa /setalerts *dentro* il gruppo o canale Pro dove vuoi ricevere le allerte."
      );
    }
  } else if (text.startsWith("/radar")) {
    await sendTelegramMessage(token, chatId, `Mappa live: ${APP_URL}`);
  } else if (text.startsWith("/diario")) {
    await sendTelegramMessage(
      token,
      chatId,
      `Diario Pro (IndexedDB locale): ${APP_URL}/diario`
    );
  } else if (text.length > 0) {
    await sendTelegramMessage(
      token,
      chatId,
      "Comandi: /start /radar /diario /aiuto — oppure invia GPS o foto fungo."
    );
  }

  return NextResponse.json({ ok: true });
}
