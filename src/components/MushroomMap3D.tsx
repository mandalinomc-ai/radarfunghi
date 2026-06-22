"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCesium, resetCesiumLoader, type CesiumRuntime } from "@/lib/loadCesium";
import type { Viewer, Entity, ScreenSpaceEventHandler, TerrainProvider } from "cesium";
import type { MapHotspot, MushroomReport, SpyZoneMarker } from "@/lib/types";
import { SPECIES_COLORS } from "@/lib/mapUtils";
import { BENEVENTO } from "@/lib/benevento";
import { safeMapCoordinatesForTier } from "@/lib/tierUtils";
import { getHotspotMapCenter } from "@/lib/zoneCoordinateService";
import type { MushroomMapProps } from "./map/mushroomMapProps";

const ESRI_IMAGERY_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

interface HotspotEntity extends Entity {
  hotspotData?: MapHotspot;
}

function cameraHeightForRange(rangeKm: number): number {
  return Math.max(25_000, rangeKm * 1200);
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
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onHotspotClickRef = useRef(onHotspotClick);
  const onReportClickRef = useRef(onReportClick);
  const onSpyZoneClickRef = useRef(onSpyZoneClick);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const retryLoad = useCallback(() => {
    resetCesiumLoader();
    setLoadError(null);
    setRetryKey((k) => k + 1);
  }, []);

  onHotspotClickRef.current = onHotspotClick;
  onReportClickRef.current = onReportClick;
  onSpyZoneClickRef.current = onSpyZoneClick;

  useEffect(() => {
    let destroyed = false;
    let viewerInstance: Viewer | null = null;
    const onMoveStart = () => onMapDragChange?.(true);
    const onMoveEnd = () => onMapDragChange?.(false);

    (async () => {
      try {
        const Cesium = await loadCesium();
        if (destroyed || !containerRef.current) return;

        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN?.trim();
        if (ionToken) {
          Cesium.Ion.defaultAccessToken = ionToken;
        }

        const imageryProvider =
          await Cesium.ArcGisMapServerImageryProvider.fromUrl(ESRI_IMAGERY_URL);

        let terrainProvider: TerrainProvider =
          new Cesium.EllipsoidTerrainProvider();
        if (ionToken) {
          try {
            terrainProvider = await Cesium.createWorldTerrainAsync();
          } catch {
            /* ellipsoid ok */
          }
        }

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
        });

        viewer.imageryLayers.addImageryProvider(imageryProvider);

        viewer.scene.backgroundColor =
          Cesium.Color.fromCssColorString("#0a1209");
        viewer.scene.globe.baseColor =
          Cesium.Color.fromCssColorString("#1a2e18");
        viewer.scene.globe.depthTestAgainstTerrain = Boolean(ionToken);
        viewer.scene.screenSpaceCameraController.enableCollisionDetection =
          Boolean(ionToken);

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            origin.lng,
            origin.lat,
            cameraHeightForRange(rangeKm)
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-48),
            roll: 0,
          },
          duration: 0,
        });

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(
          (click: ScreenSpaceEventHandler.PositionedEvent) => {
            const picked = viewer.scene.pick(click.position);
            if (!Cesium.defined(picked) || !picked.id) return;
            const entity = picked.id as HotspotEntity & {
              reportData?: MushroomReport;
              spyData?: SpyZoneMarker;
            };
            if (entity.hotspotData) {
              onHotspotClickRef.current(entity.hotspotData);
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
        viewerInstance = viewer;

        viewer.camera.moveStart.addEventListener(onMoveStart);
        viewer.camera.moveEnd.addEventListener(onMoveEnd);

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
      if (viewerInstance) {
        viewerInstance.camera.moveStart.removeEventListener(onMoveStart);
        viewerInstance.camera.moveEnd.removeEventListener(onMoveEnd);
      }
      handlerRef.current?.destroy();
      handlerRef.current = null;
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

    viewer.entities.removeAll();

    viewer.entities.add({
      id: "origin",
      position: Cesium.Cartesian3.fromDegrees(origin.lng, origin.lat, 0),
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString("#3b82f6"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      ellipse: {
        semiMajorAxis: rangeKm * 1000,
        semiMinorAxis: rangeKm * 1000,
        material: Cesium.Color.fromCssColorString("#3b82f6").withAlpha(0.08),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#3b82f6").withAlpha(0.45),
        outlineWidth: 2,
        height: 0,
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
      const color = SPECIES_COLORS[hotspot.activeSpecies];
      const alt = Math.max(hotspot.zone.altitude, 200);

      const entity = viewer.entities.add({
        id: `hotspot-${hotspot.zone.id}`,
        position: Cesium.Cartesian3.fromDegrees(lng, lat, alt),
        point: {
          pixelSize: isSelected ? 18 : 13,
          color: Cesium.Color.fromCssColorString(color),
          outlineColor: isSelected
            ? Cesium.Color.WHITE
            : Cesium.Color.fromCssColorString(color).withAlpha(0.9),
          outlineWidth: isSelected ? 3 : 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${hotspot.activeScore}%`,
          font: "600 11px system-ui, sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            120_000
          ),
          showBackground: true,
          backgroundColor:
            Cesium.Color.fromCssColorString("#0f1a12").withAlpha(0.65),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
        },
      }) as HotspotEntity;
      entity.hotspotData = hotspot;
    }

    for (const report of userReports) {
      const entity = viewer.entities.add({
        id: `report-${report.id}`,
        position: Cesium.Cartesian3.fromDegrees(report.lng, report.lat, 50),
        point: {
          pixelSize: report.id === selectedReportId ? 14 : 10,
          color: Cesium.Color.fromCssColorString("#f472b6"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      }) as Entity & { reportData?: MushroomReport };
      entity.reportData = report;
    }

    for (const zone of spyZones) {
      const entity = viewer.entities.add({
        id: `spy-${zone.id}`,
        position: Cesium.Cartesian3.fromDegrees(zone.lng, zone.lat, 50),
        point: {
          pixelSize: zone.id === selectedSpyZoneId ? 14 : 10,
          color: Cesium.Color.fromCssColorString("#a78bfa"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      }) as Entity & { spyData?: SpyZoneMarker };
      entity.spyData = zone;
    }
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
            Math.max(hotspot.zone.altitude + 1800, 2200)
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-42),
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
          destination: Cesium.Cartesian3.fromDegrees(
            report.lng,
            report.lat,
            2500
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 1.2,
        });
        return;
      }
    }

    if (selectedSpyZoneId) {
      const zone = spyZones.find((z) => z.id === selectedSpyZoneId);
      if (zone) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(zone.lng, zone.lat, 2500),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 1.2,
        });
      }
    }
  }, [
    selectedZoneId,
    selectedReportId,
    selectedSpyZoneId,
    hotspots,
    userReports,
    spyZones,
    tier,
  ]);

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
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-48),
        roll: 0,
      },
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
      <p className="absolute bottom-2 left-2 right-14 z-[1] pointer-events-none text-[9px] text-forest-400/90 bg-forest-950/70 px-2 py-1 rounded-lg backdrop-blur-sm">
        Ruota · zoom · clic sui pin · vista inclinata
      </p>
    </div>
  );
}
