import type { GeocodeResult } from "@/types/geo";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Nominatim's usage policy requires an identifying User-Agent and at most one
 * request per second, so results are cached for the lifetime of the server.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
const USER_AGENT = "TripPlanner/0.1 (Hacktoberfest 2026 hackathon project)";

const cache = new Map<string, GeocodeResult | null>();

interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
}

export class GeocodeUnavailableError extends Error {
  constructor() {
    super("OpenStreetMap search is unavailable right now. Please try again in a moment.");
    this.name = "GeocodeUnavailableError";
  }
}

/** Returns the best OpenStreetMap match for a place name, or null when nothing matches. */
export async function geocodePlace(place: string): Promise<GeocodeResult | null> {
  const key = place.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set("q", place.trim());
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new GeocodeUnavailableError();
  }

  if (!response.ok) throw new GeocodeUnavailableError();

  const [match] = (await response.json()) as NominatimPlace[];
  const result = match ? toGeocodeResult(match) : null;
  cache.set(key, result);
  return result;
}

function toGeocodeResult(place: NominatimPlace): GeocodeResult {
  const box = place.boundingbox?.map(Number);

  return {
    displayName: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    boundingBox:
      box && box.length === 4 && box.every(Number.isFinite)
        ? [box[0], box[1], box[2], box[3]]
        : null,
  };
}
