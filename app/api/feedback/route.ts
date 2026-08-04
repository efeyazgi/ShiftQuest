import { jsonError, jsonSuccess, parseJsonRequest } from "@/lib/api/http";
import { roleplayEvaluationRequestSchema } from "@/lib/providers/llm";
import {
  evaluateRoleplay,
  getLLMProviderStatus,
} from "@/lib/providers/llm/server";
import { runtimeLLMConfigSchema } from "@/lib/providers/runtime-config";
import {
  assertRuntimeProviderRequestAllowed,
  RuntimeProviderConfigError,
} from "@/lib/providers/runtime-config.server";
import { getScenarioById } from "@/data/scenarios";
import { getVocabularyById } from "@/data/vocabulary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const feedbackPostSchema = roleplayEvaluationRequestSchema
  .extend({ providerConfig: runtimeLLMConfigSchema.optional() })
  .strict();

export async function GET() {
  const status = getLLMProviderStatus();
  return jsonSuccess(
    { configured: status.configured, feedback: true },
    status.source,
    { fallback: !status.configured },
  );
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, feedbackPostSchema);
  if (!parsed.success) return parsed.response;

  const { providerConfig, scenarioId, stepId, message } = parsed.data;
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

  const scenario = getScenarioById(scenarioId);
  const step = scenario?.steps.find((item) => item.id === stepId);
  if (!scenario || !step || step.type !== "roleplay") {
    return jsonError(
      "ROLEPLAY_NOT_FOUND",
      "The requested roleplay task could not be found.",
      404,
    );
  }

  const targetVocabulary = step.targetVocabularyIds.flatMap((id) => {
    const item = getVocabularyById(id);
    return item
      ? [{
          id: item.id,
          term: item.term,
          acceptedForms: item.acceptedForms ?? [],
        }]
      : [];
  });

  const input = {
    scenarioId: scenario.id,
    stepId: step.id,
    message,
    level: scenario.level,
    role: step.characterRole,
    openingLine: step.openingLine,
    userGoal: step.userGoal,
    minimumWords: step.minimumWords,
    maximumWords: step.maximumWords,
    successCriteria: step.successCriteria,
    targetVocabulary,
    sampleAnswer: step.sampleAnswer,
  };

  try {
    const result = await evaluateRoleplay(input, providerConfig);
    return jsonSuccess(result.data, result.source, {
      fallback: result.fallback,
      providerError: result.providerError,
    });
  } catch {
    return jsonError(
      "FEEDBACK_UNAVAILABLE",
      "Feedback could not be prepared right now.",
      503,
    );
  }
}
