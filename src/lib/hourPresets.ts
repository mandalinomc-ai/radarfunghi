import type { HourRange } from "./timeRange";

export interface HourPreset {
  id: string;
  label: string;
  icon: string;
  range: HourRange;
}

export const HOUR_PRESETS: HourPreset[] = [
  { id: "alba", label: "Alba", icon: "🌅", range: { startHour: 5, endHour: 8 } },
  { id: "mattina", label: "Mattina", icon: "☀️", range: { startHour: 6, endHour: 11 } },
  { id: "mezzo", label: "Mezzogiorno", icon: "🌤️", range: { startHour: 11, endHour: 14 } },
  { id: "pomeriggio", label: "Pomeriggio", icon: "🌥️", range: { startHour: 14, endHour: 18 } },
  { id: "giornata", label: "Giornata", icon: "📅", range: { startHour: 6, endHour: 18 } },
];

export const RADIUS_QUICK_KM = [30, 60, 90, 120, 150] as const;

export function hourPresetMatches(
  hourRange: HourRange,
  preset: HourRange
): boolean {
  return (
    hourRange.startHour === preset.startHour &&
    hourRange.endHour === preset.endHour
  );
}
