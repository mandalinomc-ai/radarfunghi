"use client";

import { useState } from "react";
import type { GeoPoint } from "@/lib/geoUtils";
import type { CityDualPreview } from "@/lib/cityDayPreview";
import type { ProbabilityLevel } from "@/lib/mapUtils";
import OriginPicker from "./OriginPicker";

interface CitySearchBarProps {
  origin: GeoPoint;
  rangeKm: number;
  preview: CityDualPreview | null;
  loading?: boolean;
  onOriginChange: (origin: GeoPoint) => void;
  onSearch?: () => void;
  onFocusDay?: (offset: 0 | 1) => void;
  onOpenPreviewSheet?: () => void;
}

const LEVEL_STYLE: Record<
  ProbabilityLevel,
  { bg: string; text: string; label: string }
> = {
  alta: { bg: "bg-orange-600/30", text: "text-orange-300", label: "Alta" },
  media: { bg: "bg-amber-600/25", text: "text-amber-300", label: "Media" },
  bassa: { bg: "bg-forest-700/60", text: "text-forest-400", label: "Bassa" },
};

export default function CitySearchBar({
  origin,
  rangeKm,
  preview,
  loading,
  onOriginChange,
  onSearch,
  onFocusDay,
  onOpenPreviewSheet,
}: CitySearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [lastSearched, setLastSearched] = useState(origin.name);

  const handleOriginChange = (next: GeoPoint) => {
    setLastSearched(next.name);
    onOriginChange(next);
    onFocusDay?.(0);
    if (onOpenPreviewSheet) {
      onOpenPreviewSheet();
    } else {
      setExpanded(true);
    }
  };

  const showInlinePreview = expanded && preview && !onOpenPreviewSheet;

  return (
    <div className="md:hidden absolute top-[56px] left-2 right-2 z-[1002] pointer-events-auto">
      <div className="bg-forest-900/95 backdrop-blur-md border border-mushroom-500/30 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-2 md:p-3.5 space-y-2">
          <OriginPicker
            origin={origin}
            onOriginChange={handleOriginChange}
            onSearch={onSearch}
            compact
          />
          <div className="flex gap-1.5">
            {preview && onOpenPreviewSheet && (
              <button
                type="button"
                onClick={onOpenPreviewSheet}
                className="flex-1 px-2.5 py-2 rounded-lg text-xs bg-mushroom-700/50 text-mushroom-200 border border-mushroom-500/30 touch-manipulation"
              >
                📅 Oggi e domani
              </button>
            )}
          </div>
          <p className="hidden md:block text-[10px] text-forest-500">
            Analisi nel raggio {rangeKm} km · meteo live multi-fonte
          </p>
        </div>

        {showInlinePreview && (
          <div className="border-t border-forest-700/50 px-3 pb-3 md:px-3.5 md:pb-3.5">
            <PreviewContent
              lastSearched={lastSearched}
              preview={preview}
              loading={loading}
              onClose={() => setExpanded(false)}
              onFocusDay={onFocusDay}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Contenuto anteprima riutilizzabile in sheet mobile */
export function CityPreviewContent({
  preview,
  loading,
  lastSearched,
  onFocusDay,
}: {
  preview: CityDualPreview;
  loading?: boolean;
  lastSearched: string;
  onFocusDay?: (offset: 0 | 1) => void;
}) {
  return (
    <PreviewContent
      lastSearched={lastSearched}
      preview={preview}
      loading={loading}
      onFocusDay={onFocusDay}
    />
  );
}

function PreviewContent({
  lastSearched,
  preview,
  loading,
  onClose,
  onFocusDay,
}: {
  lastSearched: string;
  preview: CityDualPreview;
  loading?: boolean;
  onClose?: () => void;
  onFocusDay?: (offset: 0 | 1) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2 pt-2">
        <p className="text-xs font-semibold text-forest-200 truncate">
          {lastSearched}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-forest-500 text-xs shrink-0 touch-manipulation"
          >
            Chiudi
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-forest-500 py-4 text-center">
          Aggiornamento meteo in corso...
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <DayCard
            title="Oggi — cosa c'è"
            accent="border-green-500/40"
            preview={preview.today}
            onShowMap={() => onFocusDay?.(0)}
          />
          <DayCard
            title="Domani — cosa uscirà"
            accent="border-mushroom-500/40"
            preview={preview.tomorrow}
            onShowMap={() => onFocusDay?.(1)}
            emerging={preview.emerging}
          />
        </div>
      )}

      {preview.improving && !loading && (
        <p className="text-[10px] text-mushroom-400/90 mt-2 leading-relaxed">
          📈 Domani migliorano:{" "}
          {preview.emerging.length > 0
            ? preview.emerging.map((e) => `${e.label} (+${e.delta}%)`).join(", ")
            : "condizioni generali in crescita"}
        </p>
      )}
    </>
  );
}

function DayCard({
  title,
  accent,
  preview,
  onShowMap,
  emerging,
}: {
  title: string;
  accent: string;
  preview: CityDualPreview["today"];
  onShowMap?: () => void;
  emerging?: CityDualPreview["emerging"];
}) {
  const best = preview.best;

  return (
    <div
      className={`rounded-lg border ${accent} bg-forest-950/80 p-2.5 space-y-2`}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-forest-400 font-semibold">
            {title}
          </p>
          <p className="text-xs text-mushroom-300 font-medium">
            {preview.dateLabel}
          </p>
        </div>
        {onShowMap && (
          <button
            type="button"
            onClick={onShowMap}
            className="text-[10px] text-mushroom-400 underline shrink-0 touch-manipulation"
          >
            Mappa
          </button>
        )}
      </div>

      {best && best.activeScore >= 28 ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-forest-100">
              {best.activeScore}%
            </span>
            <LevelBadge level={getLevelFromScore(best.activeScore)} />
          </div>
          <p className="text-[11px] text-forest-300 leading-snug">
            {best.zone.name}
            <span className="text-forest-500">
              {" "}
              · {best.zone.kmFromBenevento} km
            </span>
          </p>
          <ul className="space-y-1">
            {preview.speciesScores.map((s) => (
              <li
                key={s.species}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="text-forest-400 truncate pr-1">{s.label}</span>
                <span
                  className={`font-semibold shrink-0 ${LEVEL_STYLE[s.level].text}`}
                >
                  {s.score}%
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-[11px] text-forest-500 leading-snug">
          Nessuna zona attiva nel raggio.
        </p>
      )}

      {emerging && emerging.length > 0 && (
        <p className="text-[10px] text-mushroom-400/80 pt-1 border-t border-forest-800/50">
          In crescita: {emerging.map((e) => e.label).join(", ")}
        </p>
      )}
    </div>
  );
}

function getLevelFromScore(score: number): ProbabilityLevel {
  if (score >= 80) return "alta";
  if (score >= 40) return "media";
  return "bassa";
}

function LevelBadge({ level }: { level: ProbabilityLevel }) {
  const style = LEVEL_STYLE[level];
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
