"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MapHotspot, MushroomSpecies } from "@/lib/types";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { buildHotspots } from "@/lib/predictionEngine";
import { generateBeginnerRoadmap, type BeginnerRoadmap } from "@/lib/beginnerGuide";
import Header from "./Header";
import SpeciesFilter from "./SpeciesFilter";
import TimelineSlider from "./TimelineSlider";
import LocationDetailPanel from "./LocationDetailPanel";
import FunghiMagazineBanner from "./FunghiMagazineBanner";
import BeginnerGuidePanel from "./BeginnerGuidePanel";

const MushroomMap = dynamic(() => import("./MushroomMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-forest-950">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-mushroom-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-forest-400 text-sm">Caricamento mappa satellitare...</p>
      </div>
    </div>
  ),
});

export default function MushroomRadarApp() {
  const [activeSpecies, setActiveSpecies] = useState<MushroomSpecies | "all">(
    "all"
  );
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(6);
  const [selectedHotspot, setSelectedHotspot] = useState<MapHotspot | null>(
    null
  );
  const [beginnerOpen, setBeginnerOpen] = useState(false);
  const [beginnerRoadmap, setBeginnerRoadmap] = useState<BeginnerRoadmap | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);

  const hotspots = useMemo(
    () => buildHotspots(FUNGAL_ZONES, activeSpecies, hour, dayOffset),
    [activeSpecies, hour, dayOffset]
  );

  const avgScore = useMemo(() => {
    if (hotspots.length === 0) return 0;
    const sum = hotspots.reduce((acc, h) => acc + h.activeScore, 0);
    return Math.round(sum / hotspots.length);
  }, [hotspots]);

  const activeHotspots = useMemo(
    () => hotspots.filter((h) => h.activeScore >= 40).length,
    [hotspots]
  );

  const handleHotspotClick = useCallback((hotspot: MapHotspot) => {
    setSelectedHotspot(hotspot);
    setBeginnerOpen(false);
  }, []);

  const handleBeginnerGuide = useCallback(() => {
    setGuideLoading(true);
    setBeginnerOpen(true);
    setSelectedHotspot(null);
    setTimeout(() => {
      const roadmap = generateBeginnerRoadmap(hotspots, dayOffset, hour);
      setBeginnerRoadmap(roadmap);
      if (roadmap) {
        const match = hotspots.find(
          (h) => h.zone.name === roadmap.recommendedZone
        );
        if (match) setSelectedHotspot(match);
      }
      setGuideLoading(false);
    }, 600);
  }, [hotspots, dayOffset, hour]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-forest-950">
      <div className="absolute inset-0 bottom-[120px]">
        <MushroomMap
          hotspots={hotspots}
          selectedZoneId={selectedHotspot?.zone.id ?? null}
          onHotspotClick={handleHotspotClick}
        />
      </div>

      <Header
        activeSpecies={activeSpecies}
        avgScore={avgScore}
        hotspotCount={activeHotspots}
      />

      <SpeciesFilter
        activeSpecies={activeSpecies}
        onSpeciesChange={setActiveSpecies}
      />

      <FunghiMagazineBanner />

      <BeginnerGuidePanel
        roadmap={beginnerRoadmap}
        isOpen={beginnerOpen}
        onClose={() => {
          setBeginnerOpen(false);
          setBeginnerRoadmap(null);
        }}
        onGenerate={handleBeginnerGuide}
        isLoading={guideLoading}
      />

      <div className="absolute bottom-[120px] right-4 z-[1000] pointer-events-auto">
        <div className="bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl p-3 shadow-2xl">
          <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
            Legenda probabilità
          </p>
          <div className="space-y-1.5">
            {[
              { label: "Alta (>80%)", color: "rgba(228, 90, 30, 0.8)" },
              { label: "Media (60-80%)", color: "rgba(245, 154, 74, 0.7)" },
              { label: "Moderata (40-60%)", color: "rgba(122, 184, 114, 0.6)" },
              { label: "Bassa (<40%)", color: "rgba(61, 107, 56, 0.4)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-forest-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TimelineSlider
        dayOffset={dayOffset}
        hour={hour}
        onDayChange={setDayOffset}
        onHourChange={setHour}
      />

      <LocationDetailPanel
        hotspot={selectedHotspot}
        currentHour={hour}
        dayOffset={dayOffset}
        onClose={() => setSelectedHotspot(null)}
      />
    </div>
  );
}
