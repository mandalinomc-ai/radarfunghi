"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapHotspot } from "@/lib/types";
import type { GeoPoint } from "@/lib/geoUtils";
import type { ServiceTier } from "@/lib/tierUtils";
import { isPremiumTier } from "@/lib/tierUtils";
import { buildNavigationSummary } from "@/lib/bearingUtils";
import { getGoogleMapsParkingLink } from "@/lib/mapUtils";
import { useDeviceCompass } from "@/hooks/useDeviceCompass";
import { useLivePosition } from "@/hooks/useLivePosition";
import CompassRose from "./CompassRose";
import TerritoryGuideSection from "./TerritoryGuideSection";

type GuideTab = "compass" | "territory";

interface CompassGuidePanelProps {
  hotspot: MapHotspot | null;
  origin: GeoPoint;
  tier?: ServiceTier;
  initialTab?: GuideTab;
}

export default function CompassGuidePanel({
  hotspot,
  origin,
  tier = "free",
  initialTab = "compass",
}: CompassGuidePanelProps) {
  const [tab, setTab] = useState<GuideTab>(initialTab);
  const [useLiveGps, setUseLiveGps] = useState(false);

  const compass = useDeviceCompass(tab === "compass");
  const live = useLivePosition(useLiveGps && tab === "compass");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, hotspot?.zone.id]);

  const navFrom = useLiveGps && live.position ? live.position : origin;

  const target = useMemo(() => {
    if (!hotspot) return null;
    const { zone } = hotspot;
    const premium = isPremiumTier(tier);
    return {
      lat: premium ? zone.lat : zone.parkingLat,
      lng: premium ? zone.lng : zone.parkingLng,
      label: zone.name,
      parking: true,
    };
  }, [hotspot, tier]);

  const summary = useMemo(() => {
    if (!target) return null;
    return buildNavigationSummary(navFrom, target.lat, target.lng);
  }, [navFrom, target]);

  if (!hotspot || !target || !summary) {
    return (
      <div className="p-4 text-center text-sm text-forest-400 space-y-2">
        <p>Seleziona una zona sulla mappa per aprire bussola e guida territorio.</p>
        <p className="text-[11px] text-forest-500">
          Oppure tocca un hotspot colorato sulla mappa, poi riapri questo pannello.
        </p>
      </div>
    );
  }

  const mapsUrl = getGoogleMapsParkingLink(target.lat, target.lng);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex gap-1 p-1 mx-1 mt-1 rounded-xl bg-forest-950/80 border border-forest-700/40 shrink-0">
        <TabBtn
          active={tab === "compass"}
          onClick={() => setTab("compass")}
          label="🧭 Bussola"
        />
        <TabBtn
          active={tab === "territory"}
          onClick={() => setTab("territory")}
          label="🗺️ Territorio"
        />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
        {tab === "compass" ? (
          <>
            <div className="rounded-xl bg-forest-950/60 border border-forest-700/40 p-3 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-forest-500">
                Destinazione
              </p>
              <p className="text-sm font-semibold text-forest-100">
                {target.label}
              </p>
              <p className="text-[11px] text-forest-400">
                Da: <strong>{navFrom.name}</strong>
                {live.position?.accuracyMeters != null &&
                  ` (±${live.position.accuracyMeters} m)`}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUseLiveGps((v) => !v)}
                  className={`text-[11px] px-3 py-2 rounded-lg touch-manipulation font-medium ${
                    useLiveGps
                      ? "bg-green-800/50 text-green-200"
                      : "bg-forest-800 text-forest-300"
                  }`}
                >
                  {useLiveGps ? "📍 GPS live attivo" : "Usa GPS live"}
                </button>
                {useLiveGps && (
                  <button
                    type="button"
                    onClick={live.refreshOnce}
                    disabled={live.loading}
                    className="text-[11px] px-3 py-2 rounded-lg bg-forest-800 text-forest-300 touch-manipulation"
                  >
                    {live.loading ? "…" : "Aggiorna pos."}
                  </button>
                )}
                {!compass.supported && compass.permission === "prompt" && (
                  <button
                    type="button"
                    onClick={() => compass.requestPermission()}
                    className="text-[11px] px-3 py-2 rounded-lg bg-amber-700/50 text-amber-100 touch-manipulation font-medium"
                  >
                    Attiva bussola
                  </button>
                )}
              </div>
              {(live.error || compass.error) && (
                <p className="text-[11px] text-amber-300">
                  {live.error ?? compass.error}
                </p>
              )}
            </div>

            <CompassRose
              heading={compass.heading}
              targetBearing={summary.bearingDeg}
              distanceKm={summary.distanceKm}
              targetLabel={target.label}
            />

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-forest-950 font-bold text-sm text-center touch-manipulation"
            >
              Avvia navigazione Google Maps
            </a>

            <p className="text-[10px] text-forest-600 text-center leading-relaxed">
              ~{summary.driveMinutes} min stimati · versante{" "}
              {hotspot.zone.exposure.toUpperCase()} · parcheggio poi a piedi in
              bosco
            </p>
          </>
        ) : (
          <TerritoryGuideSection
            zone={hotspot.zone}
            species={hotspot.activeSpecies}
          />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold touch-manipulation transition-colors ${
        active
          ? "bg-amber-600/30 text-amber-100 border border-amber-500/40"
          : "text-forest-400 hover:bg-forest-800/50"
      }`}
    >
      {label}
    </button>
  );
}
