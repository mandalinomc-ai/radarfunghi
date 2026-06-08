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
import MobileBottomBar from "./MobileBottomBar";
import MobileSheet from "./MobileSheet";
import SpeciesFilterContent from "./SpeciesFilterContent";
import FunghiMagazineContent from "./FunghiMagazineContent";
import LegendContent from "./LegendContent";

const MushroomMap = dynamic(() => import("./MushroomMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-forest-950">
      <div className="text-center px-4">
        <div className="w-10 h-10 border-2 border-mushroom-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-forest-400 text-sm">Caricamento mappa...</p>
      </div>
    </div>
  ),
});

type MobilePanel = "filter" | "fm" | "legend" | null;

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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

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
    setMobilePanel(null);
  }, []);

  const handleBeginnerGuide = useCallback(() => {
    setGuideLoading(true);
    setBeginnerOpen(true);
    setSelectedHotspot(null);
    setMobilePanel(null);
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

  const handleSpeciesChange = useCallback((species: MushroomSpecies | "all") => {
    setActiveSpecies(species);
    setMobilePanel(null);
  }, []);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-forest-950 touch-manipulation">
      <div
        className={`absolute inset-0 ${
          selectedHotspot
            ? "bottom-[132px] md:bottom-[120px]"
            : "bottom-[132px] md:bottom-[120px]"
        }`}
      >
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
        onSpeciesChange={handleSpeciesChange}
      />

      <FunghiMagazineBanner />

      <MobileBottomBar
        onOpenFilters={() => setMobilePanel("filter")}
        onOpenFM={() => setMobilePanel("fm")}
        onOpenLegend={() => setMobilePanel("legend")}
      />

      <MobileSheet
        open={mobilePanel === "filter"}
        onClose={() => setMobilePanel(null)}
        title="Filtra specie"
      >
        <SpeciesFilterContent
          activeSpecies={activeSpecies}
          onSpeciesChange={handleSpeciesChange}
        />
      </MobileSheet>

      <MobileSheet
        open={mobilePanel === "fm"}
        onClose={() => setMobilePanel(null)}
        title="Funghimagazine Live"
      >
        <FunghiMagazineContent />
      </MobileSheet>

      <MobileSheet
        open={mobilePanel === "legend"}
        onClose={() => setMobilePanel(null)}
        title="Legenda mappa"
      >
        <LegendContent />
      </MobileSheet>

      <BeginnerGuidePanel
        roadmap={beginnerRoadmap}
        isOpen={beginnerOpen}
        onClose={() => {
          setBeginnerOpen(false);
          setBeginnerRoadmap(null);
        }}
        onGenerate={handleBeginnerGuide}
        isLoading={guideLoading}
        hasDetailOpen={!!selectedHotspot}
      />

      <div className="hidden md:block absolute bottom-[120px] right-4 z-[1000] pointer-events-auto">
        <div className="bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl p-3 shadow-2xl">
          <LegendContent />
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
