"use client";

import { useState } from "react";
import {
  FM_NATIONAL_REPORT,
  FM_SOURCE,
  FM_WEATHER_LIVE,
  FM_TRAFFIC_LIGHT_COLORS,
  FM_TRAFFIC_LIGHT_LABELS,
  FM_REGIONAL_STATUS,
} from "@/lib/funghimagazineData";

export default function FunghiMagazineBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute top-[340px] left-4 z-[1000] pointer-events-auto w-56">
      <div className="bg-forest-900/95 backdrop-blur-md border border-mushroom-500/30 rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-forest-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-mushroom-400 font-semibold">
                Live da Funghimagazine
              </p>
              <p className="text-xs text-forest-300">{FM_WEATHER_LIVE.date}</p>
            </div>
          </div>
          <span className="text-forest-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </button>

        <div className="px-4 pb-3">
          <p className="text-xs text-forest-200 leading-relaxed">
            {FM_WEATHER_LIVE.headline}
          </p>
        </div>

        {expanded && (
          <div className="border-t border-forest-700/40 px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-1">
                Semaforo nazionale
              </p>
              <p className="text-xs text-forest-300">
                {FM_NATIONAL_REPORT.summary}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-1.5">
                Le nostre zone
              </p>
              {FM_REGIONAL_STATUS.map((r) => (
                <div
                  key={r.region}
                  className="flex items-start gap-2 mb-2"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{
                      backgroundColor:
                        FM_TRAFFIC_LIGHT_COLORS[r.trafficLight],
                    }}
                  />
                  <div>
                    <p className="text-xs font-medium text-forest-200">
                      {r.region}
                    </p>
                    <p className="text-[10px] text-forest-500">
                      {FM_TRAFFIC_LIGHT_LABELS[r.trafficLight]}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={FM_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] text-mushroom-400 hover:text-mushroom-300 underline"
            >
              Fonte: {FM_SOURCE.name} ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
