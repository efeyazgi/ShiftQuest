import { z } from "zod";

import { jsonError, jsonSuccess, parseJsonRequest } from "@/lib/api/http";
import {
  scenarioCategorySchema,
  scenarioGenerationInputSchema,
} from "@/lib/providers/llm";
import { generateScenario } from "@/lib/providers/llm/server";
import { runtimeLLMConfigSchema } from "@/lib/providers/runtime-config";
import {
  assertRuntimeProviderRequestAllowed,
  RuntimeProviderConfigError,
} from "@/lib/providers/runtime-config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scenarioQuerySchema = z.object({
  level: z.enum(["B1", "B2"]).default("B1"),
  category: scenarioCategorySchema.optional(),
  weakVocabulary: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
});

const scenarioPostSchema = scenarioGenerationInputSchema
  .extend({ providerConfig: runtimeLLMConfigSchema.optional() })
  .strict();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = scenarioQuerySchema.safeParse({
    level: url.searchParams.get("level") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    weakVocabulary: url.searchParams
      .getAll("weakVocabulary")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean),
  });

  if (!parsed.success) {
    return jsonError("INVALID_INPUT", "Check the scenario query and try again.");
  }

  try {
    const result = await generateScenario(parsed.data);
    return jsonSuccess(result.data, result.source, {
      fallback: result.fallback,
      providerError: result.providerError,
    });
  } catch {
    return jsonError(
      "SCENARIO_UNAVAILABLE",
      "A scenario could not be prepared right now.",
      503,
    );
  }
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, scenarioPostSchema);
  if (!parsed.success) return parsed.response;

  const { providerConfig, ...input } = parsed.data;
  if (providerConfig) {
    try {
      assertRuntimeProviderRequestAllowed(request, providerConfig);
    } catch (error) {
      if (error instanceof RuntimeProviderConfigError) {
        return jsonError(error.code, error.safeMessage, error.status);
      }
      return jsonError("INVALID_PROVIDER_CONFIG", "Provider settings are invalid.");
    }
  }

  try {
    const result = await generateScenario(input, providerConfig);
    return jsonSuccess(result.data, result.source, {
      fallback: result.fallback,
      providerError: result.providerError,
    });
  } catch {
    return jsonError(
      "SCENARIO_UNAVAILABLE",
      "A scenario could not be prepared right now.",
      503,
    );
  }
}
