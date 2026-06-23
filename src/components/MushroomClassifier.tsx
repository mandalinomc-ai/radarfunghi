"use client";

import { useCallback, useRef, useState } from "react";
import HealthSafetyBanner from "@/components/HealthSafetyBanner";

interface ClassifyResponse {
  scientificName: string;
  commonName: string;
  edibility: string;
  confidence: number;
  actionPlan: string[];
  legalDisclaimer: string;
  isSpyMushroom: boolean;
  spyHorizons?: { days: number; title: string; forecast: string; confidence: string }[];
}

export default function MushroomClassifier() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const buf = await file.arrayBuffer();
      const b64 = btoa(
        new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "")
      );

      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: b64,
          mimeType: file.type || "image/jpeg",
        }),
      });

      if (!res.ok) throw new Error("Classificazione fallita");
      const data = (await res.json()) as ClassifyResponse;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore scansione");
    } finally {
      setScanning(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 pb-24">
      <div>
        <h1 className="font-display text-2xl text-sage-100">
          Classificatore AI
        </h1>
        <p className="text-sm text-sage-400 mt-1">
          Drag &amp; drop · scansione hi-tech · scheda clinica d&apos;azione
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`enterprise-panel rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer touch-manipulation transition-colors ${
          scanning
            ? "border-neon animate-pulse bg-neon/5"
            : "border-neon/30 hover:border-neon/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void processFile(f);
          }}
        />
        {scanning ? (
          <>
            <div className="scanner-line mx-auto mb-4" />
            <p className="text-neon font-mono text-sm">SCAN IN CORSO…</p>
          </>
        ) : (
          <>
            <p className="text-4xl mb-2">🔬</p>
            <p className="text-sage-200 font-semibold">
              Trascina la foto del fungo
            </p>
            <p className="text-xs text-sage-500 mt-1">o clicca per selezionare</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 enterprise-panel p-3 rounded-xl">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <HealthSafetyBanner />

          <article className="enterprise-panel rounded-2xl p-5 border border-neon/20">
            <p className="text-[10px] uppercase tracking-wider text-neon mb-2">
              Stato &amp; Tossicità
            </p>
            <h2 className="text-xl font-semibold text-sage-100 italic">
              {result.scientificName}
            </h2>
            <p className="text-sage-300">{result.commonName}</p>
            <p className="mt-2 text-sm">
              Commestibilità:{" "}
              <span
                className={
                  result.edibility === "commestibile"
                    ? "text-neon"
                    : "text-red-400"
                }
              >
                {result.edibility}
              </span>{" "}
              · confidenza {result.confidence}%
            </p>
          </article>

          <article className="enterprise-panel rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-wider text-sage-500 mb-2">
              Piano d&apos;azione
            </p>
            <ul className="space-y-2">
              {result.actionPlan.map((step) => (
                <li key={step} className="text-sm text-sage-300 flex gap-2">
                  <span className="text-neon">▸</span> {step}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-sage-600 mt-4">{result.legalDisclaimer}</p>
          </article>

          {result.isSpyMushroom && result.spyHorizons && (
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-amber-300">
                Fungo Spia — finestre predittive
              </p>
              {result.spyHorizons.map((h) => (
                <div
                  key={h.days}
                  className="enterprise-panel rounded-xl p-4 border border-amber-500/30"
                >
                  <p className="text-xs font-bold text-amber-200">{h.title}</p>
                  <p className="text-sm text-sage-300 mt-1">{h.forecast}</p>
                  <p className="text-[10px] text-sage-500 mt-1">
                    Confidenza: {h.confidence}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
