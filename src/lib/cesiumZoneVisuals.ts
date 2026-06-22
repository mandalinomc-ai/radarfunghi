import type { FungalZone, MapHotspot } from "./types";
import type { CesiumRuntime } from "./loadCesium";
import { SPECIES_COLORS } from "./mapUtils";
import { getSpeciesLabel } from "./predictionEngine";

/** Colori territorio per macro-area — stile mappa tattica */
export const REGION_TERRITORY_COLORS: Record<FungalZone["region"], string> = {
  matese: "#14b8a6",
  taburno: "#f59e0b",
  sannio: "#22c55e",
  molise: "#3b82f6",
  campania: "#e07830",
  basilicata: "#a78bfa",
};

export const REGION_LABELS: Record<FungalZone["region"], string> = {
  matese: "Matese",
  taburno: "Taburno",
  sannio: "Sannio",
  molise: "Molise",
  campania: "Campania",
  basilicata: "Basilicata",
};

/** Raggio territorio visibile in metri (stile videogioco) */
export function zoneTerritoryRadiusM(hotspot: MapHotspot): number {
  const base = 700 + hotspot.zone.altitude * 0.35;
  const scoreBoost = hotspot.activeScore * 8;
  return Math.min(2200, Math.max(850, base + scoreBoost));
}

/** Altezza estrusione “plateau” sul terreno */
export function zoneExtrusionHeightM(zone: FungalZone): number {
  return Math.min(180, Math.max(40, zone.altitude * 0.14));
}

/** Altezza faro centrale */
export function zoneBeaconHeightM(zone: FungalZone): number {
  return Math.min(140, Math.max(55, zone.altitude * 0.1));
}

export interface ZoneVisualOptions {
  lat: number;
  lng: number;
  hotspot: MapHotspot;
  isSelected: boolean;
  tierLabel?: boolean;
}

export function buildHotspotTerritoryEntity(
  Cesium: CesiumRuntime,
  opts: ZoneVisualOptions
) {
  const { lat, lng, hotspot, isSelected } = opts;
  const { zone } = hotspot;
  const speciesColor = SPECIES_COLORS[hotspot.activeSpecies];
  const regionColor = REGION_TERRITORY_COLORS[zone.region];
  const radius = zoneTerritoryRadiusM(hotspot);
  const extrude = zoneExtrusionHeightM(zone);
  const beaconH = zoneBeaconHeightM(zone);
  const clamp = Cesium.HeightReference.CLAMP_TO_GROUND;

  return {
    id: `territory-${zone.id}`,
    position: Cesium.Cartesian3.fromDegrees(lng, lat),
    ellipse: {
      semiMajorAxis: radius,
      semiMinorAxis: radius * 0.88,
      material: Cesium.Color.fromCssColorString(regionColor).withAlpha(
        isSelected ? 0.48 : 0.32
      ),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString(speciesColor).withAlpha(
        isSelected ? 1 : 0.78
      ),
      outlineWidth: isSelected ? 5 : 3,
      heightReference: clamp,
      extrudedHeight: extrude,
      numberOfVerticalLines: 0,
    },
    cylinder: {
      length: beaconH,
      topRadius: isSelected ? 22 : 14,
      bottomRadius: isSelected ? 38 : 28,
      material: Cesium.Color.fromCssColorString(speciesColor).withAlpha(0.82),
      outline: true,
      outlineColor: Cesium.Color.WHITE.withAlpha(0.55),
      outlineWidth: 1,
      heightReference: clamp,
    },
  };
}

export function buildHotspotMarkerEntity(
  Cesium: CesiumRuntime,
  opts: ZoneVisualOptions
) {
  const { lat, lng, hotspot, isSelected } = opts;
  const { zone } = hotspot;
  const speciesColor = SPECIES_COLORS[hotspot.activeSpecies];
  const speciesLabel = getSpeciesLabel(hotspot.activeSpecies);
  const clamp = Cesium.HeightReference.CLAMP_TO_GROUND;
  const pinScale = new Cesium.NearFarScalar(200, 1.5, 120_000, 0.9);
  const lblScale = new Cesium.NearFarScalar(300, 1.15, 80_000, 0.75);

  return {
    id: `hotspot-${zone.id}`,
    position: Cesium.Cartesian3.fromDegrees(lng, lat),
    point: {
      pixelSize: isSelected ? 16 : 11,
      color: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.fromCssColorString(speciesColor),
      outlineWidth: isSelected ? 4 : 3,
      heightReference: clamp,
      scaleByDistance: pinScale,
      disableDepthTestDistance: 0,
    },
    label: {
      text: `${zone.name}\n${hotspot.activeScore}% · ${speciesLabel}`,
      font: "bold 13px system-ui, sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -28),
      heightReference: clamp,
      scaleByDistance: lblScale,
      disableDepthTestDistance: 0,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#0a1209").withAlpha(0.88),
      backgroundPadding: new Cesium.Cartesian2(10, 6),
      show: isSelected,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 85_000),
    },
  };
}

export function buildRegionBadgeEntity(
  Cesium: CesiumRuntime,
  region: FungalZone["region"],
  lat: number,
  lng: number,
  zoneCount: number
) {
  const color = REGION_TERRITORY_COLORS[region];
  const clamp = Cesium.HeightReference.CLAMP_TO_GROUND;

  return {
    id: `region-badge-${region}`,
    position: Cesium.Cartesian3.fromDegrees(lng, lat),
    label: {
      text: `${REGION_LABELS[region].toUpperCase()} · ${zoneCount} zone`,
      font: "bold 11px system-ui, sans-serif",
      fillColor: Cesium.Color.fromCssColorString(color),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      heightReference: clamp,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#0a1209").withAlpha(0.72),
      backgroundPadding: new Cesium.Cartesian2(8, 4),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(5000, 120_000),
      disableDepthTestDistance: 0,
    },
  };
}

/** Centroidi approssimati macro-aree per badge regione */
export function computeRegionCentroids(
  hotspots: MapHotspot[]
): Partial<Record<FungalZone["region"], { lat: number; lng: number; count: number }>> {
  const acc: Record<
    string,
    { lat: number; lng: number; count: number }
  > = {};

  for (const h of hotspots) {
    const r = h.zone.region;
    if (!acc[r]) acc[r] = { lat: 0, lng: 0, count: 0 };
    acc[r].lat += h.zone.lat;
    acc[r].lng += h.zone.lng;
    acc[r].count += 1;
  }

  const out: Partial<
    Record<FungalZone["region"], { lat: number; lng: number; count: number }>
  > = {};
  for (const [region, v] of Object.entries(acc)) {
    out[region as FungalZone["region"]] = {
      lat: v.lat / v.count,
      lng: v.lng / v.count,
      count: v.count,
    };
  }
  return out;
}
