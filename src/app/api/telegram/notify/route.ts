import { NextRequest, NextResponse } from "next/server";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { buildHotspots } from "@/lib/predictionEngine";
import { sendTelegramMessage } from "@/lib/telegramBot";
import {
  getZoneById,
  liveScoreReport,
} from "@/lib/telegramBotEngine";
import { listSubscribers } from "@/lib/telegramUserStore";
import { todayISO } from "@/lib/dateUtils";
import { requireCronAuth } from "@/lib/security/apiGuard";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

const MIN_SCORE = Number(process.env.TELEGRAM_ALERT_MIN_SCORE ?? "70") || 70;

const prevScores = new Map<string, number>();

export async function GET(req: NextRequest) {
  const authBlock = requireCronAuth(req);
  if (authBlock) return authBlock;

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const groupId = process.env.TELEGRAM_GROUP_CHAT_ID?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Telegram non configurato" },
      { status: 503 }
    );
  }

  const date = todayISO();
  const hourRange = { startHour: 6, endHour: 10 };
  const hotspots = buildHotspots(FUNGAL_ZONES, "all", hourRange, date);
  const alerts: string[] = [];
  let groupSent = 0;
  let userSent = 0;

  for (const h of hotspots) {
    const prev = prevScores.get(h.zone.id) ?? 0;
    const now = h.activeScore;
    prevScores.set(h.zone.id, now);

    if (prev < MIN_SCORE && now >= MIN_SCORE) {
      alerts.push(
        `🚨 *${h.zone.name}*\n` +
          `Score *${now}%* · ${h.activeSpecies}\n` +
          `[Apri radar](${APP_URL}/radar)`
      );
    }
  }

  if (groupId && alerts.length > 0) {
    const digest =
      `*MushroomRadar — Allerte live* 📡\n` +
      `Score ≥${MIN_SCORE}% · ${date}\n\n` +
      alerts.join("\n\n");
    const r = await sendTelegramMessage(token, groupId, digest);
    if (r.ok) groupSent = 1;
  }

  const subscribers = await listSubscribers();
  for (const sub of subscribers) {
    const zone = sub.zoneId ? getZoneById(sub.zoneId) : null;
    if (!zone) continue;
    const hotspot = hotspots.find((h) => h.zone.id === zone.id);
    const score = hotspot?.activeScore ?? 0;
    if (score < sub.minScore) continue;
    const text = liveScoreReport(zone, sub.minScore);
    const r = await sendTelegramMessage(token, sub.chatId, text);
    if (r.ok) userSent++;
  }

  return NextResponse.json({
    ok: true,
    minScore: MIN_SCORE,
    zoneAlerts: alerts.length,
    groupMessages: groupSent,
    subscriberMessages: userSent,
    subscribers: subscribers.length,
    checked: hotspots.length,
  });
}
