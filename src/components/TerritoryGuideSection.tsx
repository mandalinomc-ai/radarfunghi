"use client";

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
  const videos = media.filter((m) => m.type === "video");
  const guides = media.filter((m) => m.type !== "video");

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
            Video verificati
          </p>
          <div
            className={`grid gap-2 ${
              compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {videos.map((v) => (
              <MediaCard key={v.id} item={v} compact={compact} />
            ))}
          </div>
        </div>
      )}

      {guides.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-forest-500 uppercase tracking-wider">
            Parchi, guide e mappe
          </p>
          <div className="space-y-2">
            {guides.slice(0, compact ? 3 : 6).map((g) => (
              <MediaCard key={g.id} item={g} compact={compact} list />
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-forest-600 leading-relaxed">
        Solo link verificati nel catalogo fonti (enti parco, Funghimagazine,
        YouTube community con URL controllato). Non sostituiscono la guida sul
        campo.
      </p>
    </div>
  );
}

function MediaCard({
  item,
  compact,
  list,
}: {
  item: TerritoryMediaItem;
  compact?: boolean;
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
          {item.type === "parco" ? "🏞️" : "📄"}
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

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden border border-forest-700/50 bg-forest-950/60 hover:border-amber-500/40 touch-manipulation"
    >
      {item.thumbnailUrl && (
        <div className={`relative ${compact ? "h-24" : "h-28"} bg-forest-900`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-90">
            ▶
          </span>
        </div>
      )}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded-full ${LEVEL_BADGE[item.level]}`}
          >
            {LEVEL_LABEL[item.level]}
          </span>
        </div>
        <p className="text-[11px] font-semibold text-forest-100 line-clamp-2">
          {item.title}
        </p>
        <p className="text-[10px] text-forest-500 line-clamp-2 mt-0.5">
          {item.description}
        </p>
      </div>
    </a>
  );
}
