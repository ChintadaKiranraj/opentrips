import { NextResponse } from "next/server";

import { GeocodeUnavailableError, geocodePlace } from "@/lib/api/geocode";
import type { ApiErrorResponse } from "@/types/api";
import type { GeocodeRequest } from "@/types/geo";

function isValidGeocodeRequest(body: unknown): body is GeocodeRequest {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as Record<string, unknown>;
  return typeof candidate.place === "string" && candidate.place.trim().length > 0;
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

  if (!isValidGeocodeRequest(body)) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid geocode request.", details: "Expected { place: string }" },
      { status: 400 },
    );
  }

  try {
    const result = await geocodePlace(body.place);

    if (!result) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: "Destination not found.",
          details: `We couldn't find "${body.place}" on OpenStreetMap. Try adding a state or country.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const details =
      error instanceof GeocodeUnavailableError ? error.message : "Failed to look up the destination.";
    return NextResponse.json<ApiErrorResponse>({ error: "Geocoding failed.", details }, { status: 502 });
  }
}
