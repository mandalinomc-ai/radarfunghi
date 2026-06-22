import type { Viewer } from "cesium";
import type { CesiumRuntime } from "./loadCesium";
import { CARTO_VOYAGER_LABELS_URL } from "./mapUtils";

const ESRI_IMAGERY_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

const ESRI_LABELS_SERVER =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer";

export const IMAGERY_MAX_LEVEL = 20;
export const GROUND_PIN_OFFSET_M = 4;

export async function createSatelliteImageryProvider(Cesium: CesiumRuntime) {
  return Cesium.ArcGisMapServerImageryProvider.fromUrl(ESRI_IMAGERY_URL, {
    maximumLevel: IMAGERY_MAX_LEVEL,
  });
}

/** Stesso overlay etichette della mappa 2D (città, paesi, strade) */
export async function addMapLabelLayers(
  viewer: Viewer,
  Cesium: CesiumRuntime
): Promise<void> {
  try {
    const esriLabels = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      ESRI_LABELS_SERVER,
      { maximumLevel: 19 }
    );
    const esriLayer = viewer.imageryLayers.addImageryProvider(esriLabels);
    esriLayer.alpha = 0.48;
  } catch {
    /* optional */
  }

  try {
    const cartoLabels = new Cesium.UrlTemplateImageryProvider({
      url: CARTO_VOYAGER_LABELS_URL,
      subdomains: ["a", "b", "c", "d"],
      maximumLevel: 20,
      credit: "© OpenStreetMap © CARTO",
    });
    viewer.imageryLayers.addImageryProvider(cartoLabels);
  } catch {
    /* optional */
  }
}

export function configureGlobeRendering(
  viewer: Viewer,
  Cesium: CesiumRuntime,
  hasTerrain: boolean
) {
  const { scene } = viewer;
  const { globe } = scene;

  globe.depthTestAgainstTerrain = hasTerrain;
  globe.showGroundAtmosphere = true;
  globe.tileCacheSize = 1500;
  globe.preloadAncestors = true;
  globe.preloadSiblings = true;
  globe.loadingDescendantLimit = 120;
  globe.enableLighting = false;

  scene.fog.enabled = false;
  scene.postProcessStages.fxaa.enabled = true;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  viewer.resolutionScale = Math.min(Math.max(dpr, 1), 2.5);
  viewer.useBrowserRecommendedResolution = false;

  const satellite = viewer.imageryLayers.get(0);
  if (satellite) {
    satellite.minificationFilter = Cesium.TextureMinificationFilter.LINEAR;
    satellite.magnificationFilter = Cesium.TextureMagnificationFilter.LINEAR;
  }

  configureOrbitalCamera(viewer, Cesium, hasTerrain);
  applyGlobeQualityForCameraHeight(viewer);
}

/** Orbita 360° stile Google Earth — sopra, sotto, zoom libero */
export function configureOrbitalCamera(
  viewer: Viewer,
  Cesium: CesiumRuntime,
  _hasTerrain: boolean
) {
  const c = viewer.scene.screenSpaceCameraController;

  c.enableRotate = true;
  c.enableTilt = true;
  c.enableLook = true;
  c.enableTranslate = true;
  c.enableZoom = true;
  c.enableInputs = true;
  c.enableCollisionDetection = false;

  c.minimumZoomDistance = 1.5;
  c.maximumZoomDistance = 45_000_000;
  c.inertiaSpin = 0.92;
  c.inertiaTranslate = 0.9;
  c.inertiaZoom = 0.82;

  c.zoomEventTypes = [
    Cesium.CameraEventType.WHEEL,
    Cesium.CameraEventType.PINCH,
  ];
  c.tiltEventTypes = [
    Cesium.CameraEventType.MIDDLE_DRAG,
    Cesium.CameraEventType.PINCH,
    Cesium.CameraEventType.RIGHT_DRAG,
  ];
  c.rotateEventTypes = [
    Cesium.CameraEventType.LEFT_DRAG,
    Cesium.CameraEventType.PINCH,
  ];
  c.translateEventTypes = [
    Cesium.CameraEventType.MIDDLE_DRAG,
    Cesium.CameraEventType.PINCH,
  ];
}

export function applyGlobeQualityForCameraHeight(viewer: Viewer): void {
  if (viewer.isDestroyed()) return;
  const height = viewer.camera.positionCartographic.height;
  const globe = viewer.scene.globe;

  if (height < 180) {
    globe.maximumScreenSpaceError = 0.35;
  } else if (height < 600) {
    globe.maximumScreenSpaceError = 0.55;
  } else if (height < 2000) {
    globe.maximumScreenSpaceError = 0.85;
  } else if (height < 15_000) {
    globe.maximumScreenSpaceError = 1.25;
  } else {
    globe.maximumScreenSpaceError = 2.0;
  }
}

export function markerScaleByDistance(Cesium: CesiumRuntime) {
  return new Cesium.NearFarScalar(80, 1.8, 400_000, 0.75);
}

export function labelScaleByDistance(Cesium: CesiumRuntime) {
  return new Cesium.NearFarScalar(100, 1.25, 350_000, 0.85);
}

export function groundPinHeightReference(Cesium: CesiumRuntime) {
  return Cesium.HeightReference.RELATIVE_TO_GROUND;
}

export function attachQualityOnCameraMove(
  viewer: Viewer,
  onMoveStart?: () => void,
  onMoveEnd?: () => void
): () => void {
  const onChanged = () => applyGlobeQualityForCameraHeight(viewer);
  viewer.camera.changed.addEventListener(onChanged);
  if (onMoveStart) viewer.camera.moveStart.addEventListener(onMoveStart);
  if (onMoveEnd) viewer.camera.moveEnd.addEventListener(onMoveEnd);

  return () => {
    if (viewer.isDestroyed()) return;
    viewer.camera.changed.removeEventListener(onChanged);
    if (onMoveStart) viewer.camera.moveStart.removeEventListener(onMoveStart);
    if (onMoveEnd) viewer.camera.moveEnd.removeEventListener(onMoveEnd);
  };
}
