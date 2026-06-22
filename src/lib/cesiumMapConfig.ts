import type { Viewer } from "cesium";
import type { CesiumRuntime } from "./loadCesium";
import { CARTO_VOYAGER_LABELS_URL } from "./mapUtils";

const ESRI_IMAGERY_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

const ESRI_LABELS_SERVER =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer";

const ESRI_HILLSHADE =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer";

const ESRI_PHYSICAL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer";

export const IMAGERY_MAX_LEVEL = 20;

/** Limite inclinazione verso l’orizzonte (evita label “a fila” in cielo) */
export const MAX_HORIZON_PITCH_RAD = -0.32;

export async function createSatelliteImageryProvider(Cesium: CesiumRuntime) {
  return Cesium.ArcGisMapServerImageryProvider.fromUrl(ESRI_IMAGERY_URL, {
    maximumLevel: IMAGERY_MAX_LEVEL,
  });
}

export async function createWorldTerrain(Cesium: CesiumRuntime) {
  try {
    return await Cesium.createWorldTerrainAsync({
      requestWaterMask: true,
      requestVertexNormals: true,
    });
  } catch {
    return new Cesium.EllipsoidTerrainProvider();
  }
}

/** Rilievo monti + idrografia + etichette città */
export async function addTerrainVisualLayers(
  viewer: Viewer,
  Cesium: CesiumRuntime
): Promise<{ labelLayers: import("cesium").ImageryLayer[] }> {
  const labelLayers: import("cesium").ImageryLayer[] = [];

  try {
    const hillshade = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      ESRI_HILLSHADE,
      { maximumLevel: 16 }
    );
    const hs = viewer.imageryLayers.addImageryProvider(hillshade);
    hs.alpha = 0.52;
    hs.brightness = 1.08;
    hs.contrast = 1.12;
  } catch {
    /* optional */
  }

  try {
    const physical = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      ESRI_PHYSICAL,
      { maximumLevel: 12 }
    );
    const phy = viewer.imageryLayers.addImageryProvider(physical);
    phy.alpha = 0.38;
    phy.brightness = 1.05;
    phy.saturation = 1.35;
    phy.hue = 0.02;
  } catch {
    /* optional */
  }

  try {
    const esriLabels = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      ESRI_LABELS_SERVER,
      { maximumLevel: 17 }
    );
    const esriLayer = viewer.imageryLayers.addImageryProvider(esriLabels);
    esriLayer.alpha = 0.55;
    labelLayers.push(esriLayer);
  } catch {
    /* optional */
  }

  try {
    const cartoLabels = new Cesium.UrlTemplateImageryProvider({
      url: CARTO_VOYAGER_LABELS_URL,
      subdomains: ["a", "b", "c", "d"],
      maximumLevel: 18,
      credit: "© OpenStreetMap © CARTO",
    });
    const cartoLayer = viewer.imageryLayers.addImageryProvider(cartoLabels);
    cartoLayer.alpha = 0.65;
    labelLayers.push(cartoLayer);
  } catch {
    /* optional */
  }

  return { labelLayers };
}

export function configureGlobeRendering(
  viewer: Viewer,
  Cesium: CesiumRuntime,
  hasTerrain: boolean
) {
  const { scene } = viewer;
  const { globe } = scene;

  globe.depthTestAgainstTerrain = true;
  globe.showGroundAtmosphere = true;
  globe.tileCacheSize = 1500;
  globe.preloadAncestors = true;
  globe.preloadSiblings = true;
  globe.loadingDescendantLimit = 120;

  scene.verticalExaggeration = hasTerrain ? 1.85 : 1.0;
  globe.enableLighting = hasTerrain;
  if (hasTerrain) {
    globe.showWaterEffect = true;
  }

  scene.fog.enabled = true;
  scene.fog.density = 0.00018;
  scene.fog.minimumBrightness = 0.35;
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
  scene.postProcessStages.fxaa.enabled = true;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  viewer.resolutionScale = Math.min(Math.max(dpr, 1), 2.5);
  viewer.useBrowserRecommendedResolution = false;

  const satellite = viewer.imageryLayers.get(0);
  if (satellite) {
    satellite.brightness = 1.08;
    satellite.contrast = 1.06;
    satellite.saturation = 1.12;
    satellite.minificationFilter = Cesium.TextureMinificationFilter.LINEAR;
    satellite.magnificationFilter = Cesium.TextureMagnificationFilter.LINEAR;
  }

  configureOrbitalCamera(viewer, Cesium, hasTerrain);
  applyGlobeQualityForCameraHeight(viewer);
}

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

  c.minimumZoomDistance = 8;
  c.maximumZoomDistance = 45_000_000;
  c.inertiaSpin = 0.9;
  c.inertiaTranslate = 0.88;
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

function setLabelVisibility(
  Cesium: CesiumRuntime,
  label: import("cesium").LabelGraphics,
  visible: boolean
): void {
  const prop = label.show;
  if (prop instanceof Cesium.ConstantProperty) {
    prop.setValue(visible);
  } else {
    label.show = new Cesium.ConstantProperty(visible);
  }
}

export function applyGameCameraRules(
  viewer: Viewer,
  Cesium: CesiumRuntime,
  labelTileLayers: import("cesium").ImageryLayer[],
  selectedZoneId: string | null
): void {
  if (viewer.isDestroyed()) return;

  const { camera } = viewer;
  let pitch = camera.pitch;

  if (pitch > MAX_HORIZON_PITCH_RAD) {
    pitch = MAX_HORIZON_PITCH_RAD;
    camera.setView({
      destination: camera.positionWC,
      orientation: {
        heading: camera.heading,
        pitch: MAX_HORIZON_PITCH_RAD,
        roll: camera.roll,
      },
    });
  }

  const height = camera.positionCartographic.height;
  const lookingDown = pitch < -0.55;
  const showEntityLabels = lookingDown && height < 45_000;

  for (const entity of viewer.entities.values) {
    const id = entity.id?.toString() ?? "";
    if (entity.label && id.startsWith("hotspot-")) {
      const zoneId = id.replace("hotspot-", "");
      const isSelected = zoneId === selectedZoneId;
      setLabelVisibility(
        Cesium,
        entity.label,
        showEntityLabels && (isSelected || height < 12_000)
      );
    }
    if (entity.label && id.startsWith("region-badge-")) {
      setLabelVisibility(Cesium, entity.label, height > 8000);
    }
  }

  const labelAlpha =
    height > 25_000 ? 0.75 : height > 8000 ? 0.5 : height > 2500 ? 0.28 : 0.12;

  for (const layer of labelTileLayers) {
    layer.alpha = labelAlpha;
  }
}

export function attachQualityOnCameraMove(
  viewer: Viewer,
  Cesium: CesiumRuntime,
  onMoveStart: (() => void) | undefined,
  onMoveEnd: (() => void) | undefined,
  labelTileLayers: import("cesium").ImageryLayer[],
  getSelectedZoneId: () => string | null
): () => void {
  const onChanged = () => {
    applyGlobeQualityForCameraHeight(viewer);
    applyGameCameraRules(viewer, Cesium, labelTileLayers, getSelectedZoneId());
  };
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
