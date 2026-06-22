"use client";

import { useCallback, useEffect, useState } from "react";

export type CompassPermission = "granted" | "denied" | "prompt" | "unsupported";

export interface DeviceCompassState {
  heading: number | null;
  permission: CompassPermission;
  supported: boolean;
  error: string | null;
}

function readHeading(e: DeviceOrientationEvent): number | null {
  const anyE = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
  if (typeof anyE.webkitCompassHeading === "number") {
    return anyE.webkitCompassHeading;
  }
  if (e.alpha != null) {
    return 360 - e.alpha;
  }
  return null;
}

export function useDeviceCompass(enabled: boolean) {
  const [state, setState] = useState<DeviceCompassState>({
    heading: null,
    permission: "prompt",
    supported: false,
    error: null,
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const DO = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof DO.requestPermission === "function") {
      try {
        const result = await DO.requestPermission();
        const granted = result === "granted";
        setState((s) => ({
          ...s,
          permission: granted ? "granted" : "denied",
          supported: granted,
          error: granted ? null : "Permesso bussola negato",
        }));
        return granted;
      } catch {
        setState((s) => ({
          ...s,
          permission: "denied",
          error: "Impossibile attivare la bussola",
        }));
        return false;
      }
    }

    setState((s) => ({ ...s, permission: "granted", supported: true }));
    return true;
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const hasOrientation = "DeviceOrientationEvent" in window;
    if (!hasOrientation) {
      setState({
        heading: null,
        permission: "unsupported",
        supported: false,
        error: "Bussola non supportata su questo dispositivo",
      });
      return;
    }

    const onOrient = (e: DeviceOrientationEvent) => {
      const h = readHeading(e);
      if (h == null) return;
      setState((s) => ({
        ...s,
        heading: normalizeHeading(h),
        supported: true,
        permission: s.permission === "prompt" ? "granted" : s.permission,
      }));
    };

    window.addEventListener("deviceorientation", onOrient, true);
    return () => window.removeEventListener("deviceorientation", onOrient, true);
  }, [enabled]);

  return { ...state, requestPermission };
}

function normalizeHeading(h: number): number {
  return ((h % 360) + 360) % 360;
}
