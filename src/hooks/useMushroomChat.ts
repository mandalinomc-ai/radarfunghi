"use client";

import { useCallback, useRef, useState } from "react";
import { chatWithMastro } from "@/app/actions/mastroFungaiolo";
import {
  answerMushroomQuestion,
  parseMushroomQuestion,
  type MushroomChatContext,
  type ChatZoneResult,
} from "@/lib/mushroomChatEngine";
import { collectChatResultsFromHotspots } from "@/lib/chatZoneResults";
import {
  mapHotspotsToMastroPayload,
} from "@/lib/mastroHotspotMapper";
import { formatHourRange } from "@/lib/timeRange";
import type { SocialCitationSummary } from "@/lib/socialEvidence";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: ChatZoneResult[];
  timestamp: number;
  poweredBy?: "gemini" | "radar";
  recommendedZoneId?: string | null;
  socialEvidence?: SocialCitationSummary[];
}

export interface UseMushroomChatOptions {
  onRecommendedZone?: (zoneId: string) => void;
}

const OFFLINE_MARKERS = ["orecchie tappate", "sensori del bosco"];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isOfflineMastroReply(text: string): boolean {
  return OFFLINE_MARKERS.some((m) => text.includes(m));
}

function resolveRecommendedZoneId(
  geminiId: string | null | undefined,
  results: ChatZoneResult[]
): string | null {
  if (results.length === 0) return null;
  if (geminiId && results.some((r) => r.zoneId === geminiId)) return geminiId;
  return results[0].zoneId;
}

/** Unisce risposta Gemini con calcoli Sprout Score (fonte unica per % e zone). */
function mergeAssistantContent(
  geminiReply: string | null,
  radarText: string,
  resultCount: number,
  liveNote: string
): string {
  if (!geminiReply) return `${radarText}${liveNote}`;

  const radarBlock =
    resultCount > 0
      ? `\n\n---\n📊 **Zone verificate dal radar** (stessi dati della mappa — ${resultCount} risultati)`
      : "";

  return `${geminiReply.trim()}${radarBlock}${liveNote}`;
}

function buildLiveNote(context: MushroomChatContext): string {
  return context.liveData && context.lastUpdate
    ? `\n\n_Meteo live · aggiornato ${new Date(context.lastUpdate).toLocaleString("it-IT")}_`
    : "\n\n_Ultimi dati meteo disponibili_";
}

export function useMushroomChat(
  context: MushroomChatContext,
  options?: UseMushroomChatOptions
) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Salve, uagliò! Sono il **Mastro Fungaiolo** 🍄 — leggo Sprout Score live, meteo ARPA e **segnalazioni social con autore e link**. Chiedimi: «Cerca entro 60 km da te porcini» oppure «Dove trovo estatini domani?»",
      timestamp: Date.now(),
      poweredBy: "radar",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const sendingRef = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;

      sendingRef.current = true;
      setLoading(true);

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const liveNote = buildLiveNote(context);

      try {
        const radarAnswer = await answerMushroomQuestion(trimmed, context);
        const parsed = parseMushroomQuestion(trimmed, context.defaultRangeKm);

        const mapAlignedResults =
          parsed.rangeKm === context.defaultRangeKm &&
          parsed.date === context.criteria.selectedDate &&
          (parsed.species === "all" || parsed.species === context.criteria.species)
            ? collectChatResultsFromHotspots(
                context.hotspots,
                parsed.species,
                parsed.date,
                parsed.minScore,
                parsed.intent === "best" ? 3 : 5
              )
            : [];

        const results =
          mapAlignedResults.length > 0
            ? mapAlignedResults
            : radarAnswer.results.slice(0, parsed.intent === "best" ? 3 : 5);

        const mastroPayloads = mapHotspotsToMastroPayload(
          context.hotspots,
          context.criteria.hourRange
        );
        const meta = {
          originName: context.criteria.origin.name,
          selectedDate: parsed.date,
          hourRangeLabel: formatHourRange(context.criteria.hourRange),
          rangeKm: radarAnswer.rangeUsed,
          liveData: context.liveData,
          lastUpdate: context.lastUpdate,
          speciesFilter:
            parsed.species === "all"
              ? context.criteria.species
              : parsed.species,
        };

        const mastro = await chatWithMastro(trimmed, mastroPayloads, meta);

        if ("ok" in mastro && mastro.ok === false) {
          const prefix =
            mastro.code === "NOT_CONFIGURED"
              ? ""
              : `⚠ ${mastro.error}\n\n`;
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: `${prefix}${radarAnswer.text}${liveNote}`,
              results,
              timestamp: Date.now(),
              poweredBy: "radar",
              recommendedZoneId: results[0]?.zoneId ?? null,
            },
          ]);
          if (results[0]?.zoneId) {
            options?.onRecommendedZone?.(results[0].zoneId);
          }
          return;
        }

        const reply = mastro.reply;
        const socialEvidence =
          "ok" in mastro && mastro.ok === true ? mastro.socialEvidence : undefined;

        if (isOfflineMastroReply(reply)) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: `${reply}\n\n${radarAnswer.text}${liveNote}`,
              results,
              timestamp: Date.now(),
              poweredBy: "radar",
              recommendedZoneId: results[0]?.zoneId ?? null,
            },
          ]);
          if (results[0]?.zoneId) {
            options?.onRecommendedZone?.(results[0].zoneId);
          }
          return;
        }

        const recommendedId = resolveRecommendedZoneId(
          "ok" in mastro && mastro.ok ? mastro.recommendedHotspotId : null,
          results
        );

        if (recommendedId) {
          options?.onRecommendedZone?.(recommendedId);
        }

        const content = mergeAssistantContent(
          reply,
          radarAnswer.text,
          results.length,
          liveNote
        );

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content,
            results,
            timestamp: Date.now(),
            poweredBy: "gemini",
            recommendedZoneId: recommendedId,
            socialEvidence,
          },
        ]);
      } catch {
        try {
          const radarAnswer = await answerMushroomQuestion(trimmed, context);
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content: `${radarAnswer.text}${liveNote}`,
              results: radarAnswer.results.slice(0, 5),
              timestamp: Date.now(),
              poweredBy: "radar",
              recommendedZoneId: radarAnswer.results[0]?.zoneId ?? null,
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content:
                "Errore nell'analisi. Riprova tra poco o verifica la connessione.",
              timestamp: Date.now(),
            },
          ]);
        }
      } finally {
        sendingRef.current = false;
        setLoading(false);
      }
    },
    [context, options]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Chat azzerata. Prova: «Cerca entro 60 km da te porcini» — uso gli stessi Sprout Score della mappa.",
        timestamp: Date.now(),
        poweredBy: "radar",
      },
    ]);
  }, []);

  return { messages, loading, sendMessage, clearChat };
}
