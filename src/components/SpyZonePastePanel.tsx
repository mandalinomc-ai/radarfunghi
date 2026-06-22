"use client";

import { useCallback, useEffect, useState } from "react";
import type { MushroomSpecies, SpyZoneMarker } from "@/lib/types";
import { getSpeciesLabel } from "@/lib/predictionEngine";
import {
  formatCoordsExport,
  googleMapsDirUrl,
  googleMapsPinUrl,
  parseMapsInput,
  validateMapsLocation,
} from "@/lib/mapsLinkParser";
import {
  downloadAllBookmarks,
  downloadSpyZoneGeoJson,
  downloadSpyZoneJson,
  exportSpyZoneAsText,
  isSpyBookmarked,
  loadSpyBookmarks,
  removeSpyBookmark,
  saveSpyBookmark,
} from "@/lib/spyZoneBookmarks";

interface SpyZonePastePanelProps {
  open: boolean;
  onClose: () => void;
  onPublished: (zone: SpyZoneMarker) => void;
  existingZones?: SpyZoneMarker[];
}

const SPECIES_OPTIONS: (MushroomSpecies | "sconosciuto")[] = [
  "sconosciuto",
  "porcino",
  "estatino",
  "galletto",
];

export default function SpyZonePastePanel({
  open,
  onClose,
  onPublished,
  existingZones = [],
}: SpyZonePastePanelProps) {
  const [pasteInput, setPasteInput] = useState("");
  const [label, setLabel] = useState("Zona spia interessante");
  const [note, setNote] = useState("");
  const [species, setSpecies] =
    useState<MushroomSpecies | "sconosciuto">("sconosciuto");
  const [preview, setPreview] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState(loadSpyBookmarks());

  const runParse = useCallback(() => {
    setParseError(null);
    setPreview(null);
    const trimmed = pasteInput.trim();
    if (!trimmed) return;

    const parsed = parseMapsInput(trimmed);
    if (!parsed) {
      setParseError(
        "Non riconosco link o coordinate. Prova: 41.0689, 14.6623 oppure link Google Maps."
      );
      return;
    }
    const check = validateMapsLocation(parsed);
    if (!check.ok) {
      setParseError(check.error);
      return;
    }
    setPreview({ lat: parsed.lat, lng: parsed.lng });
  }, [pasteInput]);

  useEffect(() => {
    if (!open) {
      setPasteInput("");
      setPreview(null);
      setParseError(null);
      setSubmitError(null);
      setNote("");
      setLabel("Zona spia interessante");
      setSpecies("sconosciuto");
    } else {
      setBookmarks(loadSpyBookmarks());
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(runParse, 400);
    return () => clearTimeout(t);
  }, [pasteInput, runParse]);

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setSubmitError("Copia non riuscita");
    }
  };

  const handlePublish = async () => {
    if (!preview && !pasteInput.trim()) {
      setSubmitError("Incolla un link Maps o coordinate");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/spy-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: pasteInput.trim(),
          lat: preview?.lat,
          lng: preview?.lng,
          label,
          note,
          species,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Pubblicazione fallita");
      const zone = data.zone as SpyZoneMarker;
      saveSpyBookmark(zone);
      setBookmarks(loadSpyBookmarks());
      onPublished(zone);
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Errore");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-forest-900 border-t md:border border-amber-500/30 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto safe-bottom">
        <div className="p-4 md:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-amber-200">
                Zona spia da Maps
              </h2>
              <p className="text-xs text-forest-400 mt-1">
                Incolla link Google Maps o coordinate — visibile a tutti sulla
                mappa
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-lg bg-forest-800 text-forest-300"
            >
              ✕
            </button>
          </div>

          <div className="rounded-xl bg-forest-950/60 border border-forest-700/40 p-3 space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-forest-400">
              Link Maps o coordinate GPS
            </label>
            <textarea
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="Es. https://maps.google.com/... oppure 41.0689, 14.6623"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-forest-950 border border-forest-700/50 text-sm text-forest-100 placeholder:text-forest-600 resize-none focus:outline-none focus:border-amber-500/50 font-mono"
            />
            {parseError && (
              <p className="text-xs text-red-400">{parseError}</p>
            )}
            {preview && (
              <div className="rounded-lg bg-amber-950/30 border border-amber-500/30 px-3 py-2">
                <p className="text-xs text-amber-200 font-medium">
                  ✓ Posizione riconosciuta
                </p>
                <p className="text-[11px] text-forest-400 font-mono mt-1">
                  {formatCoordsExport(preview.lat, preview.lng)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        formatCoordsExport(preview.lat, preview.lng),
                        "coords"
                      )
                    }
                    className="text-[10px] px-2 py-1 rounded bg-forest-800 text-forest-300"
                  >
                    {copied === "coords" ? "Copiato ✓" : "Copia coordinate"}
                  </button>
                  <a
                    href={googleMapsPinUrl(preview.lat, preview.lng, label)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] px-2 py-1 rounded bg-forest-800 text-amber-300"
                  >
                    Apri Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome zona (es. Fosso nord Camposauro)"
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg bg-forest-950 border border-forest-700/50 text-sm text-forest-100"
          />

          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">
              Specie osservata (opzionale)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SPECIES_OPTIONS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecies(sp)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    species === sp
                      ? "bg-amber-500 text-forest-950"
                      : "bg-forest-800 text-forest-300"
                  }`}
                >
                  {sp === "sconosciuto" ? "Non so" : getSpeciesLabel(sp)}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota: habitat, alberi, umidità, fungo spia visto..."
            maxLength={400}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-forest-950 border border-forest-700/50 text-sm text-forest-200 resize-none"
          />

          {submitError && (
            <p className="text-sm text-red-400 bg-red-950/30 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={submitting || (!preview && !pasteInput.trim())}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-forest-950 font-bold text-sm disabled:opacity-40"
          >
            {submitting ? "Pubblicazione..." : "👁 Pubblica zona spia sulla mappa"}
          </button>

          {bookmarks.length > 0 && (
            <div className="border-t border-forest-700/40 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-forest-400">
                  Salvate sul dispositivo ({bookmarks.length})
                </p>
                <button
                  type="button"
                  onClick={downloadAllBookmarks}
                  className="text-[10px] text-amber-400 underline"
                >
                  Esporta tutte JSON
                </button>
              </div>
              {bookmarks.slice(0, 5).map((bm) => (
                <div
                  key={bm.id}
                  className="flex items-center justify-between gap-2 text-[11px] bg-forest-950/50 rounded-lg px-2 py-1.5"
                >
                  <span className="text-forest-300 truncate">{bm.label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        formatCoordsExport(bm.lat, bm.lng),
                        bm.id
                      )
                    }
                    className="shrink-0 text-amber-400 text-[10px]"
                  >
                    {copied === bm.id ? "✓" : "Copia"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {existingZones.length > 0 && (
            <div className="border-t border-forest-700/40 pt-3">
              <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-2">
                Zone spia community ({existingZones.length})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {existingZones.slice(0, 8).map((z) => (
                  <SpyZoneExportRow
                    key={z.id}
                    zone={z}
                    copied={copied}
                    onCopy={copyText}
                    onBookmark={() => {
                      if (isSpyBookmarked(z.id)) removeSpyBookmark(z.id);
                      else saveSpyBookmark(z);
                      setBookmarks(loadSpyBookmarks());
                    }}
                    bookmarked={isSpyBookmarked(z.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-forest-600 text-center leading-relaxed">
            Le zone spia sono pubbliche. Esporta coordinate in JSON, GeoJSON o
            testo per il tuo GPS.
          </p>
        </div>
      </div>
    </div>
  );
}

function SpyZoneExportRow({
  zone,
  copied,
  onCopy,
  onBookmark,
  bookmarked,
}: {
  zone: SpyZoneMarker;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  onBookmark: () => void;
  bookmarked: boolean;
}) {
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="text-amber-400 shrink-0">👁</span>
      <span className="text-forest-400 truncate flex-1">{zone.label}</span>
      <button
        type="button"
        onClick={() => onCopy(exportSpyZoneAsText(zone), zone.id)}
        className="text-forest-500 hover:text-amber-300 px-1"
        title="Copia testo"
      >
        {copied === zone.id ? "✓" : "📋"}
      </button>
      <button
        type="button"
        onClick={() => downloadSpyZoneJson(zone)}
        className="text-forest-500 hover:text-amber-300 px-1"
        title="JSON"
      >
        ⬇
      </button>
      <button
        type="button"
        onClick={() => downloadSpyZoneGeoJson(zone)}
        className="text-forest-500 hover:text-amber-300 px-1"
        title="GeoJSON"
      >
        🗺
      </button>
      <button
        type="button"
        onClick={onBookmark}
        className={`px-1 ${bookmarked ? "text-amber-400" : "text-forest-600"}`}
        title="Salva sul dispositivo"
      >
        {bookmarked ? "★" : "☆"}
      </button>
    </div>
  );
}
