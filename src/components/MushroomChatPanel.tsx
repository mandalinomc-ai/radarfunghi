"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatZoneResult } from "@/lib/mushroomChatEngine";
import { SUGGESTED_CHAT_PROMPTS } from "@/lib/mushroomChatEngine";
import type { ChatMessage } from "@/hooks/useMushroomChat";
import { getProbabilityLevel, PROBABILITY_LEVEL_CLASSES } from "@/lib/mapUtils";
import type { SocialCitationSummary } from "@/lib/socialEvidence";
import { platformLabel } from "@/lib/socialEvidence";

interface MushroomChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  geminiLoading?: boolean;
  studyWindowLabel?: string;
  onSend: (text: string) => void;
  onClear: () => void;
  onZoneSelect?: (result: ChatZoneResult) => void;
  compact?: boolean;
  className?: string;
}

export default function MushroomChatPanel({
  messages,
  loading,
  geminiLoading = false,
  studyWindowLabel,
  onSend,
  onClear,
  onZoneSelect,
  compact,
  className = "",
}: MushroomChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const loadingRef = useRef<HTMLDivElement>(null);
  const lastScrolledAssistantId = useRef<string | null>(null);

  const registerMessageRef = (id: string, el: HTMLDivElement | null) => {
    if (el) messageRefs.current.set(id, el);
    else messageRefs.current.delete(id);
  };

  const scrollTargetToStart = (el: HTMLElement | null | undefined) => {
    const container = scrollRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollTop =
      container.scrollTop + (elRect.top - containerRect.top) - 8;
    container.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (loading) {
      requestAnimationFrame(() => {
        scrollTargetToStart(loadingRef.current);
      });
      return;
    }

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant || lastAssistant.id === lastScrolledAssistantId.current) {
      return;
    }

    lastScrolledAssistantId.current = lastAssistant.id;
    requestAnimationFrame(() => {
      scrollTargetToStart(messageRefs.current.get(lastAssistant.id));
    });
  }, [messages, loading]);

  const busy = loading || geminiLoading;
  const inputDisabled = loading;

  const submit = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    onSend(q);
  };

  return (
    <div className={`flex flex-col min-h-0 h-full ${className}`}>
      <div className="flex items-start justify-between gap-2 px-1 pb-2 shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] text-forest-500 leading-snug">
            % identiche alla mappa · meteo live
          </p>
          {studyWindowLabel && (
            <p className="text-[10px] text-mushroom-400/90 font-medium mt-0.5">
              Fascia studio: {studyWindowLabel}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-[10px] text-forest-500 hover:text-mushroom-400 touch-manipulation"
        >
          Pulisci
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain space-y-3 pr-1 min-h-0"
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onZoneSelect={onZoneSelect}
            registerRef={registerMessageRef}
          />
        ))}
        {loading && (
          <div
            ref={loadingRef}
            className="flex items-center gap-2 text-xs text-forest-500 pl-1 scroll-mt-2"
          >
            <span className="w-4 h-4 border-2 border-mushroom-400 border-t-transparent rounded-full animate-spin" />
            Lettura radar e fascia oraria…
          </div>
        )}
      </div>

      <div className="shrink-0 pt-2 space-y-2 border-t border-forest-700/40 mt-2">
        {!compact && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_CHAT_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submit(prompt)}
                disabled={inputDisabled}
                className="shrink-0 text-[10px] px-2.5 py-1.5 rounded-full bg-forest-800 text-forest-300 border border-forest-600/40 hover:border-mushroom-500/40 touch-manipulation whitespace-nowrap disabled:opacity-50"
              >
                {prompt.length > 36 ? `${prompt.slice(0, 34)}…` : prompt}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Dove trovo porcini oggi?"
            disabled={inputDisabled}
            className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-forest-950 border border-forest-600/50 text-sm text-forest-100 placeholder:text-forest-500 focus:outline-none focus:border-mushroom-500/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={inputDisabled || !input.trim()}
            className="shrink-0 px-4 py-3 rounded-xl bg-mushroom-600 hover:bg-mushroom-500 text-white font-semibold text-sm disabled:opacity-40 touch-manipulation"
          >
            Invia
          </button>
        </form>
        {geminiLoading && !loading && (
          <p className="text-[10px] text-forest-500 text-center">
            Mastro Fungaiolo sta commentando — puoi già usare le schede sopra
          </p>
        )}
        {busy && compact && (
          <p className="text-[9px] text-forest-600 text-center">
            {loading ? "Analisi istantanea…" : "Commento in arrivo…"}
          </p>
        )}
      </div>
    </div>
  );
}

function plainTextForCopy(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .trim();
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const payload = plainTextForCopy(text);
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-forest-800/80 text-forest-400 hover:text-mushroom-300 hover:bg-forest-700/80 touch-manipulation transition-colors"
      aria-label="Copia risposta"
    >
      {copied ? "Copiato ✓" : "Copia"}
    </button>
  );
}

function MessageBubble({
  message,
  onZoneSelect,
  registerRef,
}: {
  message: ChatMessage;
  onZoneSelect?: (r: ChatZoneResult) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      ref={(el) => registerRef(message.id, el)}
      className={`flex scroll-mt-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[92%] rounded-2xl px-3 py-2.5 ${
          isUser
            ? "bg-mushroom-700/40 border border-mushroom-500/30 text-forest-100"
            : "bg-forest-950/80 border border-forest-600/40 text-forest-200"
        }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] text-mushroom-400 font-semibold min-w-0">
              🍄{" "}
              {message.geminiPending
                ? "Radar live"
                : message.poweredBy === "gemini"
                  ? "Mastro Fungaiolo"
                  : "Assistente Radar"}
              {message.poweredBy === "gemini" && !message.geminiPending && (
                <span className="text-forest-500 font-normal"> · Gemini</span>
              )}
            </p>
            <CopyMessageButton text={message.content} />
          </div>
        )}
        {message.studyWindow && (
          <p className="text-[9px] text-forest-500 mb-1">
            Studio {message.studyWindow}
            {message.dataAsOf
              ? ` · dati ${new Date(message.dataAsOf).toLocaleString("it-IT", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : ""}
          </p>
        )}
        <div className="text-xs leading-relaxed whitespace-pre-wrap select-text">
          <FormattedText text={message.content} />
        </div>

        {message.geminiPending && (
          <div className="flex items-center gap-2 mt-2 text-[10px] text-forest-500">
            <span className="w-3 h-3 border-2 border-mushroom-400/70 border-t-transparent rounded-full animate-spin" />
            Mastro sta elaborando il commento…
          </div>
        )}

        {message.results && message.results.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.results.map((r) => (
              <ZoneResultCard
                key={`${r.zoneId}-${r.species}-${r.date}`}
                result={r}
                onSelect={onZoneSelect}
                highlighted={
                  Boolean(message.recommendedZoneId) &&
                  message.recommendedZoneId === r.zoneId
                }
              />
            ))}
          </div>
        )}

        {message.socialEvidence && message.socialEvidence.length > 0 && (
          <SocialEvidenceBlock items={message.socialEvidence} />
        )}
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-mushroom-300 font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("_") && part.endsWith("_")) {
          return (
            <em key={i} className="text-forest-500 text-[11px]">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function SocialEvidenceBlock({ items }: { items: SocialCitationSummary[] }) {
  return (
    <div className="mt-3 pt-2 border-t border-forest-700/40 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-500">
        Fonti social pubbliche
      </p>
      {items.map((item) => (
        <div
          key={`${item.trendId}-${item.handle}-${item.publishedAt}`}
          className="rounded-lg bg-forest-900/90 border border-forest-700/50 p-2.5 text-[11px]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-forest-100 truncate">
                {item.authorName}{" "}
                <span className="text-mushroom-400 font-normal">
                  {item.handle}
                </span>
              </p>
              <p className="text-forest-500 text-[10px]">
                {platformLabel(item.platform)} · {item.publishedAt}
              </p>
            </div>
            <span
              className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                item.verificationLevel === "verified_public"
                  ? "bg-green-900/50 text-green-300"
                  : item.verificationLevel === "editorial"
                    ? "bg-blue-900/40 text-blue-300"
                    : "bg-amber-900/40 text-amber-300"
              }`}
            >
              {item.verificationLevel === "verified_public"
                ? "Pubblico"
                : item.verificationLevel === "editorial"
                  ? "Editoriale"
                  : "Community"}
            </span>
          </div>
          <blockquote className="mt-1.5 text-forest-300 italic leading-snug border-l-2 border-mushroom-500/40 pl-2">
            «{item.excerpt}»
          </blockquote>
          <p className="text-forest-500 mt-1">
            📍 {item.locationMentioned} · {item.speciesLabels.join(", ")}
          </p>
          <a
            href={item.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-2 text-[10px] px-2 py-1 rounded bg-forest-800 text-mushroom-300 hover:bg-forest-700 touch-manipulation"
          >
            Apri fonte →
          </a>
        </div>
      ))}
      <p className="text-[9px] text-forest-600 leading-snug">
        Le segnalazioni social non sostituiscono lo Sprout Score né la
        verifica sul campo con un esperto.
      </p>
    </div>
  );
}

function ZoneResultCard({
  result,
  onSelect,
  highlighted,
}: {
  result: ChatZoneResult;
  onSelect?: (r: ChatZoneResult) => void;
  highlighted?: boolean;
}) {
  const level = getProbabilityLevel(result.score);
  const style = PROBABILITY_LEVEL_CLASSES[level];

  return (
    <div
      className={`rounded-lg bg-forest-900/90 border p-2 text-[11px] ${
        highlighted
          ? "border-mushroom-500/60 ring-1 ring-mushroom-500/30"
          : "border-forest-700/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-forest-100 truncate">
            {result.zoneName}
          </p>
          <p className="text-forest-500">
            {result.speciesLabel} · {result.dateLabel}
            {result.hourRangeLabel ? ` · ${result.hourRangeLabel}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${style}`}
        >
          {result.score}%
        </span>
      </div>
      <p className="text-forest-400 mt-1">
        📍 {result.km} km · ⏱ {result.driveMinutes} min · 🌲 {result.altitude} m
      </p>
      <p className="text-forest-500 text-[10px] font-mono leading-snug">
        🅿️ Parcheggio: {result.coords}
      </p>
      <p className="text-forest-500 text-[10px] font-mono leading-snug">
        🌲 Raccolta: {result.foragingCoords}
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-mushroom-600/40 text-mushroom-200 touch-manipulation font-medium"
          >
            Mappa
          </button>
        )}
        <a
          href={result.mapsParkingUrl ?? result.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-2 py-1 rounded bg-forest-800 text-forest-300 touch-manipulation"
        >
          Maps 🅿️
        </a>
        <a
          href={result.mapsForagingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-2 py-1 rounded bg-teal-900/50 text-teal-200 touch-manipulation"
        >
          Maps 🌲
        </a>
        {result.earthForagingUrl && (
          <a
            href={result.earthForagingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-2 py-1 rounded bg-blue-900/50 text-blue-200 touch-manipulation"
          >
            Earth 🌲
          </a>
        )}
        {result.earthParkingUrl && (
          <a
            href={result.earthParkingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-2 py-1 rounded bg-blue-900/40 text-blue-200/90 touch-manipulation"
          >
            Earth 🅿️
          </a>
        )}
      </div>
    </div>
  );
}
