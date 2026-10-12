/**
 * CONFIRMED CONTRACT: Risk domain types.
 *
 * Reconciled against the real FastAPI `/risk` endpoint in `main.py` (see
 * PROJECT_LOG.md §12/§13). Every field here is either sent to, or returned
 * by, the real backend, no placeholder or fabricated fields.
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

/**
 * Real rolling rainfall windows straight from Open-Meteo's forecast API,
 * the same features the TabPFN model is scored on. No soil-moisture or
 * other sensor the project doesn't actually have.
 */
export interface RainfallFeatures {
  rain1dMm: number;
  rain3dMm: number;
  rain7dMm: number;
  rain14dMm: number;
}

/**
 * accuracy is TabPFN's real GEO-split score (India held out entirely from
 * training, see PROJECT_LOG.md §6). precision/recall/f1 are left null,
 * they were never computed, and this type keeps that honest rather than
 * inventing numbers for the UI.
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
  riskScore: number; // 0-1, TabPFN's predicted probability in real mode
  verdict: RiskVerdict;
  explanation: string;
  rainfallFeatures: RainfallFeatures;
  modelName: string;
  modelMetrics: ModelEvaluationMetrics;
  isMockData: boolean;
  disclaimer: string;
}
