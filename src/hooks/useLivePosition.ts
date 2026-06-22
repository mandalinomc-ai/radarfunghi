"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoPoint } from "@/lib/geoUtils";

export function useLivePosition(enabled: boolean) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchId = useRef<number | null>(null);

  const refreshOnce = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS non disponibile");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          name: "Posizione attuale",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
          accuracyMeters: Math.round(pos.coords.accuracy),
          positionConfidence:
            pos.coords.accuracy <= 25
              ? "high"
              : pos.coords.accuracy <= 80
                ? "medium"
                : "low",
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Permesso posizione negato"
            : "Impossibile ottenere GPS"
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          name: "Posizione attuale",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
          accuracyMeters: Math.round(pos.coords.accuracy),
        });
        setError(null);
      },
      () => {
        /* silent on watch errors — use refreshOnce */
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled]);

  return { position, error, loading, refreshOnce };
}
