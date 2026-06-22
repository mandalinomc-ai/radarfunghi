"use server";

import {
  isGeminiChatConfigured,
  type GeminiChatContextMeta,
} from "@/lib/geminiChatConfig";
import {
  chatWithMastro,
  type MastroFungaioloActionResult,
} from "./mastroFungaiolo";
import type { MastroHotspotPayload } from "@/lib/mastroHotspotMapper";

export type GeminiForagingActionResult =
  | {
      ok: true;
      reply: string;
      model: string;
      hotspotCount: number;
      recommendedHotspotId: string | null;
    }
  | {
      ok: false;
      error: string;
      code: "NOT_CONFIGURED" | "VALIDATION" | "GEMINI_ERROR";
    };

/** Retrocompatibilità — delega al Mastro Fungaiolo */
export async function askGeminiForagingAssistant(
  message: string,
  hotspots: MastroHotspotPayload[],
  meta: GeminiChatContextMeta
): Promise<GeminiForagingActionResult> {
  const result = await chatWithMastro(message, hotspots, meta);

  if ("ok" in result && result.ok === false) {
    return result;
  }

  if ("ok" in result && result.ok === true) {
    return {
      ok: true,
      reply: result.reply,
      model: result.model,
      hotspotCount: result.hotspotCount,
      recommendedHotspotId: result.recommendedHotspotId,
    };
  }

  if (!isGeminiChatConfigured()) {
    return {
      ok: false,
      error: "GEMINI_API_KEY non configurata sul server.",
      code: "NOT_CONFIGURED",
    };
  }

  return {
    ok: true,
    reply: result.reply,
    model: "gemini",
    hotspotCount: hotspots.length,
    recommendedHotspotId: result.recommendedHotspotId,
  };
}

export { chatWithMastro, type MastroFungaioloActionResult };
