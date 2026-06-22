/** Layout desktop responsive — MushroomRadar */
export const DESKTOP_SIDEBAR_PX = 320;
export const DESKTOP_ACTION_RAIL_PX = 56;
export const DESKTOP_TOPBAR_PX = 72;

export const DESKTOP_SIDEBAR_CLASS = "md:w-[320px]";
export const DESKTOP_MAP_LEFT = "md:left-[320px]";
export const DESKTOP_MAP_RIGHT = "md:right-14";
export const DESKTOP_MAP_TOP = "md:top-[72px]";
export const DESKTOP_MAP_BOTTOM = "md:bottom-0";

/** Solo mobile — dock inferiore */
export const MAP_BOTTOM_MOBILE_COLLAPSED = "bottom-[104px] md:bottom-0";
export const MAP_BOTTOM_MOBILE_COMPACT = "bottom-[48px] md:bottom-0";
export const MAP_BOTTOM_MOBILE_EXPANDED = "bottom-[44dvh] md:bottom-0";

export const PANEL_ABOVE_DOCK_COLLAPSED = "bottom-[116px] md:bottom-4";
export const PANEL_ABOVE_DOCK_EXPANDED = "bottom-[46dvh] md:bottom-4";

export const GUIDE_FAB_MOBILE = "bottom-[116px] md:bottom-4";

export const MOBILE_DOCK_HANDLE_PX = 48;
export const MOBILE_TOOLBAR_PX = 56;
export const MOBILE_DOCK_COLLAPSED_PX =
  MOBILE_DOCK_HANDLE_PX + MOBILE_TOOLBAR_PX;
export const MOBILE_DOCK_EXPANDED_VH = 44;

export const DESKTOP_SIDEBAR_WIDTH = DESKTOP_SIDEBAR_PX;

export const mobileMapBottomClass = (expanded: boolean, compact?: boolean) => {
  if (expanded) return MAP_BOTTOM_MOBILE_EXPANDED;
  if (compact) return MAP_BOTTOM_MOBILE_COMPACT;
  return MAP_BOTTOM_MOBILE_COLLAPSED;
};
