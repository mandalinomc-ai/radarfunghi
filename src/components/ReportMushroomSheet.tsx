"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MushroomReport, MushroomSpecies, ReportType } from "@/lib/types";
import { getSpeciesLabel } from "@/lib/predictionEngine";
import { formatCoordinates } from "@/lib/mapUtils";
import { queueReportRecord } from "@/lib/reportOfflineStore";

interface ReportMushroomSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (
    report: MushroomReport,
    validation?: { mastroMessage: string; status: string }
  ) => void;
  onQueued?: () => void;
}

type GpsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; lat: number; lng: number; accuracy: number }
  | { status: "error"; message: string };

const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: "bottata", label: "Bottata" },
  { id: "spia", label: "Spia" },
  { id: "ritrovamento", label: "Ritrovamento" },
];

const SPECIES_OPTIONS: (MushroomSpecies | "sconosciuto")[] = [
  "sconosciuto",
  "porcino",
  "galletto",
  "estatino",
];

export default function ReportMushroomSheet({
  open,
  onClose,
  onSuccess,
  onQueued,
}: ReportMushroomSheetProps) {
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>("bottata");
  const [species, setSpecies] =
    useState<MushroomSpecies | "sconosciuto">("sconosciuto");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const captureGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGps({ status: "error", message: "GPS non disponibile su questo dispositivo" });
      return;
    }
    setGps({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        setGps({
          status: "error",
          message:
            err.code === 1
              ? "Permesso posizione negato. Abilita il GPS nelle impostazioni."
              : "Impossibile ottenere la posizione precisa",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (open) {
      setError(null);
      setQueuedNotice(null);
      captureGps();
    } else {
      setPhoto(null);
      setPhotoPreview(null);
      setNote("");
      setGps({ status: "idle" });
      setSubmitting(false);
    }
  }, [open, captureGps]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhoto = (file: File | null) => {
    if (!file) return;
    setPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const queueOffline = async () => {
    if (gps.status !== "ok" || !photo) return false;
    await queueReportRecord({
      id: crypto.randomUUID(),
      lat: gps.lat,
      lng: gps.lng,
      accuracyMeters: gps.accuracy,
      reportType,
      species,
      note,
      photoBlob: photo,
      createdAt: new Date().toISOString(),
    });
    onQueued?.();
    setQueuedNotice(
      "Segnalazione salvata offline. Verrà inviata automaticamente quando torni online."
    );
    return true;
  };

  const handleSubmit = async () => {
    if (gps.status !== "ok") {
      setError("Attendi il GPS o riprova a ottenere la posizione");
      return;
    }
    if (!photo) {
      setError("Devi allegare una foto dei funghi trovati");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSubmitting(true);
      try {
        await queueOffline();
      } catch {
        setError("Impossibile salvare la segnalazione offline");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.append("photo", photo);
    form.append("lat", String(gps.lat));
    form.append("lng", String(gps.lng));
    form.append("accuracyMeters", String(gps.accuracy));
    form.append("reportType", reportType);
    form.append("species", species);
    form.append("note", note);

    try {
      const res = await fetch("/api/reports", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Invio fallito");
      }
      onSuccess(data.report, data.validation);
      onClose();
    } catch (e) {
      try {
        const queued = await queueOffline();
        if (!queued) {
          setError(e instanceof Error ? e.message : "Errore invio");
        }
      } catch {
        setError(e instanceof Error ? e.message : "Errore invio");
      }
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
      <div className="absolute bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-forest-900 border-t md:border border-mushroom-500/30 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto safe-bottom">
        <div className="p-4 md:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-forest-200">
                Segnala funghi sul posto
              </h2>
              <p className="text-xs text-forest-400 mt-1">
                Come la posizione WhatsApp: GPS preciso + foto obbligatoria
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-lg bg-forest-800 text-forest-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* GPS */}
          <div className="rounded-xl bg-forest-950/60 border border-forest-700/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
              Posizione GPS
            </p>
            {gps.status === "loading" && (
              <p className="text-sm text-mushroom-400 animate-pulse">
                Acquisizione posizione precisa...
              </p>
            )}
            {gps.status === "ok" && (
              <div>
                <p className="text-sm font-medium text-green-400">
                  ✓ Posizione acquisita (±{gps.accuracy} m)
                </p>
                <p className="text-xs text-forest-400 mt-1 font-mono">
                  {formatCoordinates(gps.lat, gps.lng)}
                </p>
              </div>
            )}
            {gps.status === "error" && (
              <p className="text-sm text-red-400">{gps.message}</p>
            )}
            <button
              onClick={captureGps}
              className="mt-2 text-xs text-mushroom-400 underline touch-manipulation"
            >
              Aggiorna posizione
            </button>
          </div>

          {/* Foto obbligatoria */}
          <div className="rounded-xl bg-forest-950/60 border border-forest-700/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
              Foto dei funghi <span className="text-red-400">*</span>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
            />
            {photoPreview ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Anteprima funghi"
                  className="w-full h-40 object-cover rounded-lg border border-forest-600/40"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-mushroom-400 underline"
                >
                  Cambia foto
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-8 rounded-xl border-2 border-dashed border-mushroom-500/40 bg-mushroom-500/5 text-mushroom-400 text-sm font-medium touch-manipulation active:bg-mushroom-500/10"
              >
                📷 Scatta o carica foto
                <span className="block text-[10px] text-forest-500 mt-1 font-normal">
                  Obbligatoria per evitare false segnalazioni
                </span>
              </button>
            )}
          </div>

          {/* Tipo */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">
              Tipo ritrovamento
            </p>
            <div className="flex gap-1.5">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setReportType(t.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium touch-manipulation ${
                    reportType === t.id
                      ? "bg-mushroom-500 text-white"
                      : "bg-forest-800 text-forest-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specie */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-1.5">
              Specie (opzionale)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SPECIES_OPTIONS.map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSpecies(sp)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation ${
                    species === sp
                      ? "bg-mushroom-500 text-white"
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
            placeholder="Nota breve (opzionale)..."
            maxLength={280}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-forest-950 border border-forest-700/50 text-sm text-forest-200 placeholder:text-forest-500 resize-none focus:outline-none focus:border-mushroom-500/50"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {queuedNotice && (
            <p className="text-sm text-green-300 bg-green-950/30 rounded-lg px-3 py-2">
              {queuedNotice}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || gps.status !== "ok" || !photo}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation shadow-lg shadow-green-900/30"
          >
            {submitting
              ? "Pubblicazione..."
              : "📍 Pubblica segnalazione sulla mappa"}
          </button>

          <p className="text-[10px] text-forest-500 text-center leading-relaxed">
            La segnalazione sarà visibile a tutti gli utenti. Segnala solo funghi
            realmente trovati e rispetta la natura.
          </p>
        </div>
      </div>
    </div>
  );
}
