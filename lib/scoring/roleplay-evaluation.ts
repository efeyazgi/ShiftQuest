import type {
  LearningErrorType,
  RoleplayCriterion,
  RoleplayEvaluation,
  RoleplayEvaluationContext,
  RoleplayEvaluationDraft,
  RoleplayImprovement,
  RoleplayVocabularyTarget,
} from "@/types";

const WORD_PATTERN = /[A-Za-zÀ-ž]+(?:['’-][A-Za-zÀ-ž]+)*/g;
const ACTION_PATTERN = /\b(?:am|is|are|was|were|be|been|have|has|had|can|could|would|will|should|need|plan|suggest|recommend|confirm|clarify|review|check|update|summarize|explain|address|resolve|coordinate|escalate|propose|consider|acknowledge|prioriti[sz]e|follow)\b/i;
const POLITE_PATTERN = /\b(?:please|could|would|thank|thanks|appreciate|suggest|recommend|perhaps|may|might|understand|acknowledge)\b/i;
const DECISION_PATTERN = /\b(?:could we|would you|recommend|request|confirm|clarify|decision|priority|review|propose|agree|align|escalat(?:e|ion))\b/i;
const GOAL_STOP_WORDS = new Set([
  "about", "after", "before", "being", "clearly", "communication", "explain", "professional",
  "reply", "request", "respond", "response", "state", "that", "their", "then", "this", "what",
  "while", "with", "without", "write", "your",
]);

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));

export function countRoleplayWords(message: string): number {
  return message.match(WORD_PATTERN)?.length ?? 0;
}

export function normalizeRoleplayText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[’‘`]/g, "'")
    .replace(/[‐‑‒–—-]/g, " ")
    .replace(/[^a-zà-ž0-9']+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function evidenceAppearsInMessage(message: string, evidence: string): boolean {
  const normalizedMessage = normalizeRoleplayText(message);
  const normalizedEvidence = normalizeRoleplayText(evidence);
  return Boolean(normalizedEvidence && normalizedMessage.includes(normalizedEvidence));
}

export type DetectedVocabulary = {
  target: RoleplayVocabularyTarget;
  matchedForm: string;
  evidenceQuote: string;
};

function findOriginalEvidence(message: string, form: string): string {
  const tokens = normalizeRoleplayText(form).split(" ").filter(Boolean);
  if (!tokens.length) return form;
  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`\\b${escaped.join("[\\s\\p{P}]+")}\\b`, "iu");
  return message.match(pattern)?.[0] ?? form;
}

export function detectTargetVocabulary(
  message: string,
  targets: readonly RoleplayVocabularyTarget[],
): DetectedVocabulary[] {
  const normalizedMessage = ` ${normalizeRoleplayText(message)} `;
  return targets.flatMap((target) => {
    const forms = [target.term, ...target.acceptedForms]
      .map((form) => form.trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length);
    const matchedForm = forms.find((form) => {
      const normalizedForm = normalizeRoleplayText(form);
      return normalizedForm && normalizedMessage.includes(` ${normalizedForm} `);
    });
    return matchedForm
      ? [{ target, matchedForm, evidenceQuote: findOriginalEvidence(message, matchedForm) }]
      : [];
  });
}

function criterionLooksLikeVocabulary(criterion: RoleplayCriterion): boolean {
  return /vocab|target expression|kelime/i.test(`${criterion.label} ${criterion.description}`);
}

function criterionLooksLikeGrammar(criterion: RoleplayCriterion): boolean {
  return /grammar|dilbilgisi/i.test(`${criterion.label} ${criterion.description}`);
}

function criterionLooksLikeTone(criterion: RoleplayCriterion): boolean {
  return /tone|professional|register|diplom/i.test(`${criterion.label} ${criterion.description}`);
}

function primaryErrorFor(
  criteria: RoleplayEvaluation["criteria"],
  goalAchieved: boolean,
  hasCorrectVocabulary: boolean,
  lengthStatus: RoleplayEvaluation["lengthStatus"],
): LearningErrorType | undefined {
  if (lengthStatus === "too-short" || !goalAchieved) return "communication";
  if (!hasCorrectVocabulary) return "vocabulary";
  const lowest = [...criteria].sort((left, right) => left.score - right.score)[0];
  if (!lowest || lowest.score >= 70) return undefined;
  if (/grammar/i.test(lowest.label)) return "grammar";
  if (/tone|professional|register/i.test(lowest.label)) return "tone";
  if (/vocab/i.test(lowest.label)) return "vocabulary";
  return "communication";
}

function uniqueImprovements(items: RoleplayImprovement[]): RoleplayImprovement[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.issueTr}|${item.suggestionEn}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function vocabularyStrengthIsGrounded(
  label: string,
  evidence: string,
  usedVocabulary: RoleplayEvaluation["usedTargetVocabulary"],
): boolean {
  const normalizedLabel = normalizeRoleplayText(label);
  const discussesVocabulary = /(?:\bvocabulary\b|\btarget\b|\bexpression\b|\bword\b|kelim|ifade|hedef)/i.test(label)
    || usedVocabulary.some((item) => normalizedLabel.includes(normalizeRoleplayText(item.term)));
  if (!discussesVocabulary) return true;
  const normalizedEvidence = normalizeRoleplayText(evidence);
  return usedVocabulary.some(
    (item) => item.usedCorrectly && normalizedEvidence.includes(normalizeRoleplayText(item.matchedForm)),
  );
}

export function finalizeRoleplayEvaluation(
  input: RoleplayEvaluationContext,
  draft: RoleplayEvaluationDraft,
): RoleplayEvaluation {
  const wordCount = countRoleplayWords(input.message);
  const lengthStatus = wordCount < input.minimumWords
    ? "too-short"
    : wordCount > input.maximumWords
      ? "too-long"
      : "within-range";
  const detectedVocabulary = detectTargetVocabulary(input.message, input.targetVocabulary);
  const detectedById = new Map(detectedVocabulary.map((item) => [item.target.id, item]));
  const draftVocabularyById = new Map(
    draft.targetVocabulary.map((item) => [item.vocabularyId, item]),
  );

  const usedTargetVocabulary = detectedVocabulary.map((detected) => {
    const assessed = draftVocabularyById.get(detected.target.id);
    const evidenceValid = assessed
      ? evidenceAppearsInMessage(input.message, assessed.evidenceQuote)
        && normalizeRoleplayText(assessed.evidenceQuote).includes(
          normalizeRoleplayText(detected.matchedForm),
        )
      : false;
    return {
      vocabularyId: detected.target.id,
      term: detected.target.term,
      matchedForm: detected.matchedForm,
      evidenceQuote: evidenceValid ? assessed!.evidenceQuote : detected.evidenceQuote,
      usedCorrectly: Boolean(assessed?.usedCorrectly && evidenceValid),
      feedbackTr: assessed?.feedbackTr || "Hedef ifade yanıtta tespit edildi.",
    };
  });
  const hasCorrectVocabulary = usedTargetVocabulary.some((item) => item.usedCorrectly);
  const missingTargetVocabulary = input.targetVocabulary
    .filter((target) => !detectedById.has(target.id))
    .map((target) => ({ vocabularyId: target.id, term: target.term }));

  const draftCriteriaById = new Map(draft.criteria.map((item) => [item.criterionId, item]));
  const criteria = input.successCriteria.map((criterion) => {
    const assessed = draftCriteriaById.get(criterion.id);
    const evidenceValid = assessed
      ? evidenceAppearsInMessage(input.message, assessed.evidenceQuote)
      : false;
    const vocabularyMissing = criterionLooksLikeVocabulary(criterion) && !hasCorrectVocabulary;
    const score = vocabularyMissing || !evidenceValid ? 0 : clampScore(assessed?.score ?? 0);
    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      score,
      met: Boolean(assessed?.met && evidenceValid && !vocabularyMissing && score >= 70),
      evidenceQuote: evidenceValid ? assessed!.evidenceQuote : "",
      feedbackTr: vocabularyMissing
        ? "Hedef ifadelerden en az birini bağlama uygun biçimde kullanmalısın."
        : assessed?.feedbackTr || "Bu ölçüt için yanıta dayalı yeterli kanıt bulunamadı.",
    };
  });

  const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0) || 1;
  const overallScore = Math.round(
    criteria.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight,
  );
  const goalEvidenceValid = evidenceAppearsInMessage(input.message, draft.goalEvidence);
  const goalAchieved = Boolean(draft.goalAchieved && goalEvidenceValid);
  const passed = lengthStatus !== "too-short"
    && goalAchieved
    && hasCorrectVocabulary
    && overallScore >= 70;

  const strengths = draft.strengths
    .filter((item) =>
      evidenceAppearsInMessage(input.message, item.evidenceQuote)
      && vocabularyStrengthIsGrounded(item.labelTr, item.evidenceQuote, usedTargetVocabulary),
    )
    .slice(0, 4);
  const deterministicImprovements: RoleplayImprovement[] = [];
  if (lengthStatus === "too-short") {
    deterministicImprovements.push({
      issueTr: `Yanıt ${input.minimumWords} kelimelik minimum uzunluğun altında.`,
      suggestionEn: input.sampleAnswer,
      reasonTr: "Görev amacını ve gerekçeyi değerlendirebilmek için daha tamamlanmış bir yanıt gerekiyor.",
    });
  }
  if (lengthStatus === "too-long") {
    deterministicImprovements.push({
      issueTr: `Yanıt önerilen ${input.maximumWords} kelimelik üst sınırı aşıyor.`,
      suggestionEn: input.sampleAnswer,
      reasonTr: "Ana mesajı koruyarak tekrarlanan ayrıntıları kısaltmak profesyonel iletişimi güçlendirir.",
    });
  }
  if (!detectedVocabulary.length) {
    deterministicImprovements.push({
      issueTr: "Yanıtta hedef ifadelerden hiçbiri kullanılmamış.",
      suggestionEn: input.targetVocabulary[0]?.acceptedForms[0]
        ?? input.targetVocabulary[0]?.term
        ?? input.sampleAnswer,
      reasonTr: "Bu adım hedef kelimeyi gerçek bir iş yeri bağlamında kullanmayı ölçüyor.",
    });
  } else if (!hasCorrectVocabulary) {
    deterministicImprovements.push({
      issueTr: "Bir hedef ifade tespit edildi ancak bağlam içinde doğru kullanım doğrulanamadı.",
      suggestionEn: input.sampleAnswer,
      reasonTr: "Hedef ifade görevin mesajına doğal ve anlamlı biçimde bağlanmalı.",
    });
  }
  if (!goalAchieved) {
    deterministicImprovements.push({
      issueTr: "Görevin temel iletişim amacı henüz açık biçimde karşılanmamış.",
      suggestionEn: input.sampleAnswer,
      reasonTr: input.userGoal,
    });
  }

  return {
    passed,
    overallScore,
    goalAchieved,
    goalEvidence: goalEvidenceValid ? draft.goalEvidence : "",
    wordCount,
    lengthStatus,
    criteria,
    usedTargetVocabulary,
    missingTargetVocabulary,
    strengths,
    improvements: uniqueImprovements([
      ...deterministicImprovements,
      ...draft.improvements,
    ]).slice(0, 6),
    polishedAnswer: draft.polishedAnswer.trim() || input.sampleAnswer,
    summaryTr: draft.summaryTr.trim() || (passed
      ? "Yanıt görev hedefini karşılıyor ve profesyonel iletişim ölçütlerinden geçti."
      : "Yanıt anlaşılır bir başlangıç; aşağıdaki noktaları geliştirerek görevi daha güçlü karşılayabilirsin."),
    primaryError: passed
      ? undefined
      : primaryErrorFor(criteria, goalAchieved, hasCorrectVocabulary, lengthStatus),
  };
}

function evidenceFrom(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= 400) return trimmed;
  const sentence = trimmed.match(/^.{1,397}?[.!?](?:\s|$)/)?.[0]?.trim();
  return sentence || trimmed.slice(0, 400).trim();
}

function countGoalSignals(input: RoleplayEvaluationContext): number {
  const messageTokens = new Set(normalizeRoleplayText(input.message).split(" ").filter(Boolean));
  const goalTokens = normalizeRoleplayText(`${input.userGoal} ${input.openingLine}`)
    .split(" ")
    .filter((token) => token.length >= 4 && !GOAL_STOP_WORDS.has(token));
  return new Set(goalTokens.filter((token) => messageTokens.has(token))).size;
}

export function buildDeterministicRoleplayDraft(
  input: RoleplayEvaluationContext,
): RoleplayEvaluationDraft {
  const words = countRoleplayWords(input.message);
  const detected = detectTargetVocabulary(input.message, input.targetVocabulary);
  const evidenceQuote = evidenceFrom(input.message);
  const hasAction = ACTION_PATTERN.test(input.message);
  const hasPoliteTone = POLITE_PATTERN.test(input.message);
  const goalSignals = countGoalSignals(input);
  const startsWithCapital = /^[A-Z]/.test(input.message.trim());
  const endsWithPunctuation = /[.!?]$/.test(input.message.trim());
  const withinUsefulLength = words >= input.minimumWords && words <= input.maximumWords;
  const goalAchieved = words >= input.minimumWords
    && detected.length > 0
    && hasAction
    && (goalSignals >= 2 || DECISION_PATTERN.test(input.message));

  const grammarScore = clampScore(50 + (startsWithCapital ? 15 : 0) + (endsWithPunctuation ? 15 : 0) + (hasAction ? 20 : 0));
  const vocabularyScore = detected.length ? 82 : 0;
  const toneScore = clampScore(58 + (hasPoliteTone ? 27 : 0) + (hasAction ? 10 : 0));
  const clarityScore = clampScore(52 + (hasAction ? 24 : 0) + (withinUsefulLength ? 18 : 0));

  const scoreForCriterion = (criterion: RoleplayCriterion): number => {
    if (criterionLooksLikeVocabulary(criterion)) return vocabularyScore;
    if (criterionLooksLikeGrammar(criterion)) return grammarScore;
    if (criterionLooksLikeTone(criterion)) return toneScore;
    return clarityScore;
  };

  const improvements: RoleplayImprovement[] = [];
  if (!hasPoliteTone) improvements.push({
    issueTr: "Ton daha iş birlikçi ve diplomatik olabilir.",
    suggestionEn: input.sampleAnswer,
    reasonTr: "Kibar modal ifadeler profesyonel bağlamda mesajı yumuşatır.",
  });
  if (!endsWithPunctuation || !startsWithCapital) improvements.push({
    issueTr: "Büyük harf ve noktalama kullanımı geliştirilebilir.",
    suggestionEn: input.sampleAnswer,
    reasonTr: "Temiz yazım mesajın okunabilirliğini artırır.",
  });

  return {
    goalAchieved,
    goalEvidence: goalAchieved ? evidenceQuote : "",
    criteria: input.successCriteria.map((criterion) => {
      const score = scoreForCriterion(criterion);
      return {
        criterionId: criterion.id,
        score,
        met: score >= 70,
        evidenceQuote: score > 0 ? evidenceQuote : "",
        feedbackTr: score >= 70
          ? `${criterion.label} ölçütü yanıttaki ifadelerle destekleniyor.`
          : `${criterion.label} ölçütünü daha açık biçimde göstermelisin.`,
      };
    }),
    targetVocabulary: detected.map((item) => ({
      vocabularyId: item.target.id,
      usedCorrectly: true,
      evidenceQuote: item.evidenceQuote,
      feedbackTr: `“${item.matchedForm}” hedef ifadesi yanıtta gerçekten kullanılmış.`,
    })),
    strengths: [
      ...(hasAction ? [{ labelTr: "Ana eylem açıkça ifade edilmiş.", evidenceQuote }] : []),
      ...(detected.length ? [{ labelTr: "Hedef kelime yanıtta bulunuyor.", evidenceQuote: detected[0].evidenceQuote }] : []),
    ],
    improvements,
    polishedAnswer: input.sampleAnswer,
    summaryTr: goalAchieved
      ? "Yanıt görev amacını karşılıyor; örnek sürümle karşılaştırarak tonu daha da iyileştirebilirsin."
      : "Yanıt henüz görev amacını, hedef ifadeyi ve gerekli ayrıntıyı birlikte göstermiyor.",
  };
}
