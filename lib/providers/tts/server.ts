import "server-only";

import {
  GOOGLE_GEMINI_NATIVE_BASE_URL,
  GOOGLE_GEMINI_TTS_MODEL,
  GOOGLE_GEMINI_TTS_VOICE,
} from "../google-gemini";
import type { RuntimeTTSConfig } from "../runtime-config";
import {
  assertRuntimeProviderOriginAllowed,
  getRuntimeProviderCacheNamespace,
} from "../runtime-config.server";
import { BrowserFallbackTTSProvider } from "./browser-fallback";
import { createTTSCacheKey, MemoryTTSCache } from "./cache";
import type { TTSProvider, TTSRequest, TTSRunResult } from "./contracts";
import { GoogleGeminiTTSProvider } from "./google-gemini";
import { OpenAICompatibleTTSProvider } from "./openai-compatible";

type ProviderSelection = {
  provider: TTSProvider;
  configured: boolean;
  cacheNamespace?: string;
};

function numericEnvironmentValue(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed)
    ? Math.max(minimum, Math.min(maximum, parsed))
    : fallback;
}

const ttsCache = new MemoryTTSCache(
  numericEnvironmentValue(process.env.TTS_CACHE_MAX_ITEMS, 128, 8, 1_000),
  numericEnvironmentValue(
    process.env.TTS_CACHE_TTL_SECONDS,
    86_400,
    60,
    7 * 86_400,
  ) * 1_000,
);

export function getTTSProvider(
  runtimeConfig?: RuntimeTTSConfig,
): ProviderSelection {
  if (runtimeConfig) {
    assertRuntimeProviderOriginAllowed(runtimeConfig);
    const timeoutMs = numericEnvironmentValue(
      process.env.TTS_TIMEOUT_MS,
      20_000,
      2_000,
      60_000,
    );
    const voices = {
      "en-US": runtimeConfig.voice,
      "en-GB": runtimeConfig.voice,
      "tr-TR": runtimeConfig.voice,
    };
    return {
      provider:
        runtimeConfig.provider === "google-gemini"
          ? new GoogleGeminiTTSProvider({
              apiKey: runtimeConfig.apiKey,
              baseUrl: runtimeConfig.baseUrl,
              model: runtimeConfig.model,
              voices,
              timeoutMs,
            })
          : new OpenAICompatibleTTSProvider({
              apiKey: runtimeConfig.apiKey,
              baseUrl: runtimeConfig.baseUrl,
              model: runtimeConfig.model,
              voices,
              timeoutMs,
            }),
      configured: true,
      cacheNamespace: getRuntimeProviderCacheNamespace(runtimeConfig),
    };
  }

  const requested = (process.env.TTS_PROVIDER ?? "browser").trim().toLowerCase();
  const apiKey = process.env.TTS_API_KEY?.trim();
  const isGoogleGemini = requested === "google-gemini";
  const baseUrl =
    process.env.TTS_BASE_URL?.trim() ||
    (isGoogleGemini ? GOOGLE_GEMINI_NATIVE_BASE_URL : undefined);
  const model =
    process.env.TTS_MODEL?.trim() ||
    (isGoogleGemini ? GOOGLE_GEMINI_TTS_MODEL : undefined);

  if (
    (requested === "openai" ||
      requested === "openai-compatible" ||
      isGoogleGemini) &&
    apiKey &&
    baseUrl &&
    model
  ) {
    try {
      const englishVoice =
        process.env.TTS_ENGLISH_VOICE?.trim() ||
        (isGoogleGemini ? GOOGLE_GEMINI_TTS_VOICE : "alloy");
      const voices = {
        "en-US": process.env.TTS_AMERICAN_VOICE?.trim() || englishVoice,
        "en-GB": process.env.TTS_BRITISH_VOICE?.trim() || englishVoice,
        "tr-TR": process.env.TTS_TURKISH_VOICE?.trim() || englishVoice,
      };
      const timeoutMs = numericEnvironmentValue(
        process.env.TTS_TIMEOUT_MS,
        20_000,
        2_000,
        60_000,
      );
      return {
        provider: isGoogleGemini
          ? new GoogleGeminiTTSProvider({
              apiKey,
              baseUrl,
              model,
              voices,
              timeoutMs,
            })
          : new OpenAICompatibleTTSProvider({
              apiKey,
              baseUrl,
              model,
              voices,
              timeoutMs,
            }),
        configured: true,
      };
    } catch {
      // Invalid server configuration degrades to browser metadata.
    }
  }

  return { provider: new BrowserFallbackTTSProvider(), configured: false };
}

export async function synthesizeSpeech(
  input: TTSRequest,
  runtimeConfig?: RuntimeTTSConfig,
): Promise<TTSRunResult> {
  const selected = getTTSProvider(runtimeConfig);
  if (selected.provider.kind === "mock") {
    return {
      data: await selected.provider.synthesize(input),
      source: "mock",
      fallback: true,
      cache: "bypass",
    };
  }

  const cacheKey = createTTSCacheKey(
    selected.cacheNamespace ?? selected.provider.id,
    input,
  );
  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return { data: cached, source: "provider", cache: "hit" };
  }

  try {
    const result = await selected.provider.synthesize(input);
    if (result.mode === "audio") ttsCache.set(cacheKey, result);
    return { data: result, source: "provider", cache: "miss" };
  } catch {
    const fallback = new BrowserFallbackTTSProvider();
    return {
      data: await fallback.synthesize(input),
      source: "mock",
      fallback: true,
      cache: "bypass",
    };
  }
}

export function getTTSProviderStatus(): {
  source: "mock" | "provider";
  configured: boolean;
  browserFallback: true;
} {
  const selected = getTTSProvider();
  return {
    source: selected.provider.kind,
    configured: selected.configured,
    browserFallback: true,
  };
}
