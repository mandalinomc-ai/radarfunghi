import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegramBot";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { buildHotspots, calculateSproutScore } from "@/lib/predictionEngine";
import { getHoursInRange } from "@/lib/timeRange";
import { todayISO } from "@/lib/dateUtils";
import { distanceFromPoint } from "@/lib/geoUtils";
import { classifyMushroomImage } from "@/lib/mushroomClassifier";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    location?: { latitude: number; longitude: number };
    photo?: { file_id: string }[];
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
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "No bot token" }, { status: 503 });
  }

  const update = (await req.json()) as TelegramUpdate;
  const msg = update.message;
  if (!msg?.chat?.id) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);

  if (msg.location) {
    const text = scoreReportForZone(msg.location.latitude, msg.location.longitude);
    await sendTelegramMessage(token, chatId, text);
    return NextResponse.json({ ok: true });
  }

  if (msg.photo?.length) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );
    const fileJson = (await fileRes.json()) as {
      result?: { file_path?: string };
    };
    const path = fileJson.result?.file_path;
    if (path) {
      const imgRes = await fetch(
        `https://api.telegram.org/file/bot${token}/${path}`
      );
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const b64 = buf.toString("base64");
      const result = await classifyMushroomImage(b64, "image/jpeg");
      const plan = result.actionPlan.map((p) => `• ${p}`).join("\n");
      await sendTelegramMessage(
        token,
        chatId,
        `*${result.commonName}* (\`${result.scientificName}\`)\n` +
          `Commestibilità: *${result.edibility}* (${result.confidence}%)\n\n` +
          `${plan}\n\n_${result.legalDisclaimer}_`
      );
    }
    return NextResponse.json({ ok: true });
  }

  const text = (msg.text ?? "").trim().toLowerCase();

  if (text.startsWith("/start") || text.startsWith("/aiuto")) {
    await sendTelegramMessage(
      token,
      chatId,
      `*MushroomRadar Bot* 🍄\n\n` +
        `/radar — mappa live\n` +
        `/diario — registro raccolti\n` +
        `Invia *posizione GPS* per report Sprout Score\n` +
        `Invia *foto* per identificazione (non sostituisce micologo)\n\n` +
        `_Uso educativo. Raccolta responsabile._`
    );
  } else if (text.startsWith("/radar")) {
    await sendTelegramMessage(
      token,
      chatId,
      `Mappa live: ${APP_URL}`
    );
  } else if (text.startsWith("/diario")) {
    await sendTelegramMessage(
      token,
      chatId,
      `Diario Pro (IndexedDB locale): ${APP_URL}/diario`
    );
  } else {
    await sendTelegramMessage(
      token,
      chatId,
      "Comandi: /start /radar /diario /aiuto — oppure invia GPS o foto fungo."
    );
  }

  return NextResponse.json({ ok: true });
}
