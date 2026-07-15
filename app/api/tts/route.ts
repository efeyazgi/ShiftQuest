import { jsonError, jsonSuccess, parseJsonRequest } from "@/lib/api/http";
import { ttsRequestSchema } from "@/lib/providers/tts";
import {
  getTTSProviderStatus,
  synthesizeSpeech,
} from "@/lib/providers/tts/server";
import { runtimeTTSConfigSchema } from "@/lib/providers/runtime-config";
import {
  assertRuntimeProviderRequestAllowed,
  RuntimeProviderConfigError,
} from "@/lib/providers/runtime-config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ttsPostSchema = ttsRequestSchema
  .extend({ providerConfig: runtimeTTSConfigSchema.optional() })
  .strict();

export async function GET() {
  const status = getTTSProviderStatus();
  return jsonSuccess(
    {
      configured: status.configured,
      browserFallback: status.browserFallback,
      languages: ["en-US", "en-GB", "tr-TR"] as const,
      speeds: [0.75, 1, 1.25] as const,
    },
    status.source,
    { fallback: !status.configured },
  );
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, ttsPostSchema, 12_000);
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
    const result = await synthesizeSpeech(input, providerConfig);
    if (result.data.mode === "audio") {
      return new Response(result.data.audio, {
        status: 200,
        headers: {
          "Content-Type": result.data.mimeType,
          "Content-Length": String(result.data.audio.byteLength),
          "Cache-Control": "private, max-age=3600",
          "X-ShiftQuest-Source": "provider",
          "X-ShiftQuest-TTS-Cache": result.cache,
        },
      });
    }

    return jsonSuccess(result.data, "mock", { fallback: true });
  } catch {
    return jsonError(
      "TTS_UNAVAILABLE",
      "Narration is unavailable. Try the browser voice fallback.",
      503,
    );
  }
}
