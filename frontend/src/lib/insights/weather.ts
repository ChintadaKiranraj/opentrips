import { classifyWeather, worstSeverity } from "@/lib/insights/weather-codes";
import type { WeatherCell, WeatherDay, WeatherInsight } from "@/types/insights";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
].join(",");

/** 5 x 5 grid, 0.1 degrees (~11 km) apart, centered on the destination. */
const GRID_STEP_DEG = 0.1;
const GRID_OFFSETS = [-2, -1, 0, 1, 2].map((n) => n * GRID_STEP_DEG);
const FALLBACK_DAYS = 7;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface OpenMeteoDaily {
  time: string[];
  weather_code: (number | null)[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  precipitation_probability_max: (number | null)[];
  wind_speed_10m_max: (number | null)[];
}

interface OpenMeteoLocation {
  latitude: number;
  longitude: number;
  daily: OpenMeteoDaily;
}

const cache = new Map<string, { expires: number; value: WeatherInsight }>();

export async function getAreaWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<WeatherInsight> {
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)},${startDate},${endDate}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  const points = GRID_OFFSETS.flatMap((dLat) =>
    GRID_OFFSETS.map((dLon) => ({ latitude: latitude + dLat, longitude: longitude + dLon })),
  );

  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", points.map((p) => p.latitude.toFixed(4)).join(","));
  url.searchParams.set("longitude", points.map((p) => p.longitude.toFixed(4)).join(","));
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "16");

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);

  const locations = (await response.json()) as OpenMeteoLocation[];
  const center = locations[Math.floor(points.length / 2)];

  const tripIndices = center.daily.time.flatMap((date, index) =>
    date >= startDate && date <= endDate ? [index] : [],
  );
  const coversTripDates = tripIndices.length > 0;
  const windowIndices = coversTripDates
    ? tripIndices
    : center.daily.time.slice(0, FALLBACK_DAYS).map((_, index) => index);

  const days: WeatherDay[] = windowIndices.map((index) => toWeatherDay(center.daily, index));

  const grid: WeatherCell[] = locations.map((location, i) => {
    const cellDays = windowIndices.map((index) => toWeatherDay(location.daily, index));
    const worst = cellDays.reduce((a, b) => (b.precipitationMm > a.precipitationMm ? b : a), cellDays[0]);
    const winds = cellDays.map((d) => d.windMaxKmh).filter((w): w is number => w !== null);

    return {
      latitude: points[i].latitude,
      longitude: points[i].longitude,
      halfSizeDeg: GRID_STEP_DEG / 2,
      weatherCode: worst?.weatherCode ?? 0,
      maxPrecipitationMm: worst?.precipitationMm ?? 0,
      maxWindKmh: winds.length > 0 ? Math.max(...winds) : null,
      severity: worstSeverity(cellDays.map((d) => d.severity)),
    };
  });

  const value: WeatherInsight = { coversTripDates, days, grid };
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  return value;
}

function toWeatherDay(daily: OpenMeteoDaily, index: number): WeatherDay {
  const weatherCode = daily.weather_code[index] ?? 0;
  const precipitationMm = daily.precipitation_sum[index] ?? 0;
  const windMaxKmh = daily.wind_speed_10m_max[index];

  return {
    date: daily.time[index],
    weatherCode,
    tempMaxC: daily.temperature_2m_max[index],
    tempMinC: daily.temperature_2m_min[index],
    precipitationMm,
    precipitationChance: daily.precipitation_probability_max[index],
    windMaxKmh,
    severity: classifyWeather(weatherCode, precipitationMm, windMaxKmh),
  };
}
