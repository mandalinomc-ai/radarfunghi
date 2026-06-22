"use server";

import {
  generateMastroFungaioloReply,
  isGeminiChatConfigured,
  type GeminiChatContextMeta,
} from "@/lib/geminiChatConfig";
import { enrichMastroReplyWithSocialEvidence } from "@/lib/socialEvidence";
import type { SocialCitationSummary } from "@/lib/socialEvidence";
import type { MastroChatResponse } from "@/lib/mastroTypes";
import type { MastroHotspotPayload } from "@/lib/mastroHotspotMapper";

export type { MastroHotspotPayload, MastroChatResponse };

export type MastroFungaioloActionResult =
  | {
      ok: true;
      reply: string;
      recommendedHotspotId: string | null;
      model: string;
      hotspotCount: number;
      socialEvidence: SocialCitationSummary[];
    }
  | {
      ok: false;
      error: string;
      code: "NOT_CONFIGURED" | "VALIDATION";
    };

const MASTRO_OFFLINE_REPLY =
  "Scusami uagliò, in questo momento ho le orecchie tappate e non riesco a connettermi con i sensori del bosco. Riprova tra un attimo e ti dirò dove andare!";

/**
 * Server Action principale — Mastro Fungaiolo AI (Google Gen AI SDK).
 * Basata su mastro_fungaiolo_gemini_server_action.ts con payload live MushroomRadar.
 */
export async function chatWithMastro(
  userMessage: string,
  hotspots: MastroHotspotPayload[],
  meta: GeminiChatContextMeta
): Promise<MastroFungaioloActionResult | MastroChatResponse> {
  const trimmed = userMessage.trim();

  if (!trimmed) {
    return {
      ok: false,
      error: "Inserisci una domanda sul foraging.",
      code: "VALIDATION",
    };
  }

  if (trimmed.length > 2000) {
    return {
      ok: false,
      error: "Messaggio troppo lungo (max 2000 caratteri).",
      code: "VALIDATION",
    };
  }

  if (!Array.isArray(hotspots)) {
    return {
      ok: false,
      error: "Stato zone non valido.",
      code: "VALIDATION",
    };
  }

  if (!isGeminiChatConfigured()) {
    return {
      ok: false,
      error: "GEMINI_API_KEY non configurata sul server.",
      code: "NOT_CONFIGURED",
    };
  }

  try {
    const result = await generateMastroFungaioloReply(
      trimmed,
      hotspots,
      meta
    );

    const regions = [
      ...new Set(hotspots.map((h) => h.region)),
    ];
    const enriched = enrichMastroReplyWithSocialEvidence(
      result.reply,
      regions,
      meta.speciesFilter
    );

    return {
      ok: true,
      reply: enriched.reply,
      recommendedHotspotId: result.recommendedHotspotId,
      model: result.model,
      hotspotCount: result.hotspotCount,
      socialEvidence: enriched.socialEvidence,
    };
  } catch {
    return {
      reply: MASTRO_OFFLINE_REPLY,
      recommendedHotspotId: null,
    };
  }
}
