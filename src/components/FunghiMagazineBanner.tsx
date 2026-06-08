"use client";

import { useState } from "react";
import FunghiMagazineContent from "./FunghiMagazineContent";
import { FM_WEATHER_LIVE } from "@/lib/funghimagazineData";

export default function FunghiMagazineBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="hidden md:block absolute top-[340px] left-4 z-[1000] pointer-events-auto w-56">
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

        {!expanded && (
          <div className="px-4 pb-3">
            <p className="text-xs text-forest-200 leading-relaxed line-clamp-2">
              {FM_WEATHER_LIVE.headline}
            </p>
          </div>
        )}

        {expanded && (
          <div className="border-t border-forest-700/40 px-4 py-3 max-h-64 overflow-y-auto">
            <FunghiMagazineContent />
          </div>
        )}
      </div>
    </div>
  );
}
