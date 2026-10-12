import { useSyncExternalStore } from "react";

import type { GeocodeResult } from "@/types/geo";
import type { PlanResponse } from "@/types/plan";
import type { RiskResponse } from "@/types/risk";

const STORAGE_KEY = "trip-planner:last-result";

export interface TripResult {
  risk: RiskResponse;
  plan: PlanResponse;
  /** Missing on results saved before OpenStreetMap geocoding was added. */
  location?: GeocodeResult;
}

/**
 * Hands the most recent trip result from the homepage form to /results via
 * sessionStorage. This is a placeholder for real persistence (see B3:
 * PostgreSQL + Prisma, shareable plan URLs) and intentionally only lives for
 * the current tab session.
 */
export function saveTripResult(result: TripResult): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

let cachedRaw: string | null = null;
let cachedResult: TripResult | null = null;

/**
 * useSyncExternalStore requires getSnapshot to return a stable reference
 * when nothing changed. JSON.parse would otherwise allocate a new object
 * on every call and trigger an infinite re-render loop.
 */
function loadTripResult(): TripResult | null {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedResult;

  cachedRaw = raw;
  cachedResult = raw ? parseTripResult(raw) : null;
  return cachedResult;
}

function parseTripResult(raw: string): TripResult | null {
  try {
    return JSON.parse(raw) as TripResult;
  } catch {
    return null;
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot(): null {
  return null;
}

/** Reads the last saved trip result without causing hydration mismatches or set-state-in-effect warnings. */
export function useTripResult(): TripResult | null {
  return useSyncExternalStore(subscribe, loadTripResult, getServerSnapshot);
}
