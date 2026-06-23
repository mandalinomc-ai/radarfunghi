import { NextRequest, NextResponse } from "next/server";
import { BOT_COMMANDS, sendTelegramMessage } from "@/lib/telegramBot";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";

/** Configura webhook/comandi se TELEGRAM_BOT_TOKEN è presente (protetto da CRON_SECRET). */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN non configurato su Vercel" },
      { status: 503 }
    );
  }

  const webhookUrl = `${APP_URL.replace(/\/$/, "")}/api/telegram/webhook`;

  const wh = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
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
      `✅ *MushroomRadar Bot* online\nWebhook: ${webhookUrl}\nBot: @${me.result.username}`
    ).catch(() => null);
  }

  return NextResponse.json({
    ok: wh.ok && cmds.ok,
    webhook: wh,
    commands: cmds,
    bot: me.ok ? `@${me.result.username}` : null,
  });
}

export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({
      configured: false,
      botFather: "https://t.me/BotFather?start=newbot",
      hint: "Aggiungi TELEGRAM_BOT_TOKEN su Vercel poi POST /api/telegram/setup con Bearer CRON_SECRET",
    });
  }
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) =>
    r.json()
  );
  const wh = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`
  ).then((r) => r.json());
  return NextResponse.json({
    configured: true,
    bot: me.ok ? me.result : null,
    webhook: wh.result,
  });
}
