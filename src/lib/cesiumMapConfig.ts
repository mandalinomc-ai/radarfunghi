import type { Viewer } from "cesium";
import type { CesiumRuntime } from "./loadCesium";

const ESRI_IMAGERY_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

/** Qualità imagery satellitare — livelli alti fino allo zoom ravvicinato */
export const IMAGERY_MAX_LEVEL = 20;

export async function createSatelliteImageryProvider(Cesium: CesiumRuntime) {
  return Cesium.ArcGisMapServerImageryProvider.fromUrl(ESRI_IMAGERY_URL, {
    maximumLevel: IMAGERY_MAX_LEVEL,
  });
}

/** Retina + tessellazione ad alta qualità vicino al suolo */
export function configureGlobeRendering(
  viewer: Viewer,
  Cesium: CesiumRuntime,
  hasTerrain: boolean
) {
  const { scene } = viewer;
  const { globe } = scene;

  globe.depthTestAgainstTerrain = true;
  globe.showGroundAtmosphere = true;
  globe.tileCacheSize = 1200;
  globe.preloadAncestors = true;
  globe.preloadSiblings = true;
  globe.loadingDescendantLimit = 80;

  scene.fog.enabled = false;
  scene.highDynamicRange = false;
  scene.postProcessStages.fxaa.enabled = true;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  viewer.resolutionScale = Math.min(Math.max(dpr, 1), 2.5);
  viewer.useBrowserRecommendedResolution = false;

  scene.screenSpaceCameraController.enableCollisionDetection = hasTerrain;
  scene.screenSpaceCameraController.minimumZoomDistance = 25;
  scene.screenSpaceCameraController.maximumZoomDistance = 50_000_000;

  const layer = viewer.imageryLayers.get(0);
  if (layer) {
    layer.minificationFilter = Cesium.TextureMinificationFilter.LINEAR;
    layer.magnificationFilter = Cesium.TextureMagnificationFilter.LINEAR;
  }

  applyGlobeQualityForCameraHeight(viewer);
}

/** SSE più basso = più dettaglio terrain/imagery quando si zoomma */
export function applyGlobeQualityForCameraHeight(viewer: Viewer): void {
  if (viewer.isDestroyed()) return;
  const height = viewer.camera.positionCartographic.height;
  const globe = viewer.scene.globe;

  if (height < 250) {
    globe.maximumScreenSpaceError = 0.5;
  } else if (height < 800) {
    globe.maximumScreenSpaceError = 0.66;
  } else if (height < 2500) {
    globe.maximumScreenSpaceError = 1.0;
  } else if (height < 20_000) {
    globe.maximumScreenSpaceError = 1.5;
  } else {
    globe.maximumScreenSpaceError = 2.0;
  }
}

/** Scala pin/etichette in base alla distanza camera */
export function markerScaleByDistance(Cesium: CesiumRuntime) {
  return new Cesium.NearFarScalar(120, 2.4, 250_000, 0.45);
}

export function labelScaleByDistance(Cesium: CesiumRuntime) {
  return new Cesium.NearFarScalar(200, 1.35, 180_000, 0.55);
}

export function groundClamp(Cesium: CesiumRuntime) {
  return Cesium.HeightReference.CLAMP_TO_GROUND;
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
