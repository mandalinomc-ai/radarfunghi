import { NextRequest, NextResponse } from "next/server";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { buildHotspots } from "@/lib/predictionEngine";
import { sendTelegramMessage } from "@/lib/telegramBot";
import { todayISO } from "@/lib/dateUtils";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

/** Stato precedente score per zona (in-memory — reset ad ogni cold start) */
const prevScores = new Map<string, number>();

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const groupId = process.env.TELEGRAM_GROUP_CHAT_ID?.trim();
  if (!token || !groupId) {
    return NextResponse.json(
      { ok: false, error: "Telegram non configurato" },
      { status: 503 }
    );
  }

  const date = todayISO();
  const hourRange = { startHour: 6, endHour: 10 };
  const hotspots = buildHotspots(FUNGAL_ZONES, "all", hourRange, date);
  const alerts: string[] = [];

  for (const h of hotspots) {
    const prev = prevScores.get(h.zone.id) ?? 0;
    const now = h.activeScore;
    prevScores.set(h.zone.id, now);

    if (prev < 80 && now >= 80) {
      alerts.push(
        `🚨 *${h.zone.name}* (${h.zone.region})\n` +
          `Score *${now}%* · ${h.activeSpecies}\n` +
          `[Apri radar](${APP_URL}/radar)`
      );
    }
  }

  for (const text of alerts) {
    await sendTelegramMessage(token, groupId, text);
  }

  return NextResponse.json({
    ok: true,
    alertsSent: alerts.length,
    checked: hotspots.length,
  });
}
