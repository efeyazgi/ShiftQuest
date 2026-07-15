import { z } from "zod";

import { jsonError, jsonSuccess, parseJsonRequest } from "@/lib/api/http";
import {
  providerErrorHttpStatus,
  toSafeProviderError,
} from "@/lib/providers/errors";
import { testLLMConnection } from "@/lib/providers/llm/server";
import { runtimeLLMConfigSchema } from "@/lib/providers/runtime-config";
import {
  assertRuntimeProviderRequestAllowed,
  RuntimeProviderConfigError,
} from "@/lib/providers/runtime-config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const providerTestSchema = z
  .object({
    kind: z.literal("llm"),
    providerConfig: runtimeLLMConfigSchema,
  })
  .strict();

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, providerTestSchema, 8_000);
  if (!parsed.success) return parsed.response;

  try {
    assertRuntimeProviderRequestAllowed(request, parsed.data.providerConfig);
  } catch (error) {
    if (error instanceof RuntimeProviderConfigError) {
      return jsonError(error.code, error.safeMessage, error.status);
    }
    return jsonError("INVALID_PROVIDER_CONFIG", "Provider settings are invalid.");
  }

  try {
    const result = await testLLMConnection(parsed.data.providerConfig);
    return jsonSuccess(
      { configured: true, provider: result.provider, model: result.model },
      "provider",
    );
  } catch (error) {
    const diagnostic = toSafeProviderError(error);
    return jsonError(
      diagnostic.code,
      diagnostic.message,
      providerErrorHttpStatus(diagnostic),
    );
  }
}
