import type * as CesiumNamespace from "cesium";

declare global {
  interface Window {
    Cesium: typeof CesiumNamespace;
    CESIUM_BASE_URL?: string;
  }
}

export {};
