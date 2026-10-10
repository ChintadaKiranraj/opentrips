/**
 * Shared API envelope types for Track B's Next.js route handlers.
 * These wrap the provisional risk/plan contracts (see risk.ts, plan.ts).
 */

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

export type AiBackendMode = "mock" | "proxy";
