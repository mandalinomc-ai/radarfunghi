"use client";

import { useState } from "react";
import type { FungalZone, MushroomSpecies } from "@/lib/types";
import {
  getTerritoryIntro,
  getTerritoryMediaForZone,
  type TerritoryMediaItem,
} from "@/lib/territoryGuideData";
import { getSpeciesLabel } from "@/lib/predictionEngine";

interface TerritoryGuideSectionProps {
  zone: FungalZone;
  species: MushroomSpecies;
  compact?: boolean;
}

const LEVEL_BADGE: Record<TerritoryMediaItem["level"], string> = {
  ufficiale: "bg-green-900/50 text-green-300",
  editoriale: "bg-blue-900/40 text-blue-300",
  community: "bg-amber-900/40 text-amber-200",
};

const LEVEL_LABEL: Record<TerritoryMediaItem["level"], string> = {
  ufficiale: "Ufficiale",
  editoriale: "Editoriale",
  community: "Video community",
};

export default function TerritoryGuideSection({
  zone,
  species,
  compact,
}: TerritoryGuideSectionProps) {
  const media = getTerritoryMediaForZone(zone, species);
  const intro = getTerritoryIntro(zone, species, getSpeciesLabel(species));
  const videos = media.filter((m) => m.type === "video" && m.embedUrl);
  const photos = media.filter((m) => m.thumbnailUrl && m.type !== "video");
  const guides = media.filter((m) => !m.thumbnailUrl && m.type !== "video");

  return (
    <div
      className={`rounded-xl border border-sky-500/25 bg-sky-950/20 ${
        compact ? "p-2.5" : "p-3"
      } space-y-3`}
    >
      <p className="text-[10px] uppercase tracking-wider text-sky-300/90 font-medium">
        🗺️ Guida territorio &amp; media certificati
      </p>
      <p className="text-[11px] text-forest-300 leading-relaxed">
        {intro.replace(/\*\*/g, "")}
      </p>

      {videos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-forest-500 uppercase tracking-wider">
            Video
          </p>
          {videos.slice(0, compact ? 1 : 2).map((v) => (
            <VideoEmbed key={v.id} item={v} compact={compact} />
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-forest-500 uppercase tracking-wider">
            Foto &amp; schede (Wikipedia, parchi)
          </p>
          <div
            className={`grid gap-2 ${
              compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {photos.slice(0, compact ? 4 : 6).map((p) => (
              <PhotoCard key={p.id} item={p} compact={compact} />
            ))}
          </div>
        </div>
      )}

      {guides.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-forest-500 uppercase tracking-wider">
            Link e guide
          </p>
          <div className="space-y-2">
            {guides.slice(0, compact ? 3 : 5).map((g) => (
              <MediaCard key={g.id} item={g} list />
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-forest-600 leading-relaxed">
        Fonti: Wikipedia, enti parco, Funghimagazine, YouTube verificato nel
        catalogo. Non sostituiscono la guida sul campo.
      </p>
    </div>
  );
}

function VideoEmbed({
  item,
  compact,
}: {
  item: TerritoryMediaItem;
  compact?: boolean;
}) {
  if (!item.embedUrl) return null;
  return (
    <div className="rounded-xl overflow-hidden border border-forest-700/50 bg-forest-950/60">
      <div
        className={`relative w-full ${compact ? "aspect-video" : "aspect-video"} bg-forest-900`}
      >
        <iframe
          src={item.embedUrl}
          title={item.title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded-full ${LEVEL_BADGE[item.level]}`}
          >
            {LEVEL_LABEL[item.level]}
          </span>
        </div>
        <p className="text-[11px] font-semibold text-forest-100">{item.title}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-sky-400 underline mt-1 inline-block"
        >
          Apri su YouTube
        </a>
      </div>
    </div>
  );
}

function PhotoCard({ item, compact }: { item: TerritoryMediaItem; compact?: boolean }) {
  const [err, setErr] = useState(false);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border border-forest-700/50 bg-forest-950/60 hover:border-sky-500/40 touch-manipulation"
    >
      <div className={`relative ${compact ? "h-20" : "h-24"} bg-forest-900`}>
        {!err && item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {item.type === "wiki" ? "📖" : "🏞️"}
          </div>
        )}
      </div>
      <div className="p-1.5">
        <p className="text-[9px] font-semibold text-forest-200 line-clamp-2 leading-tight">
          {item.title}
        </p>
        <p className="text-[8px] text-forest-500">{item.sourceLabel}</p>
      </div>
    </a>
  );
}

function MediaCard({
  item,
  list,
}: {
  item: TerritoryMediaItem;
  list?: boolean;
}) {
  if (list) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 rounded-lg bg-forest-950/50 border border-forest-700/40 p-2.5 hover:border-sky-500/30 touch-manipulation"
      >
        <span className="text-lg shrink-0">
          {item.type === "parco" ? "🏞️" : item.type === "wiki" ? "📖" : "📄"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[11px] font-semibold text-forest-100 truncate">
              {item.title}
            </p>
            <span
              className={`text-[8px] px-1.5 py-0.5 rounded-full ${LEVEL_BADGE[item.level]}`}
            >
              {LEVEL_LABEL[item.level]}
            </span>
          </div>
          <p className="text-[10px] text-forest-500 line-clamp-2 mt-0.5">
            {item.description}
          </p>
        </div>
      </a>
    );
  }
  return null;
}
