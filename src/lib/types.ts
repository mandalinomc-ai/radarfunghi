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
  hourlyForecasts: HourlyForecast[];
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
