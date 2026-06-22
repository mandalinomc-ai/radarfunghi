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
import { mapHotspotsToMastroPayload } from "@/lib/mastroHotspotMapper";
import { formatHourRange } from "@/lib/timeRange";
import {
  answerFollowUpLocally,
  detectFollowUp,
  formatConversationForGemini,
  formatPriorResultsBlock,
} from "@/lib/chatFollowUp";
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
  geminiPending?: boolean;
  studyWindow?: string;
  dataAsOf?: string;
  isFollowUp?: boolean;
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

function buildStudyWindow(context: MushroomChatContext): string {
  return formatHourRange(context.criteria.hourRange);
}

function buildDataAsOf(context: MushroomChatContext): string | undefined {
  return context.lastUpdate ?? undefined;
}

function buildInstantRadarSummary(
  results: ChatZoneResult[],
  studyWindow: string,
  dataAsOf?: string
): string {
  if (results.length === 0) {
    return `**Studio radar** (fascia **${studyWindow}**): nessuna zona sopra la soglia con i filtri attuali. Prova ad ampliare il raggio o abbassare il filtro probabilità sulla mappa.\n\n_Mastro Fungaiolo sta elaborando il commento…_`;
  }
  const top = results[0];
  const asOf = dataAsOf
    ? new Date(dataAsOf).toLocaleString("it-IT", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "ultimo sync";
  return `**Studio radar** · fascia **${studyWindow}** · dati **${asOf}**\n\nMigliore zona ora: **${top.zoneName}** — **${top.score}%** (${top.speciesLabel}).\n\nLe schede sotto sono **identiche alla mappa**. Mastro Fungaiolo sta aggiungendo il commento…`;
}

function mergeAssistantContent(
  geminiReply: string | null,
  instantSummary: string,
  liveNote: string,
  isFollowUp: boolean,
  localFollowUpText?: string
): string {
  if (isFollowUp) {
    const base = localFollowUpText ?? "";
    if (!geminiReply) return `${base}${liveNote}`.trim();
    if (!base) return `${geminiReply.trim()}${liveNote}`;
    return `${base}\n\n${geminiReply.trim()}${liveNote}`;
  }
  if (!geminiReply) return `${instantSummary}${liveNote}`;
  return `${geminiReply.trim()}${liveNote}`;
}

function buildLiveNote(context: MushroomChatContext): string {
  return context.liveData && context.lastUpdate
    ? `\n\n_Studio calibrato su meteo live · ${new Date(context.lastUpdate).toLocaleString("it-IT")}_`
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
        "Salve, uagliò! Sono il **Mastro Fungaiolo** 🍄 — leggo gli **stessi Sprout Score della mappa**, nella **fascia oraria** che hai scelto. Puoi anche fare domande di seguito sulle zone che ti elenco.",
      timestamp: Date.now(),
      poweredBy: "radar",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const sendingRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const contextRef = useRef(context);
  contextRef.current = context;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;

      sendingRef.current = true;
      setLoading(true);

      const ctx = contextRef.current;
      const priorMessages = messagesRef.current;
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      const liveNote = buildLiveNote(ctx);
      const studyWindow = buildStudyWindow(ctx);
      const dataAsOf = buildDataAsOf(ctx);
      const parsed = parseMushroomQuestion(trimmed, ctx.defaultRangeKm);
      const resultMeta = { hourRangeLabel: studyWindow, dataAsOf };
      const limit = parsed.intent === "best" ? 3 : 5;

      const followUp = detectFollowUp(trimmed, [
        ...priorMessages,
        userMsg,
      ]);

      const dateAligned = parsed.date === ctx.criteria.selectedDate;
      let results: ChatZoneResult[] = [];
      let instantSummary = "";
      let localFollowUpText: string | undefined;
      const isFollowUp = Boolean(followUp);

      if (followUp) {
        const local = answerFollowUpLocally(
          followUp,
          ctx.hotspots,
          parsed.minScore
        );
        results = local.results;
        localFollowUpText = local.text;
        instantSummary = local.text;
      } else if (dateAligned && ctx.hotspots.length > 0) {
        results = collectChatResultsFromHotspots(
          ctx.hotspots,
          parsed.species,
          ctx.criteria.selectedDate,
          parsed.minScore,
          limit,
          resultMeta
        );
        instantSummary = buildInstantRadarSummary(
          results,
          studyWindow,
          dataAsOf
        );
      } else {
        try {
          const radarAnswer = await answerMushroomQuestion(trimmed, ctx);
          results = radarAnswer.results.slice(0, limit).map((r) => ({
            ...r,
            hourRangeLabel: studyWindow,
            dataAsOf,
          }));
          instantSummary = buildInstantRadarSummary(
            results,
            studyWindow,
            dataAsOf
          );
        } catch {
          results = [];
          instantSummary = buildInstantRadarSummary(
            results,
            studyWindow,
            dataAsOf
          );
        }
      }

      const radarMsgId = uid();

      setMessages((prev) => [
        ...prev,
        {
          id: radarMsgId,
          role: "assistant",
          content: instantSummary,
          results: results.length > 0 ? results : undefined,
          timestamp: Date.now(),
          poweredBy: "radar",
          geminiPending: true,
          studyWindow,
          dataAsOf,
          isFollowUp,
          recommendedZoneId: isFollowUp ? null : results[0]?.zoneId ?? null,
        },
      ]);

      setLoading(false);
      setGeminiLoading(true);

      if (!isFollowUp && results[0]?.zoneId) {
        options?.onRecommendedZone?.(results[0].zoneId);
      }

      try {
        const hotspotSource =
          followUp && followUp.priorResults.length > 0
            ? ctx.hotspots.filter((h) =>
                followUp.priorResults.some((r) => r.zoneId === h.zone.id)
              )
            : ctx.hotspots;

        const mastroPayloads = mapHotspotsToMastroPayload(
          hotspotSource.length > 0 ? hotspotSource : ctx.hotspots,
          ctx.criteria.hourRange,
          followUp ? 12 : 18
        );

        const historyForGemini = formatConversationForGemini([
          ...priorMessages,
          userMsg,
          {
            role: "assistant",
            content: instantSummary,
            results,
          },
        ]);

        const meta = {
          originName: ctx.criteria.origin.name,
          selectedDate: parsed.date,
          hourRangeLabel: studyWindow,
          rangeKm: ctx.defaultRangeKm,
          liveData: ctx.liveData,
          lastUpdate: ctx.lastUpdate,
          speciesFilter:
            parsed.species === "all"
              ? ctx.criteria.species
              : parsed.species,
          conversationHistory: historyForGemini.slice(0, -1),
          priorResultsBlock: followUp
            ? formatPriorResultsBlock(followUp.priorResults)
            : undefined,
          isFollowUp,
        };

        const mastro = await chatWithMastro(trimmed, mastroPayloads, meta);

        if ("ok" in mastro && mastro.ok === false) {
          const prefix =
            mastro.code === "NOT_CONFIGURED" ? "" : `⚠ ${mastro.error}\n\n`;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === radarMsgId
                ? {
                    ...m,
                    content: mergeAssistantContent(
                      null,
                      instantSummary,
                      `${prefix}${liveNote}`,
                      isFollowUp,
                      localFollowUpText
                    ),
                    geminiPending: false,
                    poweredBy: "radar",
                  }
                : m
            )
          );
          return;
        }

        const reply = mastro.reply;
        const socialEvidence =
          "ok" in mastro && mastro.ok === true ? mastro.socialEvidence : undefined;

        if (isOfflineMastroReply(reply)) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === radarMsgId
                ? {
                    ...m,
                    content: mergeAssistantContent(
                      reply,
                      instantSummary,
                      liveNote,
                      isFollowUp,
                      localFollowUpText
                    ),
                    geminiPending: false,
                    poweredBy: "radar",
                  }
                : m
            )
          );
          return;
        }

        const recommendedId = isFollowUp
          ? null
          : resolveRecommendedZoneId(
              "ok" in mastro && mastro.ok ? mastro.recommendedHotspotId : null,
              results
            );

        if (recommendedId) {
          options?.onRecommendedZone?.(recommendedId);
        }

        const content = mergeAssistantContent(
          reply,
          instantSummary,
          liveNote,
          isFollowUp,
          localFollowUpText
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === radarMsgId
              ? {
                  ...m,
                  content,
                  geminiPending: false,
                  poweredBy: "gemini",
                  recommendedZoneId: recommendedId,
                  socialEvidence,
                }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === radarMsgId
              ? {
                  ...m,
                  content: mergeAssistantContent(
                    null,
                    instantSummary,
                    `\n\n_Commento Mastro non disponibile._${liveNote}`,
                    isFollowUp,
                    localFollowUpText
                  ),
                  geminiPending: false,
                  poweredBy: "radar",
                }
              : m
          )
        );
      } finally {
        sendingRef.current = false;
        setGeminiLoading(false);
      }
    },
    [options]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Chat azzerata. Le % coincidono con la mappa e la fascia oraria attiva.",
        timestamp: Date.now(),
        poweredBy: "radar",
      },
    ]);
  }, []);

  return { messages, loading, geminiLoading, sendMessage, clearChat };
}
