/**
 * Server-only environment configuration.
 *
 * Do not import this module from Client Components. It is read exclusively
 * by Route Handlers and other server code. Never re-export AI_API_BASE_URL to the
 * client.
 */

export interface AiBackendConfig {
  useMock: boolean;
  baseUrl: string | null;
}

export function getAiBackendConfig(): AiBackendConfig {
  const useMock = (process.env.USE_MOCK_AI ?? "true").toLowerCase() !== "false";
  const baseUrl = process.env.AI_API_BASE_URL?.trim() || null;

  return { useMock, baseUrl };
}

export class MissingBackendConfigError extends Error {
  constructor() {
    super(
      "USE_MOCK_AI is false but AI_API_BASE_URL is not configured. " +
        "Set AI_API_BASE_URL in your environment, or set USE_MOCK_AI=true to use local mocks.",
    );
    this.name = "MissingBackendConfigError";
  }
}
