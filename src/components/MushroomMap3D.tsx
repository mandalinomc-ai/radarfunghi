"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCesium, resetCesiumLoader, type CesiumRuntime } from "@/lib/loadCesium";
import {
  addTerrainVisualLayers,
  applyGameCameraRules,
  attachQualityOnCameraMove,
  configureGlobeRendering,
  createSatelliteImageryProvider,
  createWorldTerrain,
} from "@/lib/cesiumMapConfig";
import {
  buildHotspotMarkerEntity,
  buildHotspotTerritoryEntity,
  buildRegionBadgeEntity,
  computeRegionCentroids,
  REGION_LABELS,
  REGION_TERRITORY_COLORS,
} from "@/lib/cesiumZoneVisuals";
import type { ImageryLayer, Viewer, Entity, ScreenSpaceEventHandler, TerrainProvider } from "cesium";
import type { MapHotspot, MushroomReport, SpyZoneMarker } from "@/lib/types";
import { BENEVENTO } from "@/lib/benevento";
import { isMobileDevice } from "@/lib/deviceUtils";
import { safeMapCoordinatesForTier } from "@/lib/tierUtils";
import { getHotspotMapCenter } from "@/lib/zoneCoordinateService";
import type { MushroomMapProps } from "./map/mushroomMapProps";

interface HotspotEntity extends Entity {
  hotspotData?: MapHotspot;
}

function cameraHeightForRange(rangeKm: number): number {
  return Math.max(18_000, rangeKm * 900);
}

function flyHeightForHotspot(altitude: number): number {
  return Math.max(altitude + 800, 1400);
}

export default function MushroomMap3D({
  hotspots,
  selectedZoneId,
  onHotspotClick,
  rangeKm,
  origin = BENEVENTO,
  userReports = [],
  selectedReportId = null,
  onReportClick,
  spyZones = [],
  selectedSpyZoneId = null,
  onSpyZoneClick,
  tier = "free",
  onMapDragChange,
  onSwitchTo2D,
}: MushroomMapProps & { onSwitchTo2D?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const cesiumRef = useRef<CesiumRuntime | null>(null);
  const labelLayersRef = useRef<ImageryLayer[]>([]);
  const selectedZoneRef = useRef<string | null>(selectedZoneId);
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const detachCameraRef = useRef<(() => void) | null>(null);
  const onHotspotClickRef = useRef(onHotspotClick);
  const onReportClickRef = useRef(onReportClick);
  const onSpyZoneClickRef = useRef(onSpyZoneClick);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  selectedZoneRef.current = selectedZoneId;

  const retryLoad = useCallback(() => {
    resetCesiumLoader();
    setLoadError(null);
    setRetryKey((k) => k + 1);
  }, []);

  onHotspotClickRef.current = onHotspotClick;
  onReportClickRef.current = onReportClick;
  onSpyZoneClickRef.current = onSpyZoneClick;

  useEffect(() => {
    if (isMobileDevice()) {
      onSwitchTo2D?.();
    }
  }, [onSwitchTo2D]);

  useEffect(() => {
    let destroyed = false;
    const onMoveStart = () => onMapDragChange?.(true);
    const onMoveEnd = () => onMapDragChange?.(false);

    (async () => {
      try {
        const Cesium = await loadCesium();
        if (destroyed || !containerRef.current) return;

        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN?.trim();
        if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;

        const imageryProvider = await createSatelliteImageryProvider(Cesium);

        const terrainProvider = await createWorldTerrain(Cesium);
        const hasTerrain = !(terrainProvider instanceof Cesium.EllipsoidTerrainProvider);

        cesiumRef.current = Cesium;

        const viewer = new Cesium.Viewer(containerRef.current, {
          baseLayer: false,
          terrainProvider,
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: true,
          navigationHelpButton: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          creditContainer: document.createElement("div"),
          requestRenderMode: false,
        });

        viewer.imageryLayers.addImageryProvider(imageryProvider);
        const { labelLayers } = await addTerrainVisualLayers(viewer, Cesium);
        labelLayersRef.current = labelLayers;
        configureGlobeRendering(viewer, Cesium, hasTerrain);

        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#87ceeb");
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#1a3d2e");

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            origin.lng,
            origin.lat,
            cameraHeightForRange(rangeKm)
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-52),
            roll: 0,
          },
        });

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(
          (click: ScreenSpaceEventHandler.PositionedEvent) => {
            const picked = viewer.scene.pick(click.position);
            if (!Cesium.defined(picked) || !picked.id) return;
            const entity = picked.id as HotspotEntity & {
              id?: string;
              reportData?: MushroomReport;
              spyData?: SpyZoneMarker;
            };
            const entityId = entity.id?.toString() ?? "";
            if (entity.hotspotData) {
              onHotspotClickRef.current(entity.hotspotData);
            } else if (entityId.startsWith("territory-")) {
              const zoneId = entityId.replace("territory-", "");
              const match = hotspots.find((h) => h.zone.id === zoneId);
              if (match) onHotspotClickRef.current(match);
            } else if (entity.reportData && onReportClickRef.current) {
              onReportClickRef.current(entity.reportData);
            } else if (entity.spyData && onSpyZoneClickRef.current) {
              onSpyZoneClickRef.current(entity.spyData);
            }
          },
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        handlerRef.current = handler;
        viewerRef.current = viewer;

        detachCameraRef.current = attachQualityOnCameraMove(
          viewer,
          Cesium,
          onMoveStart,
          onMoveEnd,
          labelLayersRef.current,
          () => selectedZoneRef.current
        );

        viewer.resize();
        const ro = new ResizeObserver(() => {
          if (!viewer.isDestroyed()) viewer.resize();
        });
        ro.observe(containerRef.current);
        resizeObserverRef.current = ro;
        setLoadError(null);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Globo 3D non disponibile"
        );
      }
    })();

    return () => {
      destroyed = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      detachCameraRef.current?.();
      detachCameraRef.current = null;
      handlerRef.current?.destroy();
      handlerRef.current = null;
      labelLayersRef.current = [];
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
      cesiumRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMapDragChange, retryKey]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed()) return;

    const clamp = Cesium.HeightReference.CLAMP_TO_GROUND;

    viewer.entities.removeAll();

    viewer.entities.add({
      id: "origin",
      position: Cesium.Cartesian3.fromDegrees(origin.lng, origin.lat),
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString("#3b82f6"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: clamp,
      },
      label: {
        text: origin.name || "Partenza",
        font: "bold 12px system-ui, sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        heightReference: clamp,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString("#0a1209").withAlpha(0.85),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 60_000),
      },
      ellipse: {
        semiMajorAxis: rangeKm * 1000,
        semiMinorAxis: rangeKm * 1000,
        material: Cesium.Color.fromCssColorString("#3b82f6").withAlpha(0.05),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#60a5fa").withAlpha(0.55),
        outlineWidth: 2,
        heightReference: clamp,
      },
    });

    for (const hotspot of hotspots) {
      const [lat, lng] = safeMapCoordinatesForTier(
        tier,
        hotspot.zone.lat,
        hotspot.zone.lng,
        hotspot.zone.id,
        hotspot.zone.parkingLat,
        hotspot.zone.parkingLng
      );
      const isSelected = hotspot.zone.id === selectedZoneId;
      const opts = { lat, lng, hotspot, isSelected };

      const territory = viewer.entities.add(
        buildHotspotTerritoryEntity(Cesium, opts)
      );
      (territory as HotspotEntity).hotspotData = hotspot;

      const marker = viewer.entities.add(
        buildHotspotMarkerEntity(Cesium, opts)
      ) as HotspotEntity;
      marker.hotspotData = hotspot;
    }

    const centroids = computeRegionCentroids(hotspots);
    for (const [region, c] of Object.entries(centroids)) {
      if (!c) continue;
      viewer.entities.add(
        buildRegionBadgeEntity(
          Cesium,
          region as MapHotspot["zone"]["region"],
          c.lat,
          c.lng,
          c.count
        )
      );
    }

    for (const report of userReports) {
      const entity = viewer.entities.add({
        id: `report-${report.id}`,
        position: Cesium.Cartesian3.fromDegrees(report.lng, report.lat),
        point: {
          pixelSize: report.id === selectedReportId ? 14 : 10,
          color: Cesium.Color.fromCssColorString("#f472b6"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: clamp,
        },
      }) as Entity & { reportData?: MushroomReport };
      entity.reportData = report;
    }

    for (const zone of spyZones) {
      const entity = viewer.entities.add({
        id: `spy-${zone.id}`,
        position: Cesium.Cartesian3.fromDegrees(zone.lng, zone.lat),
        point: {
          pixelSize: zone.id === selectedSpyZoneId ? 14 : 10,
          color: Cesium.Color.fromCssColorString("#a78bfa"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: clamp,
        },
      }) as Entity & { spyData?: SpyZoneMarker };
      entity.spyData = zone;
    }

    const viewerInst = viewer;
    requestAnimationFrame(() => {
      if (!viewerInst.isDestroyed()) {
        applyGameCameraRules(
          viewerInst,
          Cesium,
          labelLayersRef.current,
          selectedZoneRef.current
        );
      }
    });
  }, [
    hotspots,
    selectedZoneId,
    origin,
    rangeKm,
    tier,
    userReports,
    selectedReportId,
    spyZones,
    selectedSpyZoneId,
  ]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed()) return;

    if (selectedZoneId) {
      const hotspot = hotspots.find((h) => h.zone.id === selectedZoneId);
      if (hotspot) {
        const [lat, lng] = getHotspotMapCenter(hotspot, tier);
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            lng,
            lat,
            flyHeightForHotspot(hotspot.zone.altitude)
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-58),
            roll: 0,
          },
          duration: 1.2,
        });
        return;
      }
    }

    if (selectedReportId) {
      const report = userReports.find((r) => r.id === selectedReportId);
      if (report) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(report.lng, report.lat, 1600),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-58), roll: 0 },
          duration: 1.2,
        });
        return;
      }
    }

    if (selectedSpyZoneId) {
      const zone = spyZones.find((z) => z.id === selectedSpyZoneId);
      if (zone) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(zone.lng, zone.lat, 1600),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-58), roll: 0 },
          duration: 1.2,
        });
      }
    }
  }, [selectedZoneId, selectedReportId, selectedSpyZoneId, hotspots, userReports, spyZones, tier]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium || viewer.isDestroyed()) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        origin.lng,
        origin.lat,
        cameraHeightForRange(rangeKm)
      ),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-52), roll: 0 },
      duration: 1,
    });
  }, [origin.lat, origin.lng, rangeKm]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-forest-950 p-6 text-center">
        <div className="max-w-xs">
          <p className="text-mushroom-400 font-semibold mb-2">Globo 3D non caricato</p>
          <p className="text-sm text-forest-400">{loadError}</p>
          <div className="flex flex-col gap-2 mt-4">
            <button
              type="button"
              onClick={retryLoad}
              className="py-2.5 rounded-xl bg-mushroom-600 text-white text-sm font-semibold touch-manipulation"
            >
              Riprova 3D
            </button>
            {onSwitchTo2D && (
              <button
                type="button"
                onClick={onSwitchTo2D}
                className="py-2.5 rounded-xl bg-forest-800 text-forest-200 text-sm touch-manipulation"
              >
                Torna alla mappa 2D
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full mushroom-map-3d min-h-[200px]">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute top-2 left-2 z-[1] pointer-events-none flex flex-col gap-1 max-w-[55%]">
        <p className="text-[9px] text-forest-100 bg-forest-950/85 px-2 py-1 rounded-lg backdrop-blur-sm border border-forest-600/40">
          🎮 Territori colorati · monti in rilievo · laghi/fiumi evidenziati
        </p>
      </div>
      <div className="absolute top-2 right-2 z-[1] pointer-events-none hidden sm:flex flex-col gap-1 p-2 rounded-xl bg-forest-950/88 backdrop-blur-sm border border-forest-600/40">
        <p className="text-[8px] uppercase tracking-wider text-forest-400 font-semibold mb-0.5">
          Territori
        </p>
        {Object.entries(REGION_TERRITORY_COLORS).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/20"
              style={{ backgroundColor: color }}
            />
            <span className="text-[9px] text-forest-200">
              {REGION_LABELS[region as keyof typeof REGION_LABELS]}
            </span>
          </div>
        ))}
      </div>
      <p className="absolute bottom-2 left-2 right-14 z-[1] pointer-events-none text-[9px] text-forest-300/90 bg-forest-950/85 px-2.5 py-1.5 rounded-lg backdrop-blur-sm leading-relaxed border border-forest-700/30">
        Ruota · inclina · zoom · clic sul territorio colorato
      </p>
    </div>
  );
}
