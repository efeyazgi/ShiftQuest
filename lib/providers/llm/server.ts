import "server-only";

import {
  GOOGLE_GEMINI_NATIVE_BASE_URL,
  GOOGLE_GEMINI_TEXT_MODEL,
} from "../google-gemini";
import { toSafeProviderError } from "../errors";
import type { RuntimeLLMConfig } from "../runtime-config";
import { assertRuntimeProviderOriginAllowed } from "../runtime-config.server";
import type {
  FeedbackInput,
  FeedbackResult,
  GeneratedScenario,
  LLMProvider,
  LLMRunResult,
  RoleplayInput,
  RoleplayResult,
  ScenarioGenerationInput,
} from "./contracts";
import { MockLLMProvider } from "./mock";
import { GoogleGeminiLLMProvider } from "./google-gemini";
import { OpenAICompatibleLLMProvider } from "./openai-compatible";

type ProviderSelection = {
  provider: LLMProvider;
  configured: boolean;
};

function parseTimeout(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getLLMProvider(
  runtimeConfig?: RuntimeLLMConfig,
): ProviderSelection {
  if (runtimeConfig) {
    assertRuntimeProviderOriginAllowed(runtimeConfig);
    return {
      provider:
        runtimeConfig.provider === "google-gemini"
          ? new GoogleGeminiLLMProvider({
              apiKey: runtimeConfig.apiKey,
              baseUrl: runtimeConfig.baseUrl,
              model: runtimeConfig.model,
              timeoutMs: parseTimeout(process.env.LLM_TIMEOUT_MS),
            })
          : new OpenAICompatibleLLMProvider({
              apiKey: runtimeConfig.apiKey,
              baseUrl: runtimeConfig.baseUrl,
              model: runtimeConfig.model,
              providerId: runtimeConfig.provider,
              timeoutMs: parseTimeout(process.env.LLM_TIMEOUT_MS),
            }),
      configured: true,
    };
  }

  const requested = (process.env.LLM_PROVIDER ?? "mock").trim().toLowerCase();
  const apiKey = process.env.LLM_API_KEY?.trim();
  const isGoogleGemini = requested === "google-gemini";
  const baseUrl =
    process.env.LLM_BASE_URL?.trim() ||
    (isGoogleGemini ? GOOGLE_GEMINI_NATIVE_BASE_URL : undefined);
  const model =
    process.env.LLM_MODEL?.trim() ||
    (isGoogleGemini ? GOOGLE_GEMINI_TEXT_MODEL : undefined);

  if (
    (requested === "openai" ||
      requested === "openai-compatible" ||
      isGoogleGemini) &&
    apiKey &&
    baseUrl &&
    model
  ) {
    try {
      return {
        provider: isGoogleGemini
          ? new GoogleGeminiLLMProvider({
              apiKey,
              baseUrl,
              model,
              timeoutMs: parseTimeout(process.env.LLM_TIMEOUT_MS),
            })
          : new OpenAICompatibleLLMProvider({
              apiKey,
              baseUrl,
              model,
              providerId: "openai-compatible",
              timeoutMs: parseTimeout(process.env.LLM_TIMEOUT_MS),
            }),
        configured: true,
      };
    } catch {
      // Invalid server configuration degrades to the deterministic provider.
    }
  }

  return { provider: new MockLLMProvider(), configured: false };
}

async function runWithFallback<T>(
  operation: (provider: LLMProvider) => Promise<T>,
  runtimeConfig?: RuntimeLLMConfig,
): Promise<LLMRunResult<T>> {
  const selected = getLLMProvider(runtimeConfig);

  if (selected.provider.kind === "mock") {
    return {
      data: await operation(selected.provider),
      source: "mock",
      fallback: true,
    };
  }

  try {
    return {
      data: await operation(selected.provider),
      source: "provider",
    };
  } catch (error) {
    const mock = new MockLLMProvider();
    return {
      data: await operation(mock),
      source: "mock",
      fallback: true,
      providerError: toSafeProviderError(error),
    };
  }
}

export async function testLLMConnection(
  runtimeConfig: RuntimeLLMConfig,
): Promise<{ provider: string; model: string }> {
  const selected = getLLMProvider(runtimeConfig);
  if (selected.provider.kind === "mock") {
    throw new Error("A runtime provider is required for this connection test.");
  }
  await selected.provider.testConnection();
  return { provider: selected.provider.id, model: runtimeConfig.model };
}

export function generateScenario(
  input: ScenarioGenerationInput,
  runtimeConfig?: RuntimeLLMConfig,
): Promise<LLMRunResult<GeneratedScenario>> {
  return runWithFallback(
    (provider) => provider.generateScenario(input),
    runtimeConfig,
  );
}

export function evaluateFeedback(
  input: FeedbackInput,
  runtimeConfig?: RuntimeLLMConfig,
): Promise<LLMRunResult<FeedbackResult>> {
  return runWithFallback(
    (provider) => provider.evaluateFeedback(input),
    runtimeConfig,
  );
}

export function continueRoleplay(
  input: RoleplayInput,
  runtimeConfig?: RuntimeLLMConfig,
): Promise<LLMRunResult<RoleplayResult>> {
  return runWithFallback(
    (provider) => provider.continueRoleplay(input),
    runtimeConfig,
  );
}

export function getLLMProviderStatus(): {
  source: "mock" | "provider";
  configured: boolean;
} {
  const selected = getLLMProvider();
  return { source: selected.provider.kind, configured: selected.configured };
}
