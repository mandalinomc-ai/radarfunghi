"use client";

import type { MushroomReport } from "@/lib/types";
import { formatCoordinates } from "@/lib/mapUtils";
import { getSpeciesLabel } from "@/lib/predictionEngine";

const REPORT_TYPE_LABELS: Record<MushroomReport["reportType"], string> = {
  bottata: "Bottata",
  spia: "Spia",
  ritrovamento: "Ritrovamento",
};

interface ReportDetailPanelProps {
  report: MushroomReport | null;
  onClose: () => void;
  className?: string;
}

export default function ReportDetailPanel({
  report,
  onClose,
  className = "",
}: ReportDetailPanelProps) {
  if (!report) return null;

  const date = new Date(report.createdAt);
  const speciesLabel =
    report.species === "sconosciuto"
      ? "Specie non indicata"
      : getSpeciesLabel(report.species);

  return (
    <div
      className={`fixed md:absolute inset-x-2 md:inset-x-auto md:right-14 md:w-[min(320px,calc(100vw-420px))] z-[1003] pointer-events-auto ${className}`}
    >
      <div className="bg-forest-900/98 backdrop-blur-lg border border-green-500/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.photoUrl}
            alt="Foto segnalazione funghi"
            className="w-full h-44 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-sm"
          >
            ✕
          </button>
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-600/90 text-white text-[10px] font-bold uppercase">
            Segnalazione utente
          </span>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-sm font-semibold text-forest-200">
            {REPORT_TYPE_LABELS[report.reportType]} · {speciesLabel}
          </p>
          <p className="text-xs text-forest-400 font-mono">
            {formatCoordinates(report.lat, report.lng)}
          </p>
          {report.accuracyMeters != null && (
            <p className="text-xs text-forest-500">
              Precisione GPS: ±{report.accuracyMeters} m
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
          {report.matchedZoneName && (
            <p className="text-xs text-green-300 border-t border-forest-700/30 pt-2">
              🍄 Zona radar: {report.matchedZoneName}
              {report.matchDistanceKm != null &&
                ` · ${report.matchDistanceKm} km`}
              {report.reliabilityBonus != null &&
                report.reliabilityBonus > 0 &&
                ` · +${Math.round(report.reliabilityBonus * 100)}% affidabilità`}
            </p>
          )}
          {report.validationStatus === "too_far" && (
            <p className="text-xs text-amber-300 border-t border-forest-700/30 pt-2">
              Fuori dalle zone radar note — bonus Sprout non applicato.
            </p>
          )}
          {report.note && (
            <p className="text-xs text-forest-300 italic border-t border-forest-700/30 pt-2">
              {report.note}
            </p>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${report.lat},${report.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-2 py-2 rounded-lg bg-green-700/80 hover:bg-green-600 text-white text-xs font-medium text-center touch-manipulation"
          >
            Apri in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
