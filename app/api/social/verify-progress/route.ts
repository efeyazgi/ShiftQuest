import { z } from "zod";

import { jsonError, parseJsonRequest } from "@/lib/api/http";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyScenarioSubmission } from "@/lib/social/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const verificationRequestSchema = z.object({
  scenarioId: z.string().trim().min(1).max(120),
  attempts: z.array(z.object({
    stepId: z.string().trim().min(1).max(120),
    answer: z.union([
      z.string().max(1_000),
      z.array(z.string().max(500)).max(20),
    ]),
  }).passthrough()).min(1).max(40),
}).strict();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return jsonError("ORIGIN_FORBIDDEN", "Cross-origin verification is not allowed.", 403);
  }

  const parsed = await parseJsonRequest(request, verificationRequestSchema, 64_000);
  if (!parsed.success) return parsed.response;
  if (!isSupabaseAdminConfigured) {
    return jsonError(
      "VERIFICATION_NOT_CONFIGURED",
      "Verified social progress is not configured on this server.",
      503,
    );
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) {
    return jsonError("AUTH_REQUIRED", "Sign in before verifying progress.", 401);
  }

  const verified = verifyScenarioSubmission(parsed.data.scenarioId, parsed.data.attempts);
  if (!verified) {
    return jsonError(
      "UNVERIFIABLE_COMPLETION",
      "The submitted attempt set does not match the canonical scenario.",
    );
  }

  const { error } = await createAdminClient().rpc("record_verified_completion", {
    completion_user_id: data.user.id,
    completion_scenario_id: verified.scenarioId,
    completion_category: verified.category,
    completion_accuracy: verified.accuracy,
    completion_verified_xp: verified.verifiedXp,
    completion_is_boss: verified.isBoss,
    completion_roleplay_completed: verified.roleplayCompleted,
  });
  if (error) {
    return jsonError(
      "VERIFICATION_WRITE_FAILED",
      "Verified progress could not be recorded.",
      503,
    );
  }

  return Response.json(
    { data: verified },
    { headers: { "Cache-Control": "no-store" } },
  );
}
