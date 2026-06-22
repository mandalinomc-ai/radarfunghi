"use client";

import type { SpyZoneMarker } from "@/lib/types";
import { formatCoordinates } from "@/lib/mapUtils";
import { getSpeciesLabel } from "@/lib/predictionEngine";
import {
  downloadSpyZoneGeoJson,
  downloadSpyZoneJson,
  exportSpyZoneAsText,
  isSpyBookmarked,
  removeSpyBookmark,
  saveSpyBookmark,
} from "@/lib/spyZoneBookmarks";
import {
  googleMapsDirUrl,
  googleMapsPinUrl,
} from "@/lib/mapsLinkParser";
import { useState } from "react";

interface SpyZoneDetailPanelProps {
  zone: SpyZoneMarker | null;
  onClose: () => void;
  className?: string;
}

export default function SpyZoneDetailPanel({
  zone,
  onClose,
  className = "",
}: SpyZoneDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(
    zone ? isSpyBookmarked(zone.id) : false
  );

  if (!zone) return null;

  const speciesLabel =
    zone.species === "sconosciuto"
      ? "Specie non indicata"
      : getSpeciesLabel(zone.species);

  const date = new Date(zone.createdAt);

  const copyAll = async () => {
    await navigator.clipboard.writeText(exportSpyZoneAsText(zone));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleBookmark = () => {
    if (bookmarked) {
      removeSpyBookmark(zone.id);
      setBookmarked(false);
    } else {
      saveSpyBookmark(zone);
      setBookmarked(true);
    }
  };

  return (
    <div
      className={`fixed md:absolute inset-x-2 md:inset-x-auto md:right-14 md:w-[min(320px,calc(100vw-420px))] z-[1003] pointer-events-auto ${className}`}
    >
      <div className="bg-forest-900/98 backdrop-blur-lg border border-amber-500/35 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-200 text-[10px] font-bold uppercase">
                👁 Zona spia
              </span>
              <h3 className="text-sm font-semibold text-forest-100 mt-2">
                {zone.label}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-forest-800 text-forest-300 text-sm"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-forest-400">{speciesLabel}</p>
          <p className="text-xs text-forest-400 font-mono">
            {formatCoordinates(zone.lat, zone.lng)}
          </p>

          {zone.matchedZoneName && (
            <p className="text-xs text-amber-300/90">
              Vicino a: {zone.matchedZoneName}
              {zone.matchDistanceKm != null && ` · ${zone.matchDistanceKm} km`}
            </p>
          )}

          <p className="text-xs text-forest-500">
            {date.toLocaleDateString("it-IT", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {zone.note && (
            <p className="text-xs text-forest-300 italic border-t border-forest-700/30 pt-2">
              {zone.note}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={copyAll}
              className="py-2 rounded-lg bg-forest-800 text-forest-200 text-[11px] font-medium"
            >
              {copied ? "Copiato ✓" : "📋 Copia tutto"}
            </button>
            <button
              type="button"
              onClick={toggleBookmark}
              className="py-2 rounded-lg bg-amber-900/40 text-amber-200 text-[11px] font-medium"
            >
              {bookmarked ? "★ Salvata" : "☆ Salva locale"}
            </button>
            <button
              type="button"
              onClick={() => downloadSpyZoneJson(zone)}
              className="py-2 rounded-lg bg-forest-800 text-forest-300 text-[11px]"
            >
              ⬇ JSON
            </button>
            <button
              type="button"
              onClick={() => downloadSpyZoneGeoJson(zone)}
              className="py-2 rounded-lg bg-forest-800 text-forest-300 text-[11px]"
            >
              ⬇ GeoJSON
            </button>
          </div>

          <a
            href={googleMapsPinUrl(zone.lat, zone.lng, zone.label)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-white text-xs font-medium text-center"
          >
            Apri in Google Maps
          </a>
          <a
            href={googleMapsDirUrl(zone.lat, zone.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 rounded-lg bg-forest-800 text-forest-300 text-xs text-center"
          >
            Navigazione stradale
          </a>
        </div>
      </div>
    </div>
  );
}
