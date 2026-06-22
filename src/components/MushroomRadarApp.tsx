"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";

import type { MapHotspot, MushroomSpecies } from "@/lib/types";

import { FUNGAL_ZONES } from "@/lib/mockData";

import { buildCityDualPreview } from "@/lib/cityDayPreview";

import { generateBeginnerGuidePlans, type BeginnerGuideResult } from "@/lib/beginnerGuide";
import { buildHotspots } from "@/lib/predictionEngine";

import { DEFAULT_SEARCH_RADIUS_KM } from "@/lib/benevento";
import type { GeoPoint } from "@/lib/geoUtils";

import {

  type ProbabilityFilter,

} from "@/lib/mapUtils";

import { formatHourRange, type HourRange } from "@/lib/timeRange";

import {

  addDaysISO,

  dayOffsetFromToday,

  todayISO,

} from "@/lib/dateUtils";

import { useLiveZones } from "@/hooks/useLiveZones";
import { useHotspotCalculation } from "@/hooks/useHotspotCalculation";
import { useMushroomReports } from "@/hooks/useMushroomReports";
import type { MushroomReport, SpyZoneMarker } from "@/lib/types";

import {
  AdvancedSearchForm,
  createDefaultSearchCriteria,
  type SearchCriteria,
} from "./AdvancedSearchDrawer";

import CitySearchBar, { CityPreviewContent } from "./CitySearchBar";

import Header from "./Header";

import SearchPanel from "./SearchPanel";

import LocationDetailPanel from "./LocationDetailPanel";

import CertifiedSourcesPanel from "./CertifiedSourcesPanel";

import DataSourcesBanner from "./DataSourcesBanner";

import BeginnerGuidePanel from "./BeginnerGuidePanel";

import { MobileDockToolbar } from "./MobileBottomBar";
import {
  MAP_BOTTOM_MOBILE_COLLAPSED,
  MAP_BOTTOM_MOBILE_COMPACT,
  MAP_BOTTOM_MOBILE_EXPANDED,
  PANEL_ABOVE_DOCK_COLLAPSED,
  PANEL_ABOVE_DOCK_EXPANDED,
} from "@/lib/mobileLayout";

import MobileSheet from "./MobileSheet";

import FunghiMagazineContent from "./FunghiMagazineContent";

import LegendContent from "./LegendContent";
import ReportMushroomSheet from "./ReportMushroomSheet";
import SpyZonePastePanel from "./SpyZonePastePanel";
import SpyZoneDetailPanel from "./SpyZoneDetailPanel";

const WeatherSpyRadarPanel = dynamic(() => import("./WeatherSpyRadarPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8 text-sm text-forest-400">
      Caricamento meteo…
    </div>
  ),
});

import CompassGuidePanel from "./CompassGuidePanel";
import PatentinoGuidePanel from "./PatentinoGuidePanel";
import { useSpyZones } from "@/hooks/useSpyZones";
import ReportDetailPanel from "./ReportDetailPanel";
import MushroomChatPanel from "./MushroomChatPanel";
import { useMushroomChat } from "@/hooks/useMushroomChat";
import type { ChatZoneResult } from "@/lib/mushroomChatEngine";
import { useMushroomRadarContext } from "@/context/MushroomRadarContext";
import { useMapCompactDebounce } from "@/hooks/useMapCompactDebounce";
import DesktopActionRail from "./DesktopActionRail";
import MastroChatFab from "./MastroChatFab";
import SyncToast from "./SyncToast";
import ClimateAlertBox from "./ClimateAlertBox";
import { useClimateAlerts } from "@/hooks/useClimateAlerts";
import {
  loadStoredOrigin,
  loadOriginConfirmed,
  saveStoredOrigin,
  saveOriginConfirmed,
} from "@/lib/originStore";
import OriginSetupModal from "./OriginSetupModal";
import SetupWizardModal from "./SetupWizardModal";
import {
  loadTimeWindowConfirmed,
  saveTimeWindowConfirmed,
  loadOriginParked,
  saveOriginParked,
  loadGuideParked,
  saveGuideParked,
} from "@/lib/setupStore";
import { defaultOrigin } from "@/lib/originStore";
import {
  FORAGING_PRESETS,
  type ForagingPreset,
} from "@/lib/foragingPresets";



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



type MobilePanel = "fm" | "legend" | "sources" | "chat" | "filters" | "cityPreview" | "compass" | "weatherSpy" | "patentino" | null;



export default function MushroomRadarApp() {
  const { tier, maxDayOffset } = useMushroomRadarContext();

  const [criteria, setCriteria] = useState<SearchCriteria>(() => {
    const base = createDefaultSearchCriteria();
    if (typeof window === "undefined") return base;
    const saved = loadStoredOrigin();
    return saved ? { ...base, origin: saved } : base;
  });

  const [rangeKm, setRangeKm] = useState(DEFAULT_SEARCH_RADIUS_KM);

  const [probabilityFilter, setProbabilityFilter] =

    useState<ProbabilityFilter>("all");

  const [selectedHotspot, setSelectedHotspot] = useState<MapHotspot | null>(

    null

  );

  const [beginnerOpen, setBeginnerOpen] = useState(false);

  const [beginnerGuide, setBeginnerGuide] =
    useState<BeginnerGuideResult | null>(null);

  const [guideLoading, setGuideLoading] = useState(false);

  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [fabHintSeen, setFabHintSeen] = useState(false);
  const [originReady, setOriginReady] = useState(false);
  const [originBootstrapped, setOriginBootstrapped] = useState(false);
  const [originEditOpen, setOriginEditOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<"when" | "where">("when");
  const [setupOpen, setSetupOpen] = useState(false);
  const [guideParked, setGuideParked] = useState(false);
  const [guideOpenTrigger, setGuideOpenTrigger] = useState(0);
  const pendingChatMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const timeOk = loadTimeWindowConfirmed();
    const confirmed = loadOriginConfirmed();
    const parked = loadOriginParked();
    const saved = loadStoredOrigin();
    const parkedGuide = loadGuideParked();

    if (saved) {
      setCriteria((prev) => ({ ...prev, origin: saved }));
    }

    if (timeOk && (confirmed || parked)) {
      setOriginReady(true);
      setSetupOpen(false);
    } else if (timeOk) {
      setSetupStep("where");
      setSetupOpen(true);
    } else {
      setSetupStep("when");
      setSetupOpen(true);
    }

    setGuideParked(parkedGuide);
    setOriginBootstrapped(true);
  }, []);

  const openMastroChat = useCallback((initialMessage?: string) => {
    if (!originReady) return;
    setFabHintSeen(true);
    if (initialMessage?.trim()) {
      pendingChatMessageRef.current = initialMessage.trim();
    }
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setChatOpen(true);
      setMobilePanel(null);
    } else {
      setMobilePanel("chat");
      setChatOpen(false);
    }
  }, [originReady]);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  const { mapCompact, onMapDragChange } = useMapCompactDebounce(1500);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [spyZonePanelOpen, setSpyZonePanelOpen] = useState(false);
  const [compassGuideTab, setCompassGuideTab] = useState<"compass" | "territory">("compass");
  const [selectedSpyZone, setSelectedSpyZone] = useState<SpyZoneMarker | null>(
    null
  );
  const [selectedReport, setSelectedReport] = useState<MushroomReport | null>(
    null
  );
  const [reportToast, setReportToast] = useState<string | null>(null);

  const {
    reports: userReports,
    refresh: refreshReports,
    pendingCount,
    syncError,
    dismissSyncError,
  } = useMushroomReports();

  const {
    zones: spyZones,
    refresh: refreshSpyZones,
  } = useSpyZones();



  const {

    zones: liveZones,

    loading: weatherLoading,

    error: weatherError,

    lastUpdate,

    sources,

    liveData,

    refresh,

  } = useLiveZones(FUNGAL_ZONES, criteria.selectedDate, {
    pauseRefresh: chatOpen || mobilePanel === "chat",
  });

  const confirmOrigin = useCallback(
    (origin: GeoPoint) => {
      setCriteria((prev) => ({ ...prev, origin }));
      saveStoredOrigin(origin);
      saveOriginConfirmed();
      saveOriginParked(false);
      setOriginReady(true);
      setOriginEditOpen(false);
      setSetupOpen(false);
      refresh();
    },
    [refresh]
  );

  const parkOrigin = useCallback(() => {
    const base = defaultOrigin();
    setCriteria((prev) => ({ ...prev, origin: base }));
    saveStoredOrigin(base);
    saveOriginParked(true);
    saveOriginConfirmed();
    setOriginReady(true);
    setSetupOpen(false);
    refresh();
  }, [refresh]);

  const openBeginnerGuide = useCallback(() => {
    setGuideParked(false);
    saveGuideParked(false);
    setBeginnerOpen(false);
    setBeginnerGuide(null);
    setGuideOpenTrigger((n) => n + 1);
  }, []);

  const handleConfirmTime = useCallback(() => {
    saveTimeWindowConfirmed();
    setSetupStep("where");
  }, []);

  const {
    zonesByRegion,
    zonesInRange,
    hotspots,
    filteredHotspots,
    bestHotspot,
    avgScore,
    activeHotspots,
  } = useHotspotCalculation({
    liveZones,
    origin: criteria.origin,
    includedRegions: criteria.includedRegions,
    rangeKm,
    species: criteria.species,
    hourRange: criteria.hourRange,
    selectedDate: criteria.selectedDate,
    probabilityFilter,
    minAltitude: criteria.minAltitude,
    maxAltitude: criteria.maxAltitude,
    sortMode: criteria.sortMode,
  });

  const { alerts: climateAlerts, hasFreshChange: climateChangePulse } =
    useClimateAlerts(
      zonesInRange,
      filteredHotspots,
      criteria.selectedDate,
      lastUpdate
    );

  const cityPreview = useMemo(
    () =>
      buildCityDualPreview(
        zonesInRange,
        criteria.origin.name,
        criteria.species,
        criteria.hourRange
      ),
    [zonesInRange, criteria.origin.name, criteria.species, criteria.hourRange]
  );

  const chatContext = useMemo(
    () => ({
      liveZones,
      hotspots: filteredHotspots,
      criteria,
      defaultRangeKm: rangeKm,
      lastUpdate,
      liveData,
    }),
    [liveZones, filteredHotspots, criteria, rangeKm, lastUpdate, liveData]
  );

  const { messages, loading: chatLoading, geminiLoading, sendMessage, clearChat } =
    useMushroomChat(chatContext, {
      onRecommendedZone: (zoneId) => {
        const match = filteredHotspots.find((h) => h.zone.id === zoneId);
        if (match) {
          setSelectedHotspot(match);
          setSelectedReport(null);
        }
      },
    });

  useEffect(() => {
    const chatVisible = chatOpen || mobilePanel === "chat";
    if (!chatVisible || !pendingChatMessageRef.current) return;
    const msg = pendingChatMessageRef.current;
    pendingChatMessageRef.current = null;
    const timer = window.setTimeout(() => {
      void sendMessage(msg);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [chatOpen, mobilePanel, sendMessage]);

  const handleChatZoneSelect = useCallback(
    (result: ChatZoneResult) => {
      setCriteria((prev) => ({
        ...prev,
        selectedDate: result.date,
        species: result.species,
      }));
      const match = filteredHotspots.find((h) => h.zone.id === result.zoneId);
      if (match) {
        setSelectedHotspot(match);
        setSelectedReport(null);
      }
      setChatOpen(false);
      setMobilePanel(null);
    },
    [filteredHotspots]
  );



  useEffect(() => {

    if (

      selectedHotspot &&

      !filteredHotspots.some((h) => h.zone.id === selectedHotspot.zone.id)

    ) {

      setSelectedHotspot(null);

    }

  }, [filteredHotspots, selectedHotspot]);

  useEffect(() => {
    const offset = dayOffsetFromToday(criteria.selectedDate);
    if (offset > maxDayOffset) {
      setCriteria((prev) => ({
        ...prev,
        selectedDate: addDaysISO(todayISO(), maxDayOffset),
      }));
    }
  }, [maxDayOffset, criteria.selectedDate]);

  useEffect(() => {
    if (originReady) {
      saveStoredOrigin(criteria.origin);
    }
  }, [criteria.origin, originReady]);

  const handleApplyForagingPreset = useCallback((preset: ForagingPreset) => {
    setCriteria((prev) => ({
      ...prev,
      ...(preset.hourRange ? { hourRange: preset.hourRange } : {}),
      ...(preset.species ? { species: preset.species } : {}),
      ...(preset.minAltitude != null ? { minAltitude: preset.minAltitude } : {}),
      ...(preset.maxAltitude != null ? { maxAltitude: preset.maxAltitude } : {}),
    }));
    if (preset.probabilityFilter) {
      setProbabilityFilter(preset.probabilityFilter);
    }
  }, []);

  const handleGoToBestHotspot = useCallback(() => {
    if (!originReady || !bestHotspot) return;
    setSelectedHotspot(bestHotspot);
    setSelectedReport(null);
    setMobilePanel(null);
  }, [bestHotspot, originReady]);

  const handleHotspotClick = useCallback((hotspot: MapHotspot) => {

    setSelectedHotspot(hotspot);

    setSelectedReport(null);
    setSelectedSpyZone(null);

    setBeginnerOpen(false);

    setMobilePanel(null);

  }, []);



  const handleReportClick = useCallback((report: MushroomReport) => {

    setSelectedReport(report);

    setSelectedHotspot(null);
    setSelectedSpyZone(null);

    setBeginnerOpen(false);

    setMobilePanel(null);

  }, []);



  const handleOpenCompassGuide = useCallback(
    (tab: "compass" | "territory" = "compass") => {
      if (!originReady) return;
      setCompassGuideTab(tab);
      setMobilePanel("compass");
      setChatOpen(false);
      setBeginnerOpen(false);
    },
    [originReady]
  );

  const handleSpyZoneClick = useCallback((zone: SpyZoneMarker) => {
    setSelectedSpyZone(zone);
    setSelectedHotspot(null);
    setSelectedReport(null);
    setMobilePanel(null);
  }, []);

  const handleSpyZonePublished = useCallback(
    (zone: SpyZoneMarker) => {
      refreshSpyZones();
      setSelectedSpyZone(zone);
      setSelectedHotspot(null);
      setSelectedReport(null);
      setReportToast(`Zona spia pubblicata: ${zone.label}`);
    },
    [refreshSpyZones]
  );

  const handleReportSuccess = useCallback(
    (
      report: MushroomReport,
      validation?: { mastroMessage: string; status: string }
    ) => {
      refreshReports();
      refresh();
      setSelectedReport(report);
      setSelectedSpyZone(null);
      if (validation?.mastroMessage) {
        setReportToast(validation.mastroMessage.replace(/\*\*/g, ""));
      }
    },
    [refreshReports, refresh]
  );



  const handleBeginnerGuide = useCallback(
    (targetSpecies: MushroomSpecies[]) => {
      if (!originReady) return;

      setGuideLoading(true);
      setBeginnerOpen(true);
      setSelectedHotspot(null);
      setMobilePanel(null);

      setTimeout(() => {
        const guideHotspots = buildHotspots(
          zonesInRange,
          "all",
          criteria.hourRange,
          criteria.selectedDate
        );

        const result = generateBeginnerGuidePlans(
          guideHotspots,
          criteria.selectedDate,
          criteria.hourRange,
          criteria.origin,
          tier,
          targetSpecies
        );

        setBeginnerGuide(result);

        if (result) {
          const bestPlan =
            result.plans.find((p) => p.viable) ?? result.plans[0];
          if (bestPlan?.recommendedZone !== "—") {
            const match = guideHotspots.find(
              (h) => h.zone.name === bestPlan.recommendedZone
            );
            if (match) setSelectedHotspot(match);
          }
        }

        setGuideLoading(false);
      }, 600);
    },
    [zonesInRange, criteria, originReady, tier]
  );



  const handleQuickDay = useCallback((offset: number) => {
    const clamped = Math.min(Math.max(0, offset), maxDayOffset);
    setCriteria((prev) => ({
      ...prev,
      selectedDate: addDaysISO(todayISO(), clamped),
    }));
  }, [maxDayOffset]);



  const handleHourRangeChange = useCallback((hourRange: HourRange) => {

    setCriteria((prev) => ({ ...prev, hourRange }));

  }, []);



  const mapBottomClass = mobileSearchExpanded
    ? MAP_BOTTOM_MOBILE_EXPANDED
    : mapCompact
      ? MAP_BOTTOM_MOBILE_COMPACT
      : MAP_BOTTOM_MOBILE_COLLAPSED;

  const panelBottomClass = mobileSearchExpanded
    ? PANEL_ABOVE_DOCK_EXPANDED
    : PANEL_ABOVE_DOCK_COLLAPSED;



  return (

    <div
      className={`relative w-full h-dvh overflow-hidden bg-forest-950 touch-manipulation ${
        originBootstrapped && setupOpen ? "pointer-events-none" : ""
      }`}
    >

      <SyncToast message={syncError} onDismiss={dismissSyncError} />
      <SyncToast
        message={reportToast}
        onDismiss={() => setReportToast(null)}
        tone="success"
      />

      <div
        className={`absolute inset-0 md:left-[320px] md:right-14 md:top-[72px] md:bottom-0 ${mapBottomClass}`}
      >

        <ClimateAlertBox
          alerts={climateAlerts}
          hasFreshChange={climateChangePulse}
          loading={weatherLoading}
          lastUpdate={lastUpdate}
        />

        <MushroomMap

          hotspots={filteredHotspots}

          selectedZoneId={selectedHotspot?.zone.id ?? null}

          onHotspotClick={handleHotspotClick}

          rangeKm={rangeKm}

          origin={criteria.origin}

          userReports={userReports}

          selectedReportId={selectedReport?.id ?? null}

          onReportClick={handleReportClick}

          spyZones={spyZones}
          selectedSpyZoneId={selectedSpyZone?.id ?? null}
          onSpyZoneClick={handleSpyZoneClick}

          tier={tier}

          onMapDragChange={onMapDragChange}

        />

      </div>



      <Header

        avgScore={avgScore}

        hotspotCount={activeHotspots}

        rangeKm={rangeKm}

        visibleZones={zonesInRange.length}

        originName={criteria.origin.name}

        dataLoading={weatherLoading}
        lastUpdate={lastUpdate}
        liveData={liveData}
        weatherError={weatherError}
        originReady={originReady}
        onChangeOrigin={() => setOriginEditOpen(true)}

      />

      <CitySearchBar
        origin={criteria.origin}
        rangeKm={rangeKm}
        preview={cityPreview}
        loading={weatherLoading}
        onOriginChange={(origin) => {
          if (!originReady) return;
          setCriteria((prev) => ({ ...prev, origin }));
          refresh();
        }}
        onSearch={refresh}
        onFocusDay={(offset) => handleQuickDay(offset)}
        onOpenPreviewSheet={() => setMobilePanel("cityPreview")}
      />

      <DataSourcesBanner
        sources={sources}
        lastUpdate={lastUpdate}
        loading={weatherLoading}
        error={weatherError}
        onRefresh={refresh}
        onOpenAllSources={() => setMobilePanel("sources")}
      />



      <SearchPanel

        selectedDate={criteria.selectedDate}

        hourRange={criteria.hourRange}

        rangeKm={rangeKm}

        probabilityFilter={probabilityFilter}

        visibleZones={zonesInRange.length}

        totalZones={zonesByRegion.length}

        visibleHotspots={filteredHotspots.length}

        totalHotspots={hotspots.length}

        originName={criteria.origin.name}

        species={criteria.species}

        onQuickDay={handleQuickDay}

        onHourRangeChange={handleHourRangeChange}

        onRangeChange={setRangeKm}

        onProbabilityFilterChange={setProbabilityFilter}

        onMobileExpandedChange={setMobileSearchExpanded}

        maxDayOffset={maxDayOffset}

        mapCompact={mapCompact}

        criteria={criteria}

        onCriteriaChange={(next) => {
          if (!originReady && next.origin !== criteria.origin) return;
          setCriteria(next);
        }}

        onSearch={refresh}

        onApplyPreset={handleApplyForagingPreset}

        onGoToBest={handleGoToBestHotspot}

        bestHotspotScore={bestHotspot?.activeScore ?? 0}

        hasBestHotspot={!!bestHotspot && bestHotspot.activeScore >= 28}

        onOpenFilters={() => setMobilePanel("filters")}
        onOpenPatentino={() => setMobilePanel("patentino")}

        mobileToolbar={
          <MobileDockToolbar
            onOpenChat={openMastroChat}
            onOpenGuide={openBeginnerGuide}
            onOpenFilters={() => setMobilePanel("filters")}
            onOpenReport={() => setReportSheetOpen(true)}
            onOpenSpyZone={() => setSpyZonePanelOpen(true)}
            onOpenCompass={() => handleOpenCompassGuide("compass")}
            onOpenWeatherSpy={() => setMobilePanel("weatherSpy")}
            onOpenSources={() => setMobilePanel("sources")}
            onOpenFM={() => setMobilePanel("fm")}
            onOpenLegend={() => setMobilePanel("legend")}
            onOpenPatentino={() => setMobilePanel("patentino")}
            reportCount={userReports.length}
            spyZoneCount={spyZones.length}
            pendingCount={pendingCount}
          />
        }

      />

      <DesktopActionRail
        onOpenChat={openMastroChat}
        onOpenReport={() => setReportSheetOpen(true)}
        onOpenSpyZone={() => setSpyZonePanelOpen(true)}
        onOpenCompass={() => handleOpenCompassGuide("compass")}
        onOpenWeatherSpy={() => setMobilePanel("weatherSpy")}
        onOpenGuide={openBeginnerGuide}
        onOpenLegend={() => setMobilePanel("legend")}
        onOpenPatentino={() => setMobilePanel("patentino")}
        reportCount={userReports.length}
        spyZoneCount={spyZones.length}
        pendingCount={pendingCount}
        hidden={chatOpen || mobilePanel === "chat"}
      />

      <MastroChatFab
        onClick={openMastroChat}
        hidden={!originReady || chatOpen || mobilePanel === "chat"}
        showRecommended={!fabHintSeen}
      />

      <ReportMushroomSheet

        open={reportSheetOpen}

        onClose={() => setReportSheetOpen(false)}

        onSuccess={handleReportSuccess}

        onQueued={refreshReports}

      />

      <SpyZonePastePanel
        open={spyZonePanelOpen}
        onClose={() => setSpyZonePanelOpen(false)}
        onPublished={handleSpyZonePublished}
        existingZones={spyZones}
      />

      <SpyZoneDetailPanel
        zone={selectedSpyZone}
        onClose={() => setSelectedSpyZone(null)}
        className="bottom-[210px] md:bottom-[195px]"
      />



      <ReportDetailPanel

        report={selectedReport}

        onClose={() => setSelectedReport(null)}

        className={`${panelBottomClass} md:top-[80px] md:right-14`}

      />



      <MobileSheet

        open={mobilePanel === "filters"}

        onClose={() => setMobilePanel(null)}

        title="Filtri avanzati"

      >

        <AdvancedSearchForm

          criteria={criteria}

          onCriteriaChange={setCriteria}

          onSearch={refresh}

          onDone={() => setMobilePanel(null)}

        />

      </MobileSheet>



      <MobileSheet

        open={mobilePanel === "cityPreview" && !!cityPreview}

        onClose={() => setMobilePanel(null)}

        title="Oggi e domani"

      >

        {cityPreview && (

          <CityPreviewContent

            preview={cityPreview}

            loading={weatherLoading}

            lastSearched={criteria.origin.name}

            onFocusDay={(offset) => {

              handleQuickDay(offset);

              setMobilePanel(null);

            }}

          />

        )}

      </MobileSheet>



      <MobileSheet

        open={mobilePanel === "chat"}

        onClose={() => setMobilePanel(null)}

        title="Mastro Fungaiolo"

        layout="panel"

      >

        <MushroomChatPanel
          messages={messages}
          loading={chatLoading}
          geminiLoading={geminiLoading}
          studyWindowLabel={formatHourRange(criteria.hourRange)}
          onSend={sendMessage}
          onClear={clearChat}
          onZoneSelect={handleChatZoneSelect}
          compact
          className="min-h-0 flex-1"
        />

      </MobileSheet>



      <MobileSheet

        open={mobilePanel === "fm"}

        onClose={() => setMobilePanel(null)}

        title="Funghimagazine"

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



      <MobileSheet
        open={mobilePanel === "sources"}
        onClose={() => setMobilePanel(null)}
        title="Fonti certificate"
      >
        <div className="space-y-3">
          <CertifiedSourcesPanel />
          <button
            onClick={refresh}
            disabled={weatherLoading}
            className="w-full py-2.5 rounded-xl bg-mushroom-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {weatherLoading ? "Aggiornamento meteo..." : "Aggiorna dati meteo ora"}
          </button>
        </div>
      </MobileSheet>



      <MobileSheet
        open={mobilePanel === "weatherSpy"}
        onClose={() => setMobilePanel(null)}
        title="Meteo storico & funghi spia"
        layout="panel"
      >
        <WeatherSpyRadarPanel
          origin={criteria.origin}
          originName={criteria.origin.name}
        />
      </MobileSheet>

      <MobileSheet
        open={mobilePanel === "patentino"}
        onClose={() => setMobilePanel(null)}
        title="Patentino / Tesserino funghi"
      >
        <PatentinoGuidePanel />
      </MobileSheet>

      <MobileSheet
        open={mobilePanel === "compass"}
        onClose={() => setMobilePanel(null)}
        title="Bussola & guida territorio"
        layout="panel"
      >
        <CompassGuidePanel
          hotspot={selectedHotspot ?? bestHotspot}
          origin={criteria.origin}
          tier={tier}
          initialTab={compassGuideTab}
        />
      </MobileSheet>



      <BeginnerGuidePanel
        guideResult={beginnerGuide}
        isOpen={beginnerOpen}
        parked={guideParked}
        onClose={() => {
          setBeginnerOpen(false);
          setBeginnerGuide(null);
          setGuideLoading(false);
        }}
        onPark={() => {
          setBeginnerOpen(false);
          setBeginnerGuide(null);
          setGuideLoading(false);
          setGuideParked(true);
          saveGuideParked(true);
        }}
        onUnpark={() => {
          setGuideParked(false);
          saveGuideParked(false);
        }}
        onGenerate={handleBeginnerGuide}
        onOpenChat={openMastroChat}
        isLoading={guideLoading}
        hasDetailOpen={!!selectedHotspot}
        originReady={originReady}
        selectedDate={criteria.selectedDate}
        openTrigger={guideOpenTrigger}
      />

      {chatOpen && (
        <div className="hidden md:flex fixed inset-0 z-[1005] pointer-events-auto">
          <button
            type="button"
            className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
            aria-label="Chiudi chat"
          />
          <div
            className="absolute right-14 top-[72px] bottom-0 w-[min(420px,calc(100vw-420px))] max-w-[480px] flex flex-col bg-forest-900/98 border-l border-mushroom-500/30 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between px-4 py-3 border-b border-forest-700/40 shrink-0">

              <div>

                <h3 className="text-sm font-semibold text-forest-100">

                  💬 Mastro Fungaiolo

                </h3>

                <p className="text-[10px] text-forest-500">

                  Fascia {formatHourRange(criteria.hourRange)} · % come in mappa
                </p>

              </div>

              <button

                type="button"

                onClick={() => setChatOpen(false)}

                className="w-9 h-9 rounded-xl bg-forest-800 text-forest-300 flex items-center justify-center"

              >

                ✕

              </button>

            </div>

            <div className="flex-1 p-4 min-h-0 overflow-hidden flex flex-col">

              <MushroomChatPanel
                messages={messages}
                loading={chatLoading}
                geminiLoading={geminiLoading}
                studyWindowLabel={formatHourRange(criteria.hourRange)}
                onSend={sendMessage}
                onClear={clearChat}
                onZoneSelect={handleChatZoneSelect}
                className="flex-1"
              />

            </div>

          </div>

        </div>

      )}



      {weatherError && !weatherLoading && (
        <div className="absolute top-[100px] md:top-[80px] left-1/2 md:left-[calc(320px+(100vw-320px-3.5rem)/2)] -translate-x-1/2 z-[1002] pointer-events-none px-3 max-w-[90vw] md:max-w-md">
          <div className="bg-red-950/90 border border-red-700/50 rounded-lg px-3 py-2 text-center max-w-sm">
            <p className="text-xs text-red-300">{weatherError}</p>
          </div>
        </div>
      )}

      {filteredHotspots.length === 0 && !weatherLoading && (

        <div className="absolute top-1/2 left-1/2 md:left-[calc(320px+(100vw-320px-3.5rem)/2)] -translate-x-1/2 -translate-y-1/2 z-[999] pointer-events-none px-4">

          <div className="bg-forest-900/90 border border-mushroom-500/30 rounded-xl px-4 py-3 text-center max-w-xs">

            <p className="text-sm text-forest-200 font-medium">

              Nessuna zona visibile

            </p>

            <p className="text-xs text-forest-400 mt-1">

              Prova &quot;Tutte&quot; nelle probabilità, aumenta il raggio o

              cambia specie/data.

            </p>

          </div>

        </div>

      )}



      <LocationDetailPanel

        hotspot={selectedHotspot}

        hourRange={criteria.hourRange}

        selectedDate={criteria.selectedDate}

        originName={criteria.origin.name}

        origin={criteria.origin}

        tier={tier}

        onOpenCompassGuide={handleOpenCompassGuide}

        onClose={() => setSelectedHotspot(null)}

        className={panelBottomClass}

      />

      {originBootstrapped && setupOpen && (
        <SetupWizardModal
          open
          step={setupStep}
          selectedDate={criteria.selectedDate}
          hourRange={criteria.hourRange}
          initialOrigin={criteria.origin}
          maxDayOffset={maxDayOffset}
          onDateChange={(date) =>
            setCriteria((prev) => ({ ...prev, selectedDate: date }))
          }
          onHourRangeChange={handleHourRangeChange}
          onConfirmTime={handleConfirmTime}
          onConfirmOrigin={confirmOrigin}
          onParkOrigin={parkOrigin}
        />
      )}

      {originEditOpen && originReady && (
        <OriginSetupModal
          open
          required={false}
          initialOrigin={criteria.origin}
          onConfirm={confirmOrigin}
          onCancel={() => setOriginEditOpen(false)}
          onPark={parkOrigin}
        />
      )}

    </div>

  );

}


