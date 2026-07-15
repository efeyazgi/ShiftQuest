import { NextResponse } from "next/server";
import { z } from "zod";

import type { SafeProviderError } from "@/lib/providers/errors";

export type ApiSource = "mock" | "provider";

export type ApiSuccess<T> = {
  data: T;
  source: ApiSource;
  fallback?: boolean;
  providerError?: SafeProviderError;
};

export type ApiFailure = {
  error: {
    code: string;
    message: string;
  };
};

export function jsonSuccess<T>(
  data: T,
  source: ApiSource,
  options: {
    fallback?: boolean;
    providerError?: SafeProviderError;
    status?: number;
  } = {},
): NextResponse<ApiSuccess<T>> {
  const payload: ApiSuccess<T> = { data, source };
  if (options.fallback) payload.fallback = true;
  if (options.providerError) payload.providerError = options.providerError;

  return NextResponse.json(payload, {
    status: options.status ?? 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
): NextResponse<ApiFailure> {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function parseJsonRequest<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
  maximumBytes = 32_000,
): Promise<
  | { success: true; data: z.output<TSchema> }
  | { success: false; response: NextResponse<ApiFailure> }
> {
  const contentType = request.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    return {
      success: false,
      response: jsonError(
        "UNSUPPORTED_MEDIA_TYPE",
        "Send the request body as application/json.",
        415,
      ),
    };
  }

  const declaredLength = Number.parseInt(
    request.headers.get("content-length") ?? "0",
    10,
  );
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    return {
      success: false,
      response: jsonError("PAYLOAD_TOO_LARGE", "The request body is too large.", 413),
    };
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maximumBytes) {
      return {
        success: false,
        response: jsonError("PAYLOAD_TOO_LARGE", "The request body is too large.", 413),
      };
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return {
      success: false,
      response: jsonError("INVALID_JSON", "The request body is not valid JSON."),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: jsonError(
        "INVALID_INPUT",
        "Check the request fields and try again.",
      ),
    };
  }

  return { success: true, data: parsed.data };
}
