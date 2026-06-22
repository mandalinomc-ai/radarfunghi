"use client";

import { TileLayer } from "react-leaflet";
import {
  CARTO_VOYAGER_LABELS_URL,
  ESRI_HYBRID_LABELS_URL,
} from "@/lib/mapUtils";

const CARTO_SUBDOMAINS = ["a", "b", "c", "d"];

/**
 * Etichette città/paesi/strade sopra satellite — stile simile a Google Maps ibrido.
 * Carto Voyager (OSM) per comuni e località; ESRI per confini amministrativi.
 */
export default function MapLabelLayers() {
  return (
    <>
      <TileLayer
        url={ESRI_HYBRID_LABELS_URL}
        attribution=""
        maxZoom={19}
        opacity={0.42}
        className="map-labels-boundaries"
      />
      <TileLayer
        url={CARTO_VOYAGER_LABELS_URL}
        subdomains={CARTO_SUBDOMAINS}
        attribution='&copy; OpenStreetMap &copy; CARTO'
        maxZoom={20}
        maxNativeZoom={20}
        opacity={1}
        className="map-labels-places"
      />
    </>
  );
}
