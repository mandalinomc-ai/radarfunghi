/** Rileva mobile / dispositivi senza WebGL adeguato per Cesium 3D */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarse || narrow || ua;
}

export function canUseMap3D(): boolean {
  if (typeof window === "undefined") return false;
  if (isMobileDevice()) return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}
