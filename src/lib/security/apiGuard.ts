import { NextRequest, NextResponse } from "next/server";

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

/** Richiede Bearer CRON_SECRET — obbligatorio in produzione. */
export function requireCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");

  if (!secret) {
    if (isProduction()) {
      return NextResponse.json(
        { error: "CRON_SECRET non configurato" },
        { status: 503 }
      );
    }
    return null;
  }

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Verifica secret_token impostato su setWebhook Telegram. */
export function verifyTelegramWebhook(req: NextRequest): NextResponse | null {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!expected) {
    if (isProduction()) {
      return NextResponse.json(
        { error: "Webhook non configurato" },
        { status: 503 }
      );
    }
    return null;
  }

  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (header !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Troppe richieste. Riprova tra poco." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

/** Sanitizza testo utente (anti-injection markdown / overflow). */
export function sanitizeUserText(text: string, maxLen = 500): string {
  return text
    .slice(0, maxLen)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim();
}

export function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime.toLowerCase());
}

/** Max ~6 MB immagine in base64 */
export const MAX_IMAGE_BASE64_LEN = 8_000_000;
