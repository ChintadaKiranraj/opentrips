/**
 * PROVISIONAL CONTRACT: Risk domain types.
 *
 * These types describe the shape Track B currently mocks for the FastAPI
 * `/risk` endpoint. The real backend contract has not been confirmed with
 * the AI/backend teammate yet. Field names, units, and value ranges here
 * are placeholders and MUST be reconciled before wiring up the real API
 * (see src/lib/api/client.ts).
 */

export type RiskVerdict = "GO" | "CAUTION" | "WAIT";

export interface RiskRequest {
  place: string;
  latitude: number;
  longitude: number;
  startDate: string; // ISO date, e.g. "2026-10-17"
  endDate: string; // ISO date, e.g. "2026-10-18"
  constraints?: string;
}

export interface RainfallFeatures {
  /** Example feature placeholders only, not sourced from a real weather model. */
  last24hRainfallMm: number;
  last72hRainfallMm: number;
  forecastRainfallMm: number;
  soilSaturationIndex: number; // 0-1, placeholder
}

/**
 * Model evaluation metrics are intentionally nullable. Until the backend
 * team supplies real, validated metrics, UI must render these as
 * "not yet available" rather than inventing numbers.
 */
export interface ModelEvaluationMetrics {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  notes: string;
}

export interface RiskResponse {
  destination: string;
  riskScore: number; // 0-1, SIMULATED, not a real landslide forecast
  verdict: RiskVerdict;
  explanation: string;
  rainfallFeatures: RainfallFeatures;
  modelName: string;
  modelMetrics: ModelEvaluationMetrics;
  isMockData: true;
  disclaimer: string;
}
