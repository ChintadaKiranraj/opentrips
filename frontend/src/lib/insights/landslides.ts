import { parseCsv } from "@/lib/insights/csv";
import { haversineKm } from "@/lib/insights/geo-math";
import type { LandslideEvent } from "@/types/insights";

const CATALOG_URL =
  "https://data.nasa.gov/docs/legacy/Global_Landslide_Catalog_Export/Global_Landslide_Catalog_Export_rows.csv";

const MAX_RESULTS = 150;

type CatalogEntry = Omit<LandslideEvent, "distanceKm">;

/** The catalog is ~8 MB, so it is downloaded once per server process and kept in memory. */
let catalogPromise: Promise<CatalogEntry[]> | null = null;

function loadCatalog() {
  catalogPromise ??= fetchCatalog().catch((error: unknown) => {
    catalogPromise = null;
    throw error;
  });
  return catalogPromise;
}

function textOrNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toIsoDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

async function fetchCatalog(): Promise<CatalogEntry[]> {
  const response = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`NASA landslide catalog returned ${response.status}`);

  const [header, ...rows] = parseCsv(await response.text());
  const column = (name: string) => header.indexOf(name);
  const idx = {
    id: column("event_id"),
    title: column("event_title"),
    date: column("event_date"),
    category: column("landslide_category"),
    trigger: column("landslide_trigger"),
    size: column("landslide_size"),
    fatalities: column("fatality_count"),
    latitude: column("latitude"),
    longitude: column("longitude"),
  };

  return rows.flatMap((row) => {
    const latitude = Number(row[idx.latitude]);
    const longitude = Number(row[idx.longitude]);
    if (!row[idx.latitude] || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

    const fatalities = Number(row[idx.fatalities]);

    return [
      {
        id: row[idx.id] || `${latitude},${longitude}`,
        title: textOrNull(row[idx.title]) ?? "Recorded landslide",
        date: toIsoDate(row[idx.date]),
        latitude,
        longitude,
        category: textOrNull(row[idx.category]),
        trigger: textOrNull(row[idx.trigger]),
        size: textOrNull(row[idx.size]),
        fatalities: row[idx.fatalities] && Number.isFinite(fatalities) ? fatalities : null,
      },
    ];
  });
}

/** Recorded landslides within `radiusKm` of a point, nearest first. */
export async function findLandslidesNear(
  latitude: number,
  longitude: number,
  radiusKm: number,
): Promise<LandslideEvent[]> {
  const catalog = await loadCatalog();

  return catalog
    .map((entry) => ({
      ...entry,
      distanceKm: haversineKm(latitude, longitude, entry.latitude, entry.longitude),
    }))
    .filter((entry) => entry.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_RESULTS);
}
