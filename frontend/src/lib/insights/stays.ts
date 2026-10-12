import { haversineKm } from "@/lib/insights/geo-math";
import type { LandslideEvent, Stay, StaySafety } from "@/types/insights";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TripPlanner/0.1 (Hacktoberfest 2026 hackathon project)";
const SEARCH_PHRASES = ["hotel", "guest house", "resort", "hostel"];
const STAY_TYPES = new Set(["hotel", "guest_house", "hostel", "resort", "motel", "chalet", "apartment"]);
const GENERIC_NAMES = new Set(["hotel", "guest house", "resort", "hostel", "lodge", "homestay", "home stay"]);
/** Nominatim allows at most one request per second. */
const REQUEST_SPACING_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PARTIAL_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESULTS = 30;

interface NominatimPlace {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name: string;
  category: string;
  type: string;
  extratags: Record<string, string> | null;
}

type RawStay = Omit<Stay, "distanceKm" | "nearestLandslideKm" | "safety">;

const cache = new Map<string, { expires: number; value: RawStay[] }>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Named places to stay from OpenStreetMap within roughly `radiusKm` of a point,
 * found through Nominatim (the public Overpass servers are often overloaded).
 */
export async function findStaysNear(latitude: number, longitude: number, radiusKm: number): Promise<RawStay[]> {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)},${radiusKm}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.1));
  const viewbox = [longitude - lonDelta, latitude + latDelta, longitude + lonDelta, latitude - latDelta].join(",");

  const byId = new Map<string, RawStay>();
  let failures = 0;

  for (const [index, phrase] of SEARCH_PHRASES.entries()) {
    if (index > 0) await sleep(REQUEST_SPACING_MS);

    const url = new URL(NOMINATIM_SEARCH_URL);
    url.searchParams.set("q", phrase);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("viewbox", viewbox);
    url.searchParams.set("bounded", "1");
    url.searchParams.set("limit", "40");
    url.searchParams.set("extratags", "1");

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);

      for (const place of (await response.json()) as NominatimPlace[]) {
        const stay = toRawStay(place);
        if (stay) byId.set(stay.id, stay);
      }
    } catch {
      failures++;
    }
  }

  if (failures === SEARCH_PHRASES.length) throw new Error("Nominatim stay search failed");

  const value = [...byId.values()];
  const ttl = failures > 0 ? PARTIAL_CACHE_TTL_MS : CACHE_TTL_MS;
  cache.set(key, { expires: Date.now() + ttl, value });
  return value;
}

function toRawStay(place: NominatimPlace): RawStay | null {
  const name = place.name?.trim();
  if (place.category !== "tourism" || !STAY_TYPES.has(place.type)) return null;
  if (!name || GENERIC_NAMES.has(name.toLowerCase())) return null;

  const tags = place.extratags ?? {};
  const stars = Number.parseFloat(tags.stars ?? "");

  return {
    id: `${place.osm_type}/${place.osm_id}`,
    name,
    kind: place.type.replace("_", " "),
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    stars: Number.isFinite(stars) ? stars : null,
    website: tags.website ?? tags["contact:website"] ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
  };
}

function safetyFor(nearestLandslideKm: number | null, landslidesKnown: boolean): StaySafety {
  if (!landslidesKnown) return "unknown";
  if (nearestLandslideKm === null || nearestLandslideKm >= 3) return "good";
  if (nearestLandslideKm >= 1) return "caution";
  return "risky";
}

const safetyScore: Record<StaySafety, number> = { good: 30, unknown: 0, caution: 5, risky: -40 };

/**
 * OpenStreetMap has no guest reviews, so "best" means: star rating when tagged,
 * far from recorded landslides, close to the destination, and reachable
 * (website or phone listed).
 */
export function rankStays(
  stays: RawStay[],
  landslides: LandslideEvent[] | null,
  center: { latitude: number; longitude: number },
): Stay[] {
  return stays
    .map((stay) => {
      const distanceKm = haversineKm(center.latitude, center.longitude, stay.latitude, stay.longitude);
      const nearestLandslideKm =
        landslides && landslides.length > 0
          ? Math.min(...landslides.map((l) => haversineKm(stay.latitude, stay.longitude, l.latitude, l.longitude)))
          : null;
      const safety = safetyFor(nearestLandslideKm, landslides !== null);
      const score =
        (stay.stars ?? 2.5) * 15 +
        safetyScore[safety] +
        (stay.website ? 6 : 0) +
        (stay.phone ? 4 : 0) -
        distanceKm * 2;

      return { stay: { ...stay, distanceKm, nearestLandslideKm, safety }, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ stay }) => stay);
}
