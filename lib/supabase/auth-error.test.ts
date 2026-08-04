import { describe, expect, it } from "vitest";

import { authErrorMessage } from "@/lib/supabase/auth-error";

describe("authErrorMessage", () => {
  it("distinguishes the project-wide email quota from a short request throttle", () => {
    expect(
      authErrorMessage({
        code: "over_email_send_rate_limit",
        message: "Email rate limit exceeded",
      }),
    ).toContain("Bir saate kadar");
  });

  it("keeps the short wait guidance for client request throttling", () => {
    expect(
      authErrorMessage({
        code: "over_request_rate_limit",
        message: "Request rate limit exceeded",
      }),
    ).toContain("Birkaç dakika");
  });

  it("supports legacy message-only errors without claiming a specific reset time", () => {
    expect(authErrorMessage(new Error("Rate limit exceeded"))).toBe(
      "Geçici istek sınırına ulaşıldı. Bir süre bekleyip tekrar dene.",
    );
  });
});
