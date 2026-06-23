import { NextRequest, NextResponse } from "next/server";
import { BOT_COMMANDS, sendTelegramMessage } from "@/lib/telegramBot";
import { requireCronAuth } from "@/lib/security/apiGuard";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

export async function POST(req: NextRequest) {
  const authBlock = requireCronAuth(req);
  if (authBlock) return authBlock;

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN non configurato su Vercel" },
      { status: 503 }
    );
  }

  const webhookUrl = `${APP_URL.replace(/\/$/, "")}/api/telegram/webhook`;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  const wh = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message"],
      secret_token: webhookSecret || undefined,
      drop_pending_updates: true,
    }),
  }).then((r) => r.json());

  const cmds = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands: BOT_COMMANDS }),
  }).then((r) => r.json());

  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) =>
    r.json()
  );

  const groupId = process.env.TELEGRAM_GROUP_CHAT_ID?.trim();
  if (groupId && me.ok) {
    await sendTelegramMessage(
      token,
      groupId,
      `✅ *MushroomRadar Bot* online\nWebhook protetto con secret token.`
    ).catch(() => null);
  }

  return NextResponse.json({
    ok: wh.ok && cmds.ok,
    webhook: { ok: wh.ok },
    commands: { ok: cmds.ok },
    bot: me.ok ? `@${me.result.username}` : null,
  });
}

export async function GET(req: NextRequest) {
  const authBlock = requireCronAuth(req);
  if (authBlock) return authBlock;

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ configured: false });
  }

  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) =>
    r.json()
  );
  const wh = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`
  ).then((r) => r.json());

  return NextResponse.json({
    configured: true,
    bot: me.ok ? { username: me.result.username } : null,
    webhook: wh.ok
      ? {
          url: wh.result.url,
          hasCustomCertificate: wh.result.has_custom_certificate,
          pendingUpdateCount: wh.result.pending_update_count,
        }
      : null,
  });
}
