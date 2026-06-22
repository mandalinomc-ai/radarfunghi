"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoPoint } from "@/lib/geoUtils";
import type { HistoryMonths } from "@/lib/openMeteoHistory";
import { useWeatherHistory } from "@/hooks/useWeatherHistory";
import {
  SPY_MUSHROOMS,
  SPY_MUSHROOM_GUIDE_INTRO,
  buildSpyPredictionReport,
  simulateSpyRecognition,
  type SpyPredictionReport,
} from "@/lib/spyMushroomIntel";

const WeatherHistoryChart = dynamic(() => import("./WeatherHistoryChart"), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-xs text-forest-500">
      Caricamento grafico…
    </div>
  ),
});

const PERIOD_OPTIONS: { months: HistoryMonths; label: string }[] = [
  { months: 1, label: "1 Mese" },
  { months: 3, label: "3 Mesi" },
  { months: 6, label: "6 Mesi" },
  { months: 12, label: "12 Mesi" },
];

interface WeatherSpyRadarPanelProps {
  origin: GeoPoint;
  originName: string;
  compact?: boolean;
}

export default function WeatherSpyRadarPanel({
  origin,
  originName,
  compact,
}: WeatherSpyRadarPanelProps) {
  const [months, setMonths] = useState<HistoryMonths>(1);
  const { data, loading, error, refresh } = useWeatherHistory(origin, months);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<SpyPredictionReport | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const runScan = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setReport(null);
      setScanning(true);
      pendingFileRef.current = file;

      await new Promise((r) => setTimeout(r, 2000));

      const recognized = simulateSpyRecognition(file);
      if (data) {
        setReport(buildSpyPredictionReport(data, recognized));
        pendingFileRef.current = null;
      }
      setScanning(false);
    },
    [data, previewUrl]
  );

  useEffect(() => {
    if (!data || !pendingFileRef.current || report) return;
    const recognized = simulateSpyRecognition(pendingFileRef.current);
    setReport(buildSpyPredictionReport(data, recognized));
    pendingFileRef.current = null;
  }, [data, report]);

  const processFile = useCallback(
    (file: File) => {
      void runScan(file);
    },
    [runScan]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const optimismColor = {
    ottimo: "text-green-300",
    buono: "text-mushroom-300",
    moderato: "text-amber-300",
    scarso: "text-red-300",
  };

  return (
    <div className={`space-y-5 ${compact ? "p-1" : ""}`}>
      {/* TASK 1 — Meteo storico live */}
      <section className="rounded-xl border border-sky-500/25 bg-sky-950/15 p-3 md:p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-sky-200">
              Meteo Storico Radar
            </h2>
            <p className="text-[10px] text-forest-500 mt-0.5">
              Open-Meteo LIVE · {originName} (
              {(origin?.lat ?? 42.5).toFixed(2)}, {(origin?.lng ?? 12.5).toFixed(2)}
              )
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded-lg bg-forest-800 text-forest-300 touch-manipulation disabled:opacity-50"
          >
            {loading ? "…" : "↻"}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.months}
              type="button"
              onClick={() => setMonths(opt.months)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation ${
                months === opt.months
                  ? "bg-sky-600 text-white"
                  : "bg-forest-800 text-forest-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-300 bg-red-950/30 rounded-lg p-3">
            {error}
          </p>
        )}

        {data && !loading && (!data.points || data.points.length === 0) && (
          <p className="text-xs text-amber-300 bg-amber-950/20 rounded-lg p-3">
            Nessun dato per il periodo. Prova un intervallo più breve o aggiorna.
          </p>
        )}

        {data && !loading && data.points?.length > 0 && (
          <>
            <p className="text-[10px] text-forest-500">
              {data.startDate} → {data.endDate} · {data.points.length} giorni ·{" "}
              {data.source}
            </p>
            <WeatherHistoryChart history={data} compact={compact} />
          </>
        )}
      </section>

      {/* TASK 2 — Funghi spia */}
      <section className="rounded-xl border border-amber-500/25 bg-amber-950/10 p-3 md:p-4 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-amber-200">
            Radar dei Funghi Spia
          </h2>
          <p className="text-[11px] text-forest-400 leading-relaxed mt-2">
            {SPY_MUSHROOM_GUIDE_INTRO}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {SPY_MUSHROOMS.map((spy) => (
            <a
              key={spy.id}
              href={spy.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2.5 rounded-lg border border-forest-700/40 bg-forest-950/50 p-2.5 hover:border-amber-500/30 touch-manipulation"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spy.imageUrl}
                alt=""
                className="w-14 h-14 rounded-lg object-cover bg-forest-900 shrink-0"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-forest-100">
                  {spy.commonName}
                </p>
                <p className="text-[9px] italic text-forest-500">
                  {spy.scientificName}
                </p>
                <p className="text-[10px] text-forest-400 line-clamp-2 mt-0.5">
                  {spy.indicates}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-2">
            Carica foto fungo spia
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-4 text-center cursor-pointer touch-manipulation transition-colors ${
              dragOver
                ? "border-amber-400 bg-amber-950/30"
                : "border-forest-600/50 bg-forest-950/40 hover:border-amber-500/40"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
              }}
            />
            <p className="text-2xl mb-1">📷</p>
            <p className="text-xs text-forest-300">
              Trascina un&apos;immagine o tocca per selezionare
            </p>
          </div>

          {previewUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-forest-700/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Anteprima fungo"
                className="w-full max-h-40 object-contain bg-forest-950"
              />
            </div>
          )}

          {scanning && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-200">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Analisi fungo spia in corso…
            </div>
          )}

          {report && !scanning && (
            <div className="mt-4 space-y-3 rounded-xl border border-mushroom-500/30 bg-forest-950/60 p-3">
              <div>
                <p className="text-[10px] uppercase text-mushroom-400">
                  Riconosciuto (simulazione)
                </p>
                <p className="text-sm font-bold text-forest-100">
                  {report.recognized.commonName}
                </p>
                <p className="text-[10px] italic text-forest-500">
                  {report.recognized.scientificName}
                </p>
                <p
                  className={`text-xs font-semibold mt-1 ${optimismColor[report.optimism]}`}
                >
                  Outlook: {report.optimism.toUpperCase()} · Pioggia 14 gg:{" "}
                  {report.rain14d} mm · Umidità: {report.avgHumidity14d}%
                </p>
              </div>

              {report.horizons.map((h) => (
                <div
                  key={h.days}
                  className="rounded-lg bg-forest-900/80 border border-forest-700/40 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-amber-200">
                      {h.title}
                    </p>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                        h.confidence === "alta"
                          ? "bg-green-900/50 text-green-300"
                          : h.confidence === "media"
                            ? "bg-amber-900/40 text-amber-200"
                            : "bg-forest-800 text-forest-400"
                      }`}
                    >
                      {h.confidence}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-300 leading-relaxed">
                    {h.forecast}
                  </p>
                </div>
              ))}

              <p className="text-[10px] text-forest-500 leading-relaxed">
                {report.note}
              </p>
            </div>
          )}

          {!data && !loading && previewUrl && !scanning && (
            <p className="text-[11px] text-amber-300 mt-2">
              Attendi il caricamento del meteo storico per la previsione.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
