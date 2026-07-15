import { z } from "zod";

const API_KEY_MAX_LENGTH = 2_048;
const BASE_URL_MAX_LENGTH = 2_048;

function isIpLiteral(hostname: string): boolean {
  const unwrapped = hostname.replace(/^\[|\]$/g, "");
  if (unwrapped.includes(":")) return true;

  const parts = unwrapped.split(".");
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  );
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized === "localhost.localdomain" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".home") ||
    isIpLiteral(normalized)
  );
}

const runtimeBaseUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(BASE_URL_MAX_LENGTH)
  .superRefine((value, context) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provider base URL is invalid.",
      });
      return;
    }

    if (parsed.protocol !== "https:") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provider base URL must use HTTPS.",
      });
    }
    if (parsed.username || parsed.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provider base URL must not contain credentials.",
      });
    }
    if (parsed.search || parsed.hash) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provider base URL must not contain a query or fragment.",
      });
    }
    if (isPrivateHostname(parsed.hostname)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Private and local provider hosts are not allowed.",
      });
    }
  });

const runtimeApiKeySchema = z
  .string()
  .min(1)
  .max(API_KEY_MAX_LENGTH)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), {
    message: "API key contains invalid control characters.",
  })
  .refine((value) => value === value.trim(), {
    message: "API key must not start or end with whitespace.",
  });

const providerValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9._:/-]+$/, "Provider value contains invalid characters.");

export const runtimeLLMConfigSchema = z
  .object({
    provider: z.enum(["openai-compatible", "google-gemini"]),
    apiKey: runtimeApiKeySchema,
    baseUrl: runtimeBaseUrlSchema,
    model: providerValueSchema,
  })
  .strict();

export const runtimeTTSConfigSchema = z
  .object({
    provider: z.enum(["openai-compatible", "google-gemini"]),
    apiKey: runtimeApiKeySchema,
    baseUrl: runtimeBaseUrlSchema,
    model: providerValueSchema,
    voice: providerValueSchema,
  })
  .strict();

export type RuntimeLLMConfig = z.infer<typeof runtimeLLMConfigSchema>;
export type RuntimeTTSConfig = z.infer<typeof runtimeTTSConfigSchema>;

export function getRuntimeProviderOrigin(
  config: RuntimeLLMConfig | RuntimeTTSConfig,
): string {
  return new URL(config.baseUrl).origin;
}
