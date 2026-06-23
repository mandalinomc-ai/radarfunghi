import { NextRequest, NextResponse } from "next/server";
import { BOT_COMMANDS } from "@/lib/telegramBot";
import { rateLimitResponse } from "@/lib/security/apiGuard";
import { checkRateLimit, clientIp } from "@/lib/security/rateLimit";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar-funghi.vercel.app";
const PROJECT_ID = "prj_I9VhF367weNYQvfifrG8LYX3Oc1y";
const TEAM_ID = "team_nQtSCW2RnAFRRrbc6Rok6aFF";

const TOKEN_RE = /^\d{8,10}:[A-Za-z0-9_-]{30,}$/;

async function setVercelEnv(name: string, value: string) {
  const vercelToken = process.env.VERCEL_ACCESS_TOKEN?.trim();
  if (!vercelToken) return false;

  for (const target of ["production", "preview"] as const) {
    await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: name,
          value,
          type: "encrypted",
          target: [target],
        }),
      }
    );
  }
  return true;
}

/** Registrazione one-click token da pagina /telegram (rate-limited). */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`tg-register:${clientIp(req)}`, 5, 3600_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token || !TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Token non valido" }, { status: 400 });
  }

  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) =>
    r.json()
  );
  if (!me.ok) {
    return NextResponse.json({ error: "Token rifiutato da Telegram" }, { status: 400 });
  }

  const webhookUrl = `${APP_URL.replace(/\/$/, "")}/api/telegram/webhook`;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  const wh = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
      secret_token: webhookSecret || undefined,
      drop_pending_updates: true,
    }),
  }).then((r) => r.json());

  await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands: BOT_COMMANDS }),
  });

  const envOk = await setVercelEnv("TELEGRAM_BOT_TOKEN", token);

  return NextResponse.json({
    ok: wh.ok,
    bot: me.result.username,
    webhookConfigured: wh.ok,
    envPersisted: envOk,
    note: envOk
      ? "Bot attivo. Redeploy automatico in corso su Vercel."
      : "Webhook OK. Aggiungi TELEGRAM_BOT_TOKEN su Vercel per persistenza.",
  });
}
