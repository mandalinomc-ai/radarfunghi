/** Telefono / tablet — non laptop touch con schermo grande */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const ipadOs =
    navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform);
  const narrowTouch =
    window.innerWidth < 768 &&
    (ua || ipadOs || window.matchMedia("(pointer: coarse)").matches);
  return ua || ipadOs || narrowTouch;
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
