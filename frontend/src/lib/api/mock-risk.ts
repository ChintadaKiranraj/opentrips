import { stableHash } from "@/lib/utils/hash";
import type { RiskRequest, RiskResponse, RiskVerdict } from "@/types/risk";

const DISCLAIMER =
  "SIMULATED DATA: this risk score is a mock placeholder for UI development. " +
  "It is not a real landslide forecast and has no scientific basis.";

/**
 * Deterministic mock risk assessment.
 *
 * This does NOT model real landslide risk. It derives a pseudo-random but
 * repeatable score from the request so the UI has stable, demo-able data
 * while Track B's AI teammate builds the real FastAPI model.
 */
export function generateMockRiskResponse(request: RiskRequest): RiskResponse {
  const seed = stableHash(
    `${request.place}|${request.startDate}|${request.endDate}`,
  );

  const riskScore = Math.round(((seed % 1000) / 1000) * 100) / 100;
  const verdict: RiskVerdict =
    riskScore < 0.34 ? "GO" : riskScore < 0.67 ? "CAUTION" : "WAIT";

  const explanationByVerdict: Record<RiskVerdict, string> = {
    GO: `Simulated conditions for ${request.place} look favorable for the selected dates. Standard outdoor precautions still apply.`,
    CAUTION: `Simulated data suggests elevated ground-saturation risk near ${request.place} for the selected dates. Monitor local advisories.`,
    WAIT: `Simulated indicators for ${request.place} suggest high slope instability risk for the selected dates. Consider postponing outdoor activity.`,
  };

  return {
    destination: request.place,
    riskScore,
    verdict,
    explanation: explanationByVerdict[verdict],
    rainfallFeatures: {
      last24hRainfallMm: Math.round((seed % 50) * 10) / 10,
      last72hRainfallMm: Math.round((seed % 150) * 10) / 10,
      forecastRainfallMm: Math.round((seed % 80) * 10) / 10,
      soilSaturationIndex: Math.round(((seed % 100) / 100) * 100) / 100,
    },
    modelName: "mock-risk-v0 (placeholder, not a trained model)",
    modelMetrics: {
      accuracy: null,
      precision: null,
      recall: null,
      f1Score: null,
      notes:
        "No real model metrics are available yet. These will be populated once the FastAPI backend provides validated evaluation results.",
    },
    isMockData: true,
    disclaimer: DISCLAIMER,
  };
}
