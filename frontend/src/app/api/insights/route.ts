import { NextResponse } from "next/server";

import { findLandslidesNear } from "@/lib/insights/landslides";
import { findStaysNear, rankStays } from "@/lib/insights/stays";
import { getAreaWeather } from "@/lib/insights/weather";
import type { ApiErrorResponse } from "@/types/api";
import type { AreaInsights, InsightsRequest, LayerResult } from "@/types/insights";

const LANDSLIDE_RADIUS_KM = 30;
const STAY_RADIUS_KM = 15;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidInsightsRequest(body: unknown): body is InsightsRequest {
  if (typeof body !== "object" || body === null) return false;
  const c = body as Record<string, unknown>;
  return (
    typeof c.latitude === "number" &&
    Math.abs(c.latitude) <= 90 &&
    typeof c.longitude === "number" &&
    Math.abs(c.longitude) <= 180 &&
    typeof c.startDate === "string" &&
    ISO_DATE.test(c.startDate) &&
    typeof c.endDate === "string" &&
    ISO_DATE.test(c.endDate)
  );
}

function toLayer<T>(result: PromiseSettledResult<T>, errorMessage: string): LayerResult<T> {
  return result.status === "fulfilled"
    ? { data: result.value, error: null }
    : { data: null, error: errorMessage };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isValidInsightsRequest(body)) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid insights request.",
        details: "Expected { latitude: number, longitude: number, startDate: YYYY-MM-DD, endDate: YYYY-MM-DD }",
      },
      { status: 400 },
    );
  }

  const { latitude, longitude, startDate, endDate } = body;

  const [landslides, weather, rawStays] = await Promise.allSettled([
    findLandslidesNear(latitude, longitude, LANDSLIDE_RADIUS_KM),
    getAreaWeather(latitude, longitude, startDate, endDate),
    findStaysNear(latitude, longitude, STAY_RADIUS_KM),
  ]);

  const landslideLayer = toLayer(landslides, "NASA landslide records are unavailable right now.");

  const insights: AreaInsights = {
    landslides: landslideLayer,
    weather: toLayer(weather, "The weather forecast is unavailable right now."),
    stays:
      rawStays.status === "fulfilled"
        ? { data: rankStays(rawStays.value, landslideLayer.data, { latitude, longitude }), error: null }
        : { data: null, error: "OpenStreetMap places to stay are unavailable right now." },
  };

  return NextResponse.json(insights);
}
