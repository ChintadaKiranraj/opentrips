/**
 * PROVISIONAL CONTRACT: Itinerary and plan domain types.
 *
 * Mirrors the shape Track B mocks for the future FastAPI `/plan` endpoint.
 * Not yet confirmed with the backend developer. See the note in risk.ts.
 */

import type { RiskVerdict } from "./risk";

export type DifficultyLevel = "easy" | "moderate" | "challenging";

export interface PlanRequest {
  place: string;
  startDate: string;
  endDate: string;
  constraints?: string;
  /** Optional context from a prior /api/risk call, if available. */
  riskVerdict?: RiskVerdict;
  riskScore?: number;
}

export interface OutdoorActivity {
  name: string;
  durationMinutes: number;
  difficulty: DifficultyLevel;
  notes: string;
}

export interface DayPlan {
  date: string; // ISO date
  dayLabel: string; // e.g. "Day 1"
  summary: string;
  activities: OutdoorActivity[];
}

export interface BudgetEstimate {
  currency: "INR";
  total: number;
  breakdown: {
    stay: number;
    food: number;
    localTransport: number;
    misc: number;
  };
}

export interface PlanResponse {
  destination: string;
  startDate: string;
  endDate: string;
  itinerary: DayPlan[];
  packingChecklist: string[];
  safetyNotes: string[];
  budgetEstimate: BudgetEstimate;
  isMockData: true;
  disclaimer: string;
}
