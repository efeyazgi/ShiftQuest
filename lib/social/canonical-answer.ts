import type { ScenarioStep } from "@/types";

const normalize = (value: string) =>
  value.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();

function answerText(answer: string | string[]): string {
  return Array.isArray(answer) ? answer.join(" ") : answer;
}
export function isCanonicalAnswerCorrect(
  step: ScenarioStep,
  answer: string | string[],
): boolean {
  switch (step.type) {
    case "dialogue-choice":
    case "fill-blank":
    case "listening":
    case "tone-check":
    case "quick-response":
      return typeof answer === "string" && answer === step.correctOptionId;
    case "sentence-builder": {
      const submitted = normalize(answerText(answer));
      return [step.correctOrder.join(" "), ...step.acceptedAnswers]
        .map(normalize)
        .includes(submitted);
    }
    case "matching":
      return Array.isArray(answer)
        && answer.length === step.pairs.length
        && step.pairs.every((pair, index) => answer[index] === pair.right);
    case "word-puzzle":
      return [step.answer, ...step.acceptedAnswers]
        .map(normalize)
        .includes(normalize(answerText(answer)));
    case "roleplay":
      return typeof answer === "string"
        && answer.trim().split(/\s+/).filter(Boolean).length >= step.minimumWords;
    case "boss-battle": {
      if (!Array.isArray(answer) || answer.length !== step.phases.length) return false;
      const correctPhases = step.phases.filter((phase, index) => {
        const submitted = answer[index] ?? "";
        if (phase.options?.length) {
          return phase.options.some((option) => option.isCorrect && option.text === submitted);
        }
        const normalizedSubmitted = normalize(submitted);
        const normalizedExpected = normalize(phase.expectedAnswer);
        return normalizedSubmitted.length > 0
          && normalizedSubmitted.includes(normalizedExpected);
      }).length;
      return correctPhases >= step.minimumPhasesToPass;
    }
  }
}
