export interface HourRange {
  startHour: number;
  endHour: number;
}

export function normalizeHourRange(startHour: number, endHour: number): HourRange {
  const start = Math.max(0, Math.min(23, startHour));
  const end = Math.max(0, Math.min(23, endHour));
  if (start <= end) return { startHour: start, endHour: end };
  return { startHour: end, endHour: start };
}

export function getHoursInRange(range: HourRange): number[] {
  const hours: number[] = [];
  for (let h = range.startHour; h <= range.endHour; h++) {
    hours.push(h);
  }
  return hours;
}

export function isSingleHour(range: HourRange): boolean {
  return range.startHour === range.endHour;
}

export function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

export function formatHourRange(range: HourRange): string {
  if (isSingleHour(range)) return `ore ${formatHour(range.startHour)}`;
  return `dalle ${formatHour(range.startHour)} alle ${formatHour(range.endHour)}`;
}

export function hourInRange(hour: number, range: HourRange): boolean {
  return hour >= range.startHour && hour <= range.endHour;
}
