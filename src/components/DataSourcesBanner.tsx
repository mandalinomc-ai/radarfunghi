"use client";

import { useState } from "react";
import type { SourceStatus } from "@/lib/dataSources";
import { formatSourceAge } from "@/lib/dataSources";

interface DataSourcesBannerProps {
  sources: SourceStatus[];
  lastUpdate: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenAllSources?: () => void;
}

export default function DataSourcesBanner({
  sources,
  lastUpdate,
  loading,
  error,
  onRefresh,
  onOpenAllSources,
}: DataSourcesBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const liveSource = sources.find((s) => s.id === "open-meteo");

  return (
    <div className="hidden md:block absolute left-[332px] right-16 bottom-4 z-[999] pointer-events-auto max-w-[280px]">
      <div className="bg-forest-900/95 backdrop-blur-md border border-forest-600/40 rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-forest-800/50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {loading ? (
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500 animate-pulse" />
              ) : error ? (
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </>
              )}
            </span>
            <div className="text-left min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-forest-400 font-semibold">
                Meteo live · fonti verificate
              </p>
              <p className="text-[11px] text-forest-300 truncate">
                {loading
                  ? "Aggiornamento..."
                  : lastUpdate
                    ? `Meteo ${formatSourceAge(liveSource?.ageMinutes ?? 0)}`
                    : "In attesa"}
              </p>
            </div>
          </div>
          <span className="text-forest-400 text-xs shrink-0">{expanded ? "▲" : "▼"}</span>
        </button>

        {expanded && (
          <div className="border-t border-forest-700/40 px-3 py-2 max-h-48 overflow-y-auto space-y-1.5">
            {sources.map((src) => (
              <a
                key={src.id}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg bg-forest-950/50 border border-forest-700/30 hover:border-mushroom-500/30 text-xs text-forest-200 truncate"
              >
                {src.shortName}
              </a>
            ))}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="w-full mt-1 py-2 rounded-lg text-xs font-medium bg-forest-800 text-forest-300 hover:bg-forest-700 disabled:opacity-50"
            >
              {loading ? "..." : "Aggiorna meteo"}
            </button>
            {onOpenAllSources && (
              <button
                type="button"
                onClick={onOpenAllSources}
                className="w-full py-2 rounded-lg text-xs font-medium bg-mushroom-600/30 text-mushroom-200 hover:bg-mushroom-600/40 border border-mushroom-500/30"
              >
                Catalogo fonti (verifica algoritmica)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
