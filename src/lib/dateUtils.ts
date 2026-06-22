const IT_DATE = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function todayISO(): string {
  return formatDateISO(new Date());
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function dayOffsetFromToday(iso: string): number {
  const target = parseISODate(iso);
  const today = parseISODate(todayISO());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDateLabel(iso: string): string {
  const offset = dayOffsetFromToday(iso);
  if (offset === 0) return "Oggi";
  if (offset === 1) return "Domani";
  if (offset === 2) return "Dopodomani";
  if (offset > 0 && offset <= 7) return `Tra ${offset} giorni`;
  return IT_DATE.format(parseISODate(iso));
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseISODate(iso));
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

export function minSelectableDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return formatDateISO(d);
}

export function maxSelectableDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return formatDateISO(d);
}

/** True se la data reale è oltre la data indicata in testo tipo "10-12 giugno 2026" */
export function isPastItalianDateRange(text: string, referenceISO: string): boolean {
  const ref = parseISODate(referenceISO);
  const match = text.match(/(\d{1,2})[-–](\d{1,2})\s+(\w+)\s*(\d{4})?/i);
  if (!match) return false;
  const endDay = Number(match[2]);
  const monthName = match[3].toLowerCase();
  const year = match[4] ? Number(match[4]) : ref.getFullYear();
  const months: Record<string, number> = {
    gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
    luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11,
  };
  const month = months[monthName];
  if (month === undefined) return false;
  const endDate = new Date(year, month, endDay);
  return ref >= endDate;
}
