import { jsonError, jsonSuccess, parseJsonRequest } from "@/lib/api/http";
import { feedbackInputSchema } from "@/lib/providers/llm";
import {
  evaluateFeedback,
  getLLMProviderStatus,
} from "@/lib/providers/llm/server";
import { runtimeLLMConfigSchema } from "@/lib/providers/runtime-config";
import {
  assertRuntimeProviderRequestAllowed,
  RuntimeProviderConfigError,
} from "@/lib/providers/runtime-config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const feedbackPostSchema = feedbackInputSchema
  .extend({ providerConfig: runtimeLLMConfigSchema.optional() })
  .strict();

export async function GET() {
  const status = getLLMProviderStatus();
  return jsonSuccess(
    { configured: status.configured, feedback: true },
    status.source,
    { fallback: !status.configured },
  );
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, feedbackPostSchema);
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
    const result = await evaluateFeedback(input, providerConfig);
    return jsonSuccess(result.data, result.source, {
      fallback: result.fallback,
      providerError: result.providerError,
    });
  } catch {
    return jsonError(
      "FEEDBACK_UNAVAILABLE",
      "Feedback could not be prepared right now.",
      503,
    );
  }
}
