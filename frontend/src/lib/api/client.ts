import { getAiBackendConfig, MissingBackendConfigError } from "@/config/env";
import { generateMockPlanResponse } from "@/lib/api/mock-plan";
import { generateMockRiskResponse } from "@/lib/api/mock-risk";
import type { PlanRequest, PlanResponse } from "@/types/plan";
import type { RiskRequest, RiskResponse } from "@/types/risk";

/**
 * Server-only AI backend client.
 *
 * Route Handlers call this instead of talking to mocks or FastAPI directly.
 * This is the single place that decides mock-vs-proxy behavior, so the rest
 * of the app (and the frontend) never knows which mode is active.
 */

async function proxyToBackend<TResponse>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`AI backend request to ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function fetchRiskAssessment(request: RiskRequest): Promise<RiskResponse> {
  const { useMock, baseUrl } = getAiBackendConfig();

  if (useMock) {
    return generateMockRiskResponse(request);
  }

  if (!baseUrl) {
    throw new MissingBackendConfigError();
  }

  // Real FastAPI contract not yet confirmed. The path and shape may change.
  return proxyToBackend<RiskResponse>(baseUrl, "/risk", request);
}

export async function fetchPlan(request: PlanRequest): Promise<PlanResponse> {
  const { useMock, baseUrl } = getAiBackendConfig();

  if (useMock) {
    return generateMockPlanResponse(request);
  }

  if (!baseUrl) {
    throw new MissingBackendConfigError();
  }

  // Real FastAPI contract not yet confirmed. The path and shape may change.
  return proxyToBackend<PlanResponse>(baseUrl, "/plan", request);
}
