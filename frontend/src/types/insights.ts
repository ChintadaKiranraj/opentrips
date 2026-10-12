export interface InsightsRequest {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}

/** A recorded landslide from NASA's Global Landslide Catalog. */
export interface LandslideEvent {
  id: string;
  title: string;
  date: string | null;
  latitude: number;
  longitude: number;
  category: string | null;
  trigger: string | null;
  size: string | null;
  fatalities: number | null;
  distanceKm: number;
}

export type WeatherSeverity = "clear" | "light" | "moderate" | "severe";

export interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipitationMm: number;
  precipitationChance: number | null;
  windMaxKmh: number | null;
  severity: WeatherSeverity;
}

/** Worst forecast conditions over the trip window at one point of the area grid. */
export interface WeatherCell {
  latitude: number;
  longitude: number;
  /** Half the grid spacing in degrees, so the cell can be drawn as a square. */
  halfSizeDeg: number;
  weatherCode: number;
  maxPrecipitationMm: number;
  maxWindKmh: number | null;
  severity: WeatherSeverity;
}

export interface WeatherInsight {
  /** False when the trip is beyond the 16-day forecast range and the next days are shown instead. */
  coversTripDates: boolean;
  days: WeatherDay[];
  grid: WeatherCell[];
}

export type StaySafety = "good" | "caution" | "risky" | "unknown";

export interface Stay {
  id: string;
  name: string;
  kind: string;
  latitude: number;
  longitude: number;
  stars: number | null;
  distanceKm: number;
  nearestLandslideKm: number | null;
  safety: StaySafety;
  website: string | null;
  phone: string | null;
}

export type LayerResult<T> = { data: T; error: null } | { data: null; error: string };

export interface AreaInsights {
  landslides: LayerResult<LandslideEvent[]>;
  weather: LayerResult<WeatherInsight>;
  stays: LayerResult<Stay[]>;
}
