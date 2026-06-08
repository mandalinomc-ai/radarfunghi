"use client";

import {
  FM_NATIONAL_REPORT,
  FM_SOURCE,
  FM_WEATHER_LIVE,
  FM_TRAFFIC_LIGHT_COLORS,
  FM_TRAFFIC_LIGHT_LABELS,
  FM_REGIONAL_STATUS,
} from "@/lib/funghimagazineData";

export default function FunghiMagazineContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <p className="text-xs text-mushroom-400 font-semibold uppercase tracking-wider">
          Live — {FM_WEATHER_LIVE.date}
        </p>
      </div>

      <p className="text-sm text-forest-200 leading-relaxed">
        {FM_WEATHER_LIVE.headline}
      </p>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-1">
          Semaforo nazionale
        </p>
        <p className="text-xs text-forest-300 leading-relaxed">
          {FM_NATIONAL_REPORT.summary}
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-2">
          Le nostre zone
        </p>
        {FM_REGIONAL_STATUS.map((r) => (
          <div key={r.region} className="flex items-start gap-2 mb-3">
            <span
              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
              style={{
                backgroundColor: FM_TRAFFIC_LIGHT_COLORS[r.trafficLight],
              }}
            />
            <div>
              <p className="text-sm font-medium text-forest-200">{r.region}</p>
              <p className="text-xs text-forest-500">
                {FM_TRAFFIC_LIGHT_LABELS[r.trafficLight]}
              </p>
              <p className="text-xs text-forest-400 mt-0.5">{r.summary}</p>
            </div>
          </div>
        ))}
      </div>

      <a
        href={FM_SOURCE.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs text-mushroom-400 underline py-2"
      >
        Fonte: {FM_SOURCE.name} ↗
      </a>
    </div>
  );
}
