import type { WeatherSeverity } from "@/types/insights";

/** WMO weather interpretation codes, as returned by Open-Meteo. */
const conditionLabels: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

const SEVERE_CODES = new Set([65, 67, 75, 82, 86, 95, 96, 99]);
const MODERATE_CODES = new Set([55, 57, 63, 66, 73, 81, 85]);
const LIGHT_CODES = new Set([51, 53, 56, 61, 71, 77, 80]);

export function weatherLabel(code: number) {
  return conditionLabels[code] ?? "Unknown conditions";
}

export function classifyWeather(code: number, precipitationMm: number, windKmh: number | null): WeatherSeverity {
  const wind = windKmh ?? 0;
  if (SEVERE_CODES.has(code) || precipitationMm >= 50 || wind >= 60) return "severe";
  if (MODERATE_CODES.has(code) || precipitationMm >= 15 || wind >= 40) return "moderate";
  if (LIGHT_CODES.has(code) || precipitationMm >= 2) return "light";
  return "clear";
}

export const severityColors: Record<WeatherSeverity, string> = {
  clear: "#38bdf8",
  light: "#60a5fa",
  moderate: "#f59e0b",
  severe: "#ef4444",
};

export const severityLabels: Record<WeatherSeverity, string> = {
  clear: "Clear",
  light: "Light rain",
  moderate: "Heavy rain or strong wind",
  severe: "Storm or very heavy rain",
};

const severityRank: Record<WeatherSeverity, number> = { clear: 0, light: 1, moderate: 2, severe: 3 };

export function worstSeverity(severities: WeatherSeverity[]): WeatherSeverity {
  return severities.reduce<WeatherSeverity>(
    (worst, current) => (severityRank[current] > severityRank[worst] ? current : worst),
    "clear",
  );
}
