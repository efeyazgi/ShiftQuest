import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { GOOGLE_GEMINI_ORIGIN } from "./google-gemini";
import {
  getRuntimeProviderOrigin,
  runtimeLLMConfigSchema,
  runtimeTTSConfigSchema,
  type RuntimeLLMConfig,
  type RuntimeTTSConfig,
} from "./runtime-config";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://api.openai.com",
  GOOGLE_GEMINI_ORIGIN,
] as const;
const runtimeCacheSalt = randomBytes(32);

export class RuntimeProviderConfigError extends Error {
  constructor(
    readonly code: string,
    readonly safeMessage: string,
    readonly status: 400 | 403 = 400,
  ) {
    super(safeMessage);
    this.name = "RuntimeProviderConfigError";
  }
}

function parseAllowedOrigin(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getAllowedRuntimeProviderOrigins(): ReadonlySet<string> {
  const origins = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  const additional = process.env.RUNTIME_PROVIDER_ALLOWED_ORIGINS ?? "";
  for (const candidate of additional.split(",")) {
    if (!candidate.trim()) continue;
    const origin = parseAllowedOrigin(candidate);
    if (origin) origins.add(origin);
  }
  return origins;
}

export function assertRuntimeProviderOriginAllowed(
  config: RuntimeLLMConfig | RuntimeTTSConfig,
): void {
  const validated =
    "voice" in config
      ? runtimeTTSConfigSchema.safeParse(config)
      : runtimeLLMConfigSchema.safeParse(config);
  if (!validated.success) {
    throw new RuntimeProviderConfigError(
      "INVALID_PROVIDER_CONFIG",
      "Provider settings are invalid.",
    );
  }
  const origin = getRuntimeProviderOrigin(config);
  if (
    config.provider === "google-gemini" &&
    origin !== GOOGLE_GEMINI_ORIGIN
  ) {
    throw new RuntimeProviderConfigError(
      "PROVIDER_ORIGIN_NOT_ALLOWED",
      "Google Gemini credentials can only be sent to the Google Gemini API.",
    );
  }
  if (!getAllowedRuntimeProviderOrigins().has(origin)) {
    throw new RuntimeProviderConfigError(
      "PROVIDER_ORIGIN_NOT_ALLOWED",
      "This provider URL is not allowed by the server.",
    );
  }
}

export function assertSameOriginRuntimeCredentialRequest(request: Request): void {
  const suppliedOrigin = request.headers.get("origin");
  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(request.url).origin;
  } catch {
    throw new RuntimeProviderConfigError(
      "RUNTIME_CONFIG_ORIGIN_REJECTED",
      "Runtime provider credentials require a same-origin request.",
      403,
    );
  }

  if (!suppliedOrigin) {
    throw new RuntimeProviderConfigError(
      "RUNTIME_CONFIG_ORIGIN_REJECTED",
      "Runtime provider credentials require a same-origin request.",
      403,
    );
  }

  let normalizedOrigin: string;
  try {
    normalizedOrigin = new URL(suppliedOrigin).origin;
  } catch {
    normalizedOrigin = "invalid";
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    normalizedOrigin !== expectedOrigin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    throw new RuntimeProviderConfigError(
      "RUNTIME_CONFIG_ORIGIN_REJECTED",
      "Runtime provider credentials require a same-origin request.",
      403,
    );
  }
}

export function assertRuntimeProviderRequestAllowed(
  request: Request,
  config: RuntimeLLMConfig | RuntimeTTSConfig,
): void {
  assertSameOriginRuntimeCredentialRequest(request);
  assertRuntimeProviderOriginAllowed(config);
}

export function getRuntimeProviderCacheNamespace(
  config: RuntimeLLMConfig | RuntimeTTSConfig,
): string {
  return createHmac("sha256", runtimeCacheSalt)
    .update(
      JSON.stringify({
        provider: config.provider,
        apiKey: config.apiKey,
        baseUrl: new URL(config.baseUrl).href,
        model: config.model,
        voice: "voice" in config ? config.voice : null,
      }),
    )
    .digest("hex");
}
