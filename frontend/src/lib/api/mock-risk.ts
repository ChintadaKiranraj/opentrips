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
 * while real backend mode (USE_MOCK_AI=false) is off. Field shape matches
 * `src/types/risk.ts` exactly, so switching modes never requires a UI change.
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
      rain1dMm: Math.round((seed % 50) * 10) / 10,
      rain3dMm: Math.round((seed % 100) * 10) / 10,
      rain7dMm: Math.round((seed % 150) * 10) / 10,
      rain14dMm: Math.round((seed % 200) * 10) / 10,
    },
    modelName: "mock-risk-v0 (placeholder, not a trained model)",
    modelMetrics: {
      accuracy: null,
      precision: null,
      recall: null,
      f1Score: null,
      notes:
        "No real model metrics are available in mock mode. These come from TabPFN's GEO-split accuracy once USE_MOCK_AI=false.",
    },
    isMockData: true,
    disclaimer: DISCLAIMER,
  };
}
