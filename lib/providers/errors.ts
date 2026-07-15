export type ProviderErrorCode =
  | "INVALID_API_KEY"
  | "PERMISSION_DENIED"
  | "REGION_OR_BILLING_REQUIRED"
  | "QUOTA_EXCEEDED"
  | "MODEL_NOT_AVAILABLE"
  | "INVALID_PROVIDER_REQUEST"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_NETWORK_ERROR"
  | "INVALID_PROVIDER_RESPONSE"
  | "PROVIDER_UNAVAILABLE"
  | "UNKNOWN_PROVIDER_ERROR";

export type SafeProviderError = {
  code: ProviderErrorCode;
  message: string;
  status?: number;
  retryable: boolean;
};

const SAFE_MESSAGES: Record<ProviderErrorCode, string> = {
  INVALID_API_KEY: "The API key was rejected by the provider.",
  PERMISSION_DENIED:
    "The API key does not have permission to use this provider or has been blocked.",
  REGION_OR_BILLING_REQUIRED:
    "This account or region requires billing before the provider can be used.",
  QUOTA_EXCEEDED: "The provider quota or rate limit has been reached.",
  MODEL_NOT_AVAILABLE:
    "The selected model is unavailable for this key or API version.",
  INVALID_PROVIDER_REQUEST:
    "The provider rejected the request format or configuration.",
  PROVIDER_TIMEOUT: "The provider did not respond before the request timed out.",
  PROVIDER_NETWORK_ERROR: "The provider could not be reached from the server.",
  INVALID_PROVIDER_RESPONSE:
    "The provider responded, but the payload could not be validated.",
  PROVIDER_UNAVAILABLE: "The provider is temporarily unavailable.",
  UNKNOWN_PROVIDER_ERROR: "The provider request failed for an unknown reason.",
};

export class ProviderRequestError extends Error {
  constructor(readonly diagnostic: SafeProviderError) {
    super(diagnostic.message);
    this.name = "ProviderRequestError";
  }
}

function upstreamStatusName(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const error = Reflect.get(payload, "error");
  if (!error || typeof error !== "object") return undefined;
  const status = Reflect.get(error, "status");
  return typeof status === "string" ? status : undefined;
}

export function providerHttpError(
  status: number,
  payload?: unknown,
): ProviderRequestError {
  const upstreamStatus = upstreamStatusName(payload);
  let code: ProviderErrorCode;

  if (status === 401) code = "INVALID_API_KEY";
  else if (status === 403) code = "PERMISSION_DENIED";
  else if (status === 404) code = "MODEL_NOT_AVAILABLE";
  else if (status === 429) code = "QUOTA_EXCEEDED";
  else if (status === 408 || status === 504) code = "PROVIDER_TIMEOUT";
  else if (status === 400 && upstreamStatus === "FAILED_PRECONDITION") {
    code = "REGION_OR_BILLING_REQUIRED";
  } else if (status === 400 || status === 422) {
    code = "INVALID_PROVIDER_REQUEST";
  } else if (status >= 500) code = "PROVIDER_UNAVAILABLE";
  else code = "UNKNOWN_PROVIDER_ERROR";

  return new ProviderRequestError({
    code,
    message: SAFE_MESSAGES[code],
    status,
    retryable:
      code === "QUOTA_EXCEEDED" ||
      code === "PROVIDER_TIMEOUT" ||
      code === "PROVIDER_UNAVAILABLE",
  });
}

export function invalidProviderResponse(): ProviderRequestError {
  return new ProviderRequestError({
    code: "INVALID_PROVIDER_RESPONSE",
    message: SAFE_MESSAGES.INVALID_PROVIDER_RESPONSE,
    retryable: false,
  });
}

export function toSafeProviderError(error: unknown): SafeProviderError {
  if (error instanceof ProviderRequestError) return error.diagnostic;

  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return {
        code: "PROVIDER_TIMEOUT",
        message: SAFE_MESSAGES.PROVIDER_TIMEOUT,
        retryable: true,
      };
    }
    if (error instanceof TypeError) {
      return {
        code: "PROVIDER_NETWORK_ERROR",
        message: SAFE_MESSAGES.PROVIDER_NETWORK_ERROR,
        retryable: true,
      };
    }
  }

  return {
    code: "UNKNOWN_PROVIDER_ERROR",
    message: SAFE_MESSAGES.UNKNOWN_PROVIDER_ERROR,
    retryable: false,
  };
}

export function providerErrorHttpStatus(error: SafeProviderError): number {
  if (error.status && error.status >= 400 && error.status <= 599) {
    return error.status;
  }
  return error.code === "PROVIDER_TIMEOUT" ? 504 : 502;
}
