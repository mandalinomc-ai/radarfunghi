export type MushroomSpecies = "estatino" | "galletto" | "porcino";

export type TerrainExposure = "north" | "south" | "east" | "west";

export interface RainHistory {
  date: string;
  mm: number;
}

export interface HourlyForecast {
  hour: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  /** km/h da Open-Meteo wind_speed_10m */
  windSpeed?: number;
  /** km/h raffiche */
  windGusts?: number;
  /** hPa pressione atmosferica */
  surfacePressure?: number;
  /** % copertura nuvolosa */
  cloudCover?: number;
}

export interface CollectionWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  label: string;
}

export interface FungalZone {
  id: string;
  name: string;
  region:
    | "matese"
    | "taburno"
    | "sannio"
    | "molise"
    | "campania"
    | "basilicata";
  lat: number;
  lng: number;
  altitude: number;
  exposure: TerrainExposure;
  forestType: string;
  species: MushroomSpecies[];
  rainHistory: RainHistory[];
  baseSoilMoisture: number;
  nightThermalShock: number;
  parkingLat: number;
  parkingLng: number;
  /** Minuti di viaggio stimati da Benevento città */
  driveMinutesFromBenevento: number;
  /** Distanza stradale stimata da Benevento città (km) */
  kmFromBenevento: number;
  hourlyForecasts: HourlyForecast[];
  /** Previsioni orarie per ogni giorno (passato/oggi/futuro) da Open-Meteo + ARPA */
  forecastsByDate?: Record<string, HourlyForecast[]>;
  collectionWindow: CollectionWindow;
}

export interface PredictionResult {
  zoneId: string;
  species: MushroomSpecies;
  score: number;
  factors: {
    rainScore: number;
    moistureScore: number;
    thermalScore: number;
    altitudeScore: number;
    exposureScore: number;
    timeScore: number;
  };
}

export interface MapHotspot {
  zone: FungalZone;
  predictions: PredictionResult[];
  activeScore: number;
  activeSpecies: MushroomSpecies;
}

export type ReportType = "spia" | "bottata" | "ritrovamento";

export interface MushroomReport {
  id: string;
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  photoUrl: string;
  reportType: ReportType;
  species: MushroomSpecies | "sconosciuto";
  note: string;
  createdAt: string;
  /** Zona radar abbinata dal motore di validazione */
  matchedZoneId?: string | null;
  matchedZoneName?: string | null;
  matchDistanceKm?: number | null;
  validationStatus?: "validated" | "too_far" | "pending";
  /** Bonus applicato alla zona (+0.15 = +15% Sprout) */
  reliabilityBonus?: number;
}

/** Zona spia segnalata da link Maps o coordinate (visibile a tutti) */
export interface SpyZoneMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  note: string;
  sourceInput: string;
  species: MushroomSpecies | "sconosciuto";
  createdAt: string;
  matchedZoneId?: string | null;
  matchedZoneName?: string | null;
  matchDistanceKm?: number | null;
}
