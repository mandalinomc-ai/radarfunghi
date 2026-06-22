/** Runtime Cesium caricato da /cesium/Cesium.js (non dal bundle webpack). */
export type CesiumRuntime = typeof import("cesium");

const CESIUM_SCRIPT = "/cesium/Cesium.js";
const CESIUM_CSS = "/cesium/Widgets/widgets.css";

let loadPromise: Promise<CesiumRuntime> | null = null;

function ensureCesiumBaseUrl(): void {
  if (typeof window === "undefined") return;
  window.CESIUM_BASE_URL = "/cesium/";
}

function ensureCesiumCss(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("cesium-widgets-css")) return;
  const link = document.createElement("link");
  link.id = "cesium-widgets-css";
  link.rel = "stylesheet";
  link.href = CESIUM_CSS;
  document.head.appendChild(link);
}

function waitForCesium(timeoutMs = 120_000): Promise<CesiumRuntime> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.Cesium) {
        resolve(window.Cesium);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Timeout caricamento motore 3D"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** Carica Cesium come asset statico — evita chunk webpack enormi su Vercel. */
export function loadCesium(force = false): Promise<CesiumRuntime> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cesium disponibile solo nel browser"));
  }

  ensureCesiumBaseUrl();
  ensureCesiumCss();

  if (!force && window.Cesium) {
    return Promise.resolve(window.Cesium);
  }

  if (!force && loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve(window.Cesium);
      return;
    }

    const existing = document.querySelector(
      `script[src="${CESIUM_SCRIPT}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      waitForCesium()
        .then(resolve)
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = CESIUM_SCRIPT;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      waitForCesium()
        .then(resolve)
        .catch(reject);
    };

    script.onerror = () => {
      loadPromise = null;
      reject(
        new Error(
          "Motore 3D non trovato sul server. Ricarica la pagina o usa la vista 2D."
        )
      );
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function resetCesiumLoader(): void {
  loadPromise = null;
}
