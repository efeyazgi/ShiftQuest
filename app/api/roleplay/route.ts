import { jsonError, jsonSuccess, parseJsonRequest } from "@/lib/api/http";
import { roleplayInputSchema } from "@/lib/providers/llm";
import {
  continueRoleplay,
  getLLMProviderStatus,
} from "@/lib/providers/llm/server";
import { runtimeLLMConfigSchema } from "@/lib/providers/runtime-config";
import {
  assertRuntimeProviderRequestAllowed,
  RuntimeProviderConfigError,
} from "@/lib/providers/runtime-config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleplayPostSchema = roleplayInputSchema
  .extend({ providerConfig: runtimeLLMConfigSchema.optional() })
  .strict();

export async function GET() {
  const status = getLLMProviderStatus();
  return jsonSuccess(
    { configured: status.configured, roleplay: true },
    status.source,
    { fallback: !status.configured },
  );
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, roleplayPostSchema);
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
    const result = await continueRoleplay(input, providerConfig);
    return jsonSuccess(result.data, result.source, {
      fallback: result.fallback,
      providerError: result.providerError,
    });
  } catch {
    return jsonError(
      "ROLEPLAY_UNAVAILABLE",
      "The roleplay cannot continue right now.",
      503,
    );
  }
}
