import type {
  BaseScenarioStep,
  BossBattleStep,
  CEFRLevel,
  ChoiceOption,
  Scenario,
  ScenarioCategory,
  ScenarioCharacter,
  ScenarioStep,
  ToneOption,
} from "@/types";
import { getLevelProfile } from "./levels";
import { advancedVocabulary } from "./advanced-vocabulary";

type AdvancedLevel = Extract<CEFRLevel, "C1" | "C2">;

type AdvancedMissionSeed = {
  id: string;
  title: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  level: AdvancedLevel;
  category: ScenarioCategory;
  location: Scenario["location"];
  character: ScenarioCharacter;
  targets: [string, string, string, string, string, string];
  listening: string;
  listeningTr: string;
  listeningAnswer: string;
  choicePrompt: string;
  choicePromptTr: string;
  choiceAnswer: string;
  tonePrompt: string;
  tonePromptTr: string;
  toneAnswer: string;
  builderAnswer: string;
  builderTr: string;
  openingLine: string;
  roleplayGoal: string;
  roleplayGoalTr: string;
  sampleAnswer: string;
};

const characters = {
  office: { id: "daniel", name: "Daniel", role: "Engineering Manager", roleTr: "Mühendislik Yöneticisi", avatar: "daniel", accent: "british" },
  production: { id: "lena", name: "Lena", role: "Shift Supervisor", roleTr: "Vardiya Süpervizörü", avatar: "lena", accent: "british" },
  meeting: { id: "sofia", name: "Sofia", role: "Project Manager", roleTr: "Proje Yöneticisi", avatar: "sofia", accent: "british" },
  quality: { id: "nora", name: "Nora", role: "Quality Specialist", roleTr: "Kalite Uzmanı", avatar: "nora", accent: "british" },
  safety: { id: "sam", name: "Sam", role: "Safety Specialist", roleTr: "İş Güvenliği Uzmanı", avatar: "sam", accent: "american" },
  career: { id: "riley", name: "Riley", role: "HR Director", roleTr: "İK Direktörü", avatar: "riley", accent: "american" },
} satisfies Record<ScenarioCategory, ScenarioCharacter>;

const baseStep = (
  id: string,
  title: string,
  prompt: string,
  promptTr: string,
  targetVocabularyIds: string[],
  xp: number,
): Omit<BaseScenarioStep, "type"> => ({
  id,
  title,
  instructionEn: "Respond with the most precise and professionally appropriate option.",
  instructionTr: "En doğru ve profesyonel açıdan en uygun yanıtı ver.",
  prompt,
  promptTr,
  ttsText: prompt,
  xp,
  targetVocabularyIds,
  hint: {
    en: "Distinguish the confirmed point, the implied concern and the requested decision.",
    tr: "Doğrulanan noktayı, örtük endişeyi ve istenen kararı birbirinden ayır.",
  },
  explanationEn: "The strongest response is precise, appropriately qualified and action-oriented.",
  explanationTr: "En güçlü yanıt net, gerektiği kadar çekinceli ve karar odaklıdır.",
});

const options = (id: string, correct: string, distractors?: string[]): ChoiceOption[] => {
  const alternatives = distractors ?? [
    "I agree in principle, so no further clarification is needed.",
    "We can revisit this at some unspecified point.",
    "I will simply follow the latest request without addressing the conflict.",
  ];
  return [
    {
      id: `${id}-correct`,
      text: correct,
      isCorrect: true,
      quality: "correct",
      feedbackEn: "This response identifies the issue and moves the conversation toward a clear decision.",
      feedbackTr: "Bu yanıt sorunu belirleyip görüşmeyi net bir karara taşır.",
    },
    ...alternatives.map((text, index): ChoiceOption => ({
      id: `${id}-wrong-${index + 1}`,
      text,
      isCorrect: false,
      quality: index === 0 ? "unnatural" : index === 1 ? "too-formal" : "off-topic",
      feedbackEn: "This misses either the nuance, the evidence boundary or the requested decision.",
      feedbackTr: "Bu seçenek nüansı, kanıt sınırını veya istenen kararı kaçırıyor.",
      naturalAlternative: correct,
    })),
  ];
};

const toneOptions = (id: string, correct: string): ToneOption[] => {
  const [correctOption, dismissive, overFormal, rude] = options(id, correct, [
    "Your concern is noted; nevertheless, the decision has already been made.",
    "With the greatest possible respect, I must categorically reject that view.",
    "That does not make sense, so let us move on.",
  ]);
  return [
    { ...correctOption, tone: "professional" },
    { ...dismissive, tone: "formal" },
    { ...overFormal, tone: "formal" },
    { ...rude, tone: "rude" },
  ];
};

const buildMission = (seed: AdvancedMissionSeed, previousId?: string): Scenario => {
  const profile = getLevelProfile(seed.level);
  const prefix = seed.id;
  const listeningOptions = options(`${prefix}-listen`, seed.listeningAnswer, [
    "The speaker treats every assumption as a confirmed fact.",
    "The speaker gives a detailed operational instruction.",
    "The speaker says no decision or follow-up is required.",
  ]);
  const choiceOptions = options(`${prefix}-choice`, seed.choiceAnswer);
  const professionalToneOptions = toneOptions(`${prefix}-tone`, seed.toneAnswer);
  const tokens = seed.builderAnswer.replace(/[.,]/g, "").split(" ");

  const sharedSteps: ScenarioStep[] = [
    {
      ...baseStep(`${prefix}-1`, "Advanced Listening", "What is the speaker communicating?", "Konuşmacı ne iletiyor?", seed.targets.slice(0, 2), profile.generatedStepXp),
      type: "listening",
      transcript: seed.listening,
      transcriptTr: seed.listeningTr,
      accent: seed.character.accent,
      playbackRate: profile.playbackRate,
      task: "identify-intent",
      options: listeningOptions,
      correctOptionId: listeningOptions[0].id,
    },
    {
      ...baseStep(`${prefix}-2`, "Close-call Dialogue", seed.choicePrompt, seed.choicePromptTr, seed.targets.slice(1, 3), profile.generatedStepXp),
      type: "dialogue-choice",
      options: choiceOptions,
      correctOptionId: choiceOptions[0].id,
    },
    {
      ...baseStep(`${prefix}-3`, "Tone Calibration", seed.tonePrompt, seed.tonePromptTr, seed.targets.slice(2, 4), profile.generatedStepXp),
      type: "tone-check",
      context: seed.tonePrompt,
      options: professionalToneOptions,
      correctOptionId: professionalToneOptions[0].id,
      desiredTone: "professional",
    },
    {
      ...baseStep(`${prefix}-4`, "Precision Builder", "Build the precise professional sentence.", "Net profesyonel cümleyi kur.", seed.targets.slice(3, 5), profile.generatedStepXp),
      type: "sentence-builder",
      tokens: [...tokens].sort((a, b) => a.localeCompare(b)),
      correctOrder: tokens,
      acceptedAnswers: [seed.builderAnswer],
      punctuation: ".",
      explanationEn: seed.builderAnswer,
      explanationTr: seed.builderTr,
    },
    {
      ...baseStep(`${prefix}-5`, "AI Roleplay", seed.roleplayGoal, seed.roleplayGoalTr, [...seed.targets], profile.generatedStepXp),
      type: "roleplay",
      instructionEn: "Write a professional reply. Meet the communication goal and use at least one target expression accurately.",
      instructionTr: "Profesyonel bir yanıt yaz. İletişim amacını karşıla ve en az bir hedef ifadeyi doğru kullan.",
      characterId: seed.character.id,
      characterRole: seed.character.role,
      openingLine: seed.openingLine,
      userGoal: seed.roleplayGoal,
      minimumWords: profile.roleplayWords.minimum,
      maximumWords: profile.roleplayWords.maximum,
      successCriteria: [
        { id: `${prefix}-goal`, label: "Communication goal", description: "The requested outcome or decision is made explicit.", weight: 30 },
        { id: `${prefix}-tone`, label: "Professional tone", description: "The response is diplomatic, measured and audience-aware.", weight: 30 },
        { id: `${prefix}-vocabulary`, label: "Target vocabulary", description: "At least one target expression is used accurately in context.", weight: 25 },
        { id: `${prefix}-precision`, label: "Grammar and precision", description: "Grammar and wording preserve the intended nuance.", weight: 15 },
      ],
      sampleAnswer: seed.sampleAnswer,
      mockFeedback: {
        grammar: 86,
        vocabulary: 88,
        naturalness: 86,
        professionalTone: 90,
        clarity: 88,
        summary: "The response is evidence-aware, diplomatic and clear about the requested decision.",
        corrections: [],
      },
    },
  ];

  const finalStep: ScenarioStep = seed.level === "C1"
    ? (() => {
        const quickOptions = options(`${prefix}-quick`, seed.choiceAnswer);
        return {
          ...baseStep(`${prefix}-6`, "Executive Quick Response", "Respond before the discussion moves on.", "Görüşme ilerlemeden yanıt ver.", seed.targets.slice(4), profile.generatedStepXp),
          type: "quick-response",
          timeLimitSeconds: 9,
          options: quickOptions,
          correctOptionId: quickOptions[0].id,
          comboBonusXp: 8,
        };
      })()
    : ({
        ...baseStep(`${prefix}-6`, "Three-phase Boss", "Synthesize the situation across three communication phases.", "Durumu üç iletişim aşamasında sentezle.", [...seed.targets], profile.generatedStepXp),
        type: "boss-battle",
        bossName: `${seed.title} // Executive Brief`,
        phases: [
          { id: `${prefix}-boss-1`, phaseType: "listen", prompt: "Identify the evidence boundary and the implied concern.", ttsText: seed.listening, expectedAnswer: seed.listeningAnswer, targetVocabularyIds: seed.targets.slice(0, 2) },
          { id: `${prefix}-boss-2`, phaseType: "choose", prompt: seed.choicePrompt, options: choiceOptions, expectedAnswer: seed.choiceAnswer, targetVocabularyIds: seed.targets.slice(2, 4) },
          { id: `${prefix}-boss-3`, phaseType: "summarize", prompt: "Deliver a concise executive synthesis without overstating certainty.", expectedAnswer: seed.builderAnswer, targetVocabularyIds: seed.targets.slice(4) },
        ],
        minimumPhasesToPass: 2,
        bonusXp: 24,
      } satisfies BossBattleStep);

  return {
    id: seed.id,
    slug: seed.id,
    title: seed.title,
    titleTr: seed.titleTr,
    descriptionEn: seed.descriptionEn,
    descriptionTr: seed.descriptionTr,
    level: seed.level,
    category: seed.category,
    location: seed.location,
    estimatedMinutes: profile.estimatedMinutes,
    characters: [seed.character],
    steps: [...sharedSteps, finalStep],
    targetVocabularyIds: [...seed.targets],
    xpReward: profile.generatedScenarioXp,
    coinReward: profile.generatedCoins,
    unlock: { requiredXp: 0, requiredScenarioIds: previousId ? [previousId] : [] },
    evaluation: {
      successMessageEn: "Mission complete — your message balanced nuance, evidence and a clear decision request.",
      successMessageTr: "Görev tamamlandı — mesajın nüansı, kanıtı ve net karar talebini dengeledi.",
      reviewMessageEn: "Review where the evidence ended and inference began, then tighten the requested action.",
      reviewMessageTr: "Kanıtın bittiği ve çıkarımın başladığı yeri gözden geçir; ardından istenen eylemi netleştir.",
      naturalExpressions: seed.targets.map((id) => advancedTermById.get(id) ?? id),
    },
    sortOrder: seed.level === "C1" ? 13 + categoryOrder.indexOf(seed.category) : 19 + categoryOrder.indexOf(seed.category),
    isBoss: seed.level === "C2",
    communicationOnly: seed.category === "production" || seed.category === "safety",
  };
};

const categoryOrder: ScenarioCategory[] = ["office", "production", "meeting", "quality", "safety", "career"];
const advancedTermById = new Map(advancedVocabulary.map((item) => [item.id, item.term]));

const seeds: AdvancedMissionSeed[] = [
  {
    id: "office-competing-priorities-c1", title: "Priority Diplomacy", titleTr: "Öncelik Diplomasisi", level: "C1", category: "office", location: "office-hub", character: characters.office,
    descriptionEn: "Negotiate conflicting priorities without sounding obstructive.", descriptionTr: "Çakışan öncelikleri engelleyici görünmeden müzakere et.",
    targets: ["office-c1-competing-priorities", "office-c1-manage-expectations", "office-c1-scope-tradeoff", "office-c1-flag-constraint", "office-c1-align-priorities", "office-c1-push-back-tactfully"],
    listening: "Both requests matter, but accepting Friday for each creates a scope trade-off we have not discussed.", listeningTr: "İki talep de önemli ancak ikisi için de cumayı kabul etmek henüz konuşmadığımız bir kapsam ödünleşimi yaratıyor.", listeningAnswer: "The speaker wants the competing priorities and scope trade-off discussed before committing.",
    choicePrompt: "Two sponsors both call their request urgent. What should you say?", choicePromptTr: "İki sponsor da talebini acil görüyor. Ne söylemelisin?", choiceAnswer: "Could we align on priorities so I can manage expectations with both sponsors?",
    tonePrompt: "Tactfully challenge two incompatible deadlines.", tonePromptTr: "Birbiriyle uyumsuz iki son tarihe incelikle itiraz et.", toneAnswer: "I would like to flag a constraint before we commit: meeting both dates would require a scope trade-off.",
    builderAnswer: "Could we align on priorities before I confirm either deadline", builderTr: "Herhangi bir son tarihi doğrulamadan önce önceliklerde uzlaşabilir miyiz?",
    openingLine: "Both sponsors expect delivery on Friday. Can you confirm that?", roleplayGoal: "Negotiate a realistic decision by explaining the conflict, proposing a trade-off and asking which priority should lead.", roleplayGoalTr: "Çakışmayı açıklayıp bir ödünleşim önererek ve hangi önceliğin öne geçeceğini sorarak gerçekçi bir karar müzakere et.",
    sampleAnswer: "I can support both requests, but they are competing priorities within the same window. To manage expectations responsibly, could we align on priorities or agree a scope trade-off before I confirm Friday to either sponsor?",
  },
  {
    id: "production-cross-shift-constraints-c1", title: "Constraint Handover", titleTr: "Kısıt Devir Teslimi", level: "C1", category: "production", location: "production-floor", character: characters.production,
    descriptionEn: "Communicate confirmed status, constraints and impact across shifts without giving process instructions.", descriptionTr: "Proses talimatı vermeden doğrulanmış durumu, kısıtları ve etkiyi vardiyalar arasında aktar.",
    targets: ["production-c1-operational-constraint", "production-c1-downstream-impact", "production-c1-working-assumption", "production-c1-confirmed-status", "production-c1-contingency-window", "production-c1-cross-shift-alignment"],
    listening: "The confirmed status is a two-hour delay; the downstream impact remains a working assumption until planning reviews it.", listeningTr: "Doğrulanmış durum iki saatlik gecikmedir; sonraki aşamalara etki planlama inceleyene kadar çalışma varsayımı olarak kalır.", listeningAnswer: "The delay is confirmed, while its downstream impact remains unconfirmed.",
    choicePrompt: "How should the next shift receive this update?", choicePromptTr: "Sonraki vardiya bu güncellemeyi nasıl almalı?", choiceAnswer: "I will separate the confirmed status from our working assumption and request cross-shift alignment.",
    tonePrompt: "State a constraint without prescribing an operational response.", tonePromptTr: "Operasyonel yanıt tarif etmeden bir kısıtı belirt.", toneAnswer: "I am flagging an operational constraint and its possible downstream impact for the authorized team to review.",
    builderAnswer: "The contingency window remains a working assumption pending cross-shift alignment", builderTr: "Beklenmedik durum zaman payı vardiyalar arası uyum sağlanana kadar bir çalışma varsayımıdır.",
    openingLine: "What exactly should I tell the incoming shift?", roleplayGoal: "Deliver a concise handover that separates confirmed status from assumptions, explains possible impact and assigns review to the authorized team.", roleplayGoalTr: "Doğrulanmış durumu varsayımlardan ayıran, olası etkiyi açıklayan ve incelemeyi yetkili ekibe bırakan kısa bir devir teslim yap.",
    sampleAnswer: "The confirmed status is a two-hour delay caused by an operational constraint. The downstream impact and contingency window are still working assumptions, so please record them as unconfirmed and request cross-shift alignment with the authorized planning team.",
  },
  {
    id: "meeting-difficult-consensus-c1", title: "Consensus Under Pressure", titleTr: "Baskı Altında Uzlaşma", level: "C1", category: "meeting", location: "meeting-room", character: characters.meeting,
    descriptionEn: "Acknowledge difficult disagreement and build a workable consensus.", descriptionTr: "Zor bir görüş ayrılığını kabul et ve uygulanabilir uzlaşma oluştur.",
    targets: ["meeting-c1-build-consensus", "meeting-c1-acknowledge-concern", "meeting-c1-reframe-discussion", "meeting-c1-common-ground", "meeting-c1-constructive-dissent", "meeting-c1-tentative-agreement"],
    listening: "The disagreement is real, yet both proposals protect the same customer outcome; that may be our common ground.", listeningTr: "Görüş ayrılığı gerçek ancak iki öneri de aynı müşteri sonucunu koruyor; ortak zeminimiz bu olabilir.", listeningAnswer: "The speaker acknowledges disagreement and identifies a shared outcome as common ground.",
    choicePrompt: "The meeting is becoming polarized. How do you intervene?", choicePromptTr: "Toplantı kutuplaşıyor. Nasıl müdahale edersin?", choiceAnswer: "Could we acknowledge the concern and reframe the discussion around the outcome we both support?",
    tonePrompt: "Respond to a strong objection while preserving constructive dissent.", tonePromptTr: "Yapıcı fikir ayrılığını koruyarak güçlü bir itiraza yanıt ver.", toneAnswer: "That concern is valid; perhaps we can use it to test where a tentative agreement is still possible.",
    builderAnswer: "Let us build consensus around the common ground before revisiting the disputed detail", builderTr: "Tartışmalı ayrıntıya dönmeden önce ortak zemin etrafında uzlaşma oluşturalım.",
    openingLine: "We have debated this for twenty minutes and the two sides are further apart. What now?", roleplayGoal: "Facilitate agreement by acknowledging both concerns, naming common ground and proposing a tentative next step.", roleplayGoalTr: "İki endişeyi de kabul ederek, ortak zemini adlandırarak ve geçici bir sonraki adım önererek uzlaşmayı kolaylaştır.",
    sampleAnswer: "I acknowledge the concern on both sides, and the constructive dissent has clarified the risk. Could we reframe the discussion around our common ground, then build consensus on a tentative agreement while the remaining detail is checked?",
  },
  {
    id: "quality-documentation-rationale-c1", title: "Evidence Trail", titleTr: "Kanıt İzi", level: "C1", category: "quality", location: "quality-lab", character: characters.quality,
    descriptionEn: "Defend documentation reasoning with evidence and explicit qualifications.", descriptionTr: "Dokümantasyon gerekçesini kanıt ve açık çekincelerle savun.",
    targets: ["quality-c1-evidentiary-basis", "quality-c1-documented-rationale", "quality-c1-material-discrepancy", "quality-c1-qualifying-statement", "quality-c1-traceable-record", "quality-c1-pending-verification"],
    listening: "The discrepancy is documented, but its explanation is pending verification and should not be presented as fact.", listeningTr: "Tutarsızlık belgelenmiştir ancak açıklaması doğrulama bekliyor ve gerçekmiş gibi sunulmamalıdır.", listeningAnswer: "The discrepancy is confirmed, but the explanation remains unverified.",
    choicePrompt: "A reviewer asks why the record remained open. What is the defensible response?", choicePromptTr: "İnceleyen kişi kaydın neden açık kaldığını soruyor. Savunulabilir yanıt nedir?", choiceAnswer: "The documented rationale cites a material discrepancy and marks the explanation as pending verification.",
    tonePrompt: "Defend the record without claiming more than the evidence supports.", tonePromptTr: "Kanıtın desteklediğinden fazlasını iddia etmeden kaydı savun.", toneAnswer: "The evidentiary basis supports keeping the review open, with a qualifying statement on the unverified cause.",
    builderAnswer: "Each conclusion should point to a traceable record and an explicit qualifying statement", builderTr: "Her sonuç izlenebilir bir kayda ve açık bir çekince ifadesine dayanmalıdır.",
    openingLine: "Why was this issue not closed when the first explanation arrived?", roleplayGoal: "Explain the documented rationale, cite the confirmed discrepancy and clearly qualify what remains unverified.", roleplayGoalTr: "Belgelenmiş gerekçeyi açıkla, doğrulanmış tutarsızlığı belirt ve doğrulanmamış kısmı açıkça çekinceyle sun.",
    sampleAnswer: "The documented rationale is based on a material discrepancy in two traceable records. The first explanation is still pending verification, so the evidentiary basis supports keeping the review open with a qualifying statement rather than treating that explanation as confirmed.",
  },
  {
    id: "safety-near-miss-pattern-c1", title: "Pattern Escalation", titleTr: "Örüntü Bildirimi", level: "C1", category: "safety", location: "safety-zone", character: characters.safety,
    descriptionEn: "Escalate recurring near-miss observations responsibly without speculation or operational instructions.", descriptionTr: "Tekrarlayan ramak kala gözlemlerini varsayım veya operasyon talimatı üretmeden sorumlu biçimde bildir.",
    targets: ["safety-c1-recurring-pattern", "safety-c1-near-miss-trend", "safety-c1-accountable-escalation", "safety-c1-precautionary-stance", "safety-c1-observed-condition", "safety-c1-avoid-speculation"],
    listening: "Three similar observations may indicate a recurring pattern, but the cause has not been established.", listeningTr: "Üç benzer gözlem tekrarlayan bir örüntüye işaret edebilir ancak neden belirlenmemiştir.", listeningAnswer: "A possible pattern should be reviewed, while the cause remains unconfirmed.",
    choicePrompt: "How should you raise the observations?", choicePromptTr: "Gözlemleri nasıl bildirmelisin?", choiceAnswer: "I will describe the observed condition, avoid speculation and request an accountable escalation for review.",
    tonePrompt: "Express urgency without diagnosing a cause or directing operations.", tonePromptTr: "Neden teşhis etmeden veya operasyona yön vermeden aciliyeti ifade et.", toneAnswer: "The near-miss trend warrants a precautionary stance and prompt review by the authorized safety team.",
    builderAnswer: "This recurring pattern requires accountable escalation while we avoid speculation", builderTr: "Bu tekrarlayan örüntü varsayımdan kaçınırken sorumluluğu belirli bir üst bildirim gerektirir.",
    openingLine: "Are you saying you already know what is causing these reports?", roleplayGoal: "Escalate the pattern by separating observation from speculation, communicating proportionate urgency and requesting authorized review.", roleplayGoalTr: "Gözlemi varsayımdan ayırarak, ölçülü aciliyet aktararak ve yetkili inceleme isteyerek örüntüyü üst makama bildir.",
    sampleAnswer: "I am not claiming a confirmed cause. I am reporting a recurring pattern in the observed condition and a possible near-miss trend. To avoid speculation, I recommend accountable escalation and a precautionary review by the authorized safety team.",
  },
  {
    id: "career-stakeholder-case-c1", title: "Stakeholder Case", titleTr: "Paydaş Vakası", level: "C1", category: "career", location: "training-center", character: characters.career,
    descriptionEn: "Present an evidence-based interview case with precise ownership and stakeholder impact.", descriptionTr: "Net sorumluluk ve paydaş etkisi içeren kanıta dayalı bir mülakat vakası sun.",
    targets: ["career-c1-evidence-based-example", "career-c1-stakeholder-alignment", "career-c1-measured-outcome", "career-c1-transferable-insight", "career-c1-development-trajectory", "career-c1-scope-contribution"],
    listening: "A credible case distinguishes your contribution from the team effort and ends with a measured outcome.", listeningTr: "İnandırıcı bir vaka katkını ekip çabasından ayırır ve ölçülmüş sonuçla biter.", listeningAnswer: "The example should define personal contribution and support the result with evidence.",
    choicePrompt: "How should you strengthen a broad achievement claim?", choicePromptTr: "Genel bir başarı iddiasını nasıl güçlendirmelisin?", choiceAnswer: "I will give an evidence-based example, define my scope of contribution and state the measured outcome.",
    tonePrompt: "Describe leadership without taking credit for the whole team.", tonePromptTr: "Tüm ekibin başarısını sahiplenmeden liderliği anlat.", toneAnswer: "I facilitated stakeholder alignment, while the delivery itself was a shared team outcome.",
    builderAnswer: "The experience provided a transferable insight that supports my development trajectory", builderTr: "Bu deneyim gelişim çizgimi destekleyen aktarılabilir bir içgörü sağladı.",
    openingLine: "Tell me about a time you aligned difficult stakeholders and what changed as a result.", roleplayGoal: "Give an evidence-based case that separates your contribution from the team effort, shows stakeholder alignment and ends with a measured outcome.", roleplayGoalTr: "Katkını ekip çabasından ayıran, paydaş uyumunu gösteren ve ölçülmüş sonuçla biten kanıta dayalı bir vaka anlat.",
    sampleAnswer: "In one project, I mapped the competing expectations and facilitated stakeholder alignment around a shared release criterion. My scope of contribution was the decision workshop and follow-up plan; the team delivered the work, and the measured outcome was a two-week reduction in approval time.",
  },
  {
    id: "office-executive-ambiguity-c2", title: "Executive Signal", titleTr: "Yönetici Sinyali", level: "C2", category: "office", location: "office-hub", character: characters.office,
    descriptionEn: "Turn ambiguous and conflicting requests into a concise executive synthesis.", descriptionTr: "Belirsiz ve çelişkili talepleri kısa bir yönetici sentezine dönüştür.",
    targets: ["office-c2-reconcile-directives", "office-c2-frame-tradeoff", "office-c2-executive-summary", "office-c2-strategic-implication", "office-c2-qualified-recommendation", "office-c2-decision-rationale"],
    listening: "One sponsor asks for speed while another asks for broader assurance; the conflict is strategic, not merely scheduling.", listeningTr: "Bir sponsor hız, diğeri daha geniş güvence istiyor; çatışma yalnızca takvimsel değil stratejiktir.", listeningAnswer: "The requests conflict at the level of strategic priorities and require an explicit trade-off.",
    choicePrompt: "How should an executive summary open?", choicePromptTr: "Bir yönetici özeti nasıl başlamalı?", choiceAnswer: "The two directives cannot both be maximized; the decision is whether speed or assurance should lead.",
    tonePrompt: "Give a recommendation while key figures are still being checked.", tonePromptTr: "Kritik rakamlar hâlâ kontrol edilirken öneri sun.", toneAnswer: "My qualified recommendation is to protect assurance, subject to confirmation of the commercial impact.",
    builderAnswer: "The executive summary should frame the trade-off and state the decision rationale", builderTr: "Yönetici özeti ödünleşimi çerçevelemeli ve karar gerekçesini belirtmelidir.",
    openingLine: "I have two contradictory sponsor notes and three minutes before the steering meeting. What is the decision?", roleplayGoal: "Deliver an executive summary that reconciles the directives, frames the strategic trade-off and gives a qualified recommendation with rationale.", roleplayGoalTr: "Talepleri uzlaştıran, stratejik ödünleşimi çerçeveleyen ve gerekçeli çekinceli öneri sunan bir yönetici özeti ver.",
    sampleAnswer: "The executive summary is that we cannot maximize both speed and assurance. To reconcile conflicting directives, I would frame the trade-off around the strategic implication: launching early increases unresolved exposure. My qualified recommendation is to protect assurance, subject to confirming the commercial impact; that is the decision rationale.",
  },
  {
    id: "production-escalation-uncertainty-c2", title: "Uncertainty Escalation", titleTr: "Belirsizlik Bildirimi", level: "C2", category: "production", location: "production-floor", character: characters.production,
    descriptionEn: "Escalate a problem and its assumptions to senior leadership without prescribing operations.", descriptionTr: "Operasyon tarif etmeden bir sorunu ve varsayımlarını üst yönetime bildir.",
    targets: ["production-c2-challenge-assumption", "production-c2-systemic-implication", "production-c2-evidence-gap", "production-c2-escalation-threshold", "production-c2-provisional-assessment", "production-c2-risk-narrative"],
    listening: "The pattern has crossed the escalation threshold, although the systemic implication remains a provisional assessment.", listeningTr: "Örüntü bildirim eşiğini aştı ancak sistemik sonuç hâlâ geçici bir değerlendirmedir.", listeningAnswer: "Escalation is justified, but the broader implication is not yet confirmed.",
    choicePrompt: "How do you brief leadership on the evidence gap?", choicePromptTr: "Kanıt boşluğunu yönetime nasıl aktarırsın?", choiceAnswer: "I will present the confirmed pattern, challenge the assumption of an isolated event and label the systemic implication provisional.",
    tonePrompt: "Escalate firmly without overstating causality.", tonePromptTr: "Nedenselliği abartmadan kararlı biçimde üst makama bildir.", toneAnswer: "The escalation threshold has been met; however, our risk narrative should preserve the current evidence gap.",
    builderAnswer: "This provisional assessment challenges an assumption without presenting it as confirmed cause", builderTr: "Bu geçici değerlendirme bir varsayımı sorgular ancak doğrulanmış neden gibi sunmaz.",
    openingLine: "Do we have a systemic problem, yes or no?", roleplayGoal: "Brief leadership by separating confirmed observations, assumptions and evidence gaps, then state why the escalation threshold has been met.", roleplayGoalTr: "Doğrulanmış gözlemleri, varsayımları ve kanıt boşluklarını ayırarak yönetimi bilgilendir; ardından bildirim eşiğinin neden karşılandığını belirt.",
    sampleAnswer: "We have a confirmed recurring pattern, but not a confirmed systemic cause. My provisional assessment is that the pattern may have a systemic implication, which challenges the assumption that each event is isolated. The evidence gap remains material; nevertheless, the agreed escalation threshold has been met, so leadership review is warranted.",
  },
  {
    id: "meeting-boardroom-reframing-c2", title: "Boardroom Reframe", titleTr: "Stratejik Yeniden Çerçeveleme", level: "C2", category: "meeting", location: "meeting-room", character: characters.meeting,
    descriptionEn: "Read implicit objections and reframe a strategic discussion for a senior audience.", descriptionTr: "Örtük itirazları okuyup stratejik tartışmayı üst düzey kitle için yeniden çerçevele.",
    targets: ["meeting-c2-implicit-objection", "meeting-c2-strategic-tradeoff", "meeting-c2-underlying-premise", "meeting-c2-calibrate-message", "meeting-c2-shift-register", "meeting-c2-synthesize-viewpoints"],
    listening: "The repeated question about reversibility is an implicit objection to the underlying premise, not a request for more detail.", listeningTr: "Geri döndürülebilirlikle ilgili tekrarlanan soru daha fazla ayrıntı talebi değil, temeldeki varsayıma örtük bir itirazdır.", listeningAnswer: "The speaker detects an implicit objection to the proposal's underlying premise.",
    choicePrompt: "How do you interrupt a circular strategic debate?", choicePromptTr: "Döngüsel stratejik tartışmaya nasıl müdahale edersin?", choiceAnswer: "Could we test the underlying premise and frame the strategic trade-off as a single decision question?",
    tonePrompt: "Move from technical detail to board-level language.", tonePromptTr: "Teknik ayrıntıdan yönetim kurulu düzeyinde dile geç.", toneAnswer: "Let me shift the register and synthesize the viewpoints around risk, reversibility and value.",
    builderAnswer: "We should calibrate the message before we synthesize the competing viewpoints", builderTr: "Çelişen bakış açılarını sentezlemeden önce mesajı hassas ayarlamalıyız.",
    openingLine: "Everyone has repeated their position. What are we actually deciding?", roleplayGoal: "Surface the implicit objection, test the underlying premise and synthesize the viewpoints into one strategic decision question.", roleplayGoalTr: "Örtük itirazı görünür kıl, temeldeki varsayımı test et ve bakış açılarını tek stratejik karar sorusunda sentezle.",
    sampleAnswer: "The implicit objection appears to concern reversibility rather than the delivery detail. Let me shift the register and test the underlying premise: are we optimizing for immediate value or preserving optionality? That frames the strategic trade-off and synthesizes the viewpoints into one decision question.",
  },
  {
    id: "quality-audit-scrutiny-c2", title: "Audit Under Scrutiny", titleTr: "Denetim Sorgusu", level: "C2", category: "quality", location: "quality-lab", character: characters.quality,
    descriptionEn: "Separate fact, inference and uncertainty in a demanding audit exchange.", descriptionTr: "Zorlu bir denetim görüşmesinde gerçek, çıkarım ve belirsizliği ayır.",
    targets: ["quality-c2-fact-inference", "quality-c2-audit-scrutiny", "quality-c2-weight-evidence", "quality-c2-residual-uncertainty", "quality-c2-defensible-conclusion", "quality-c2-scope-assurance"],
    listening: "The records confirm the timing, not the cause; the latter is an inference with residual uncertainty.", listeningTr: "Kayıtlar zamanı doğruluyor, nedeni değil; ikincisi kalan belirsizliği olan bir çıkarımdır.", listeningAnswer: "Timing is fact, while cause remains an inference with residual uncertainty.",
    choicePrompt: "An auditor asks whether the cause is proven. What should you say?", choicePromptTr: "Denetçi nedenin kanıtlanıp kanıtlanmadığını soruyor. Ne söylemelisin?", choiceAnswer: "No; the weight of evidence supports a limited inference, not a confirmed cause.",
    tonePrompt: "State a conclusion that will remain defensible under scrutiny.", tonePromptTr: "İnceleme altında savunulabilir kalacak bir sonuç belirt.", toneAnswer: "Within the current scope of assurance, the defensible conclusion is limited to the confirmed timing discrepancy.",
    builderAnswer: "A defensible conclusion must distinguish fact from inference and disclose residual uncertainty", builderTr: "Savunulabilir bir sonuç gerçeği çıkarımdan ayırmalı ve kalan belirsizliği açıklamalıdır.",
    openingLine: "Your report implies a cause. Are you presenting that as established fact?", roleplayGoal: "Respond under audit scrutiny by distinguishing fact from inference, stating the evidence weight and disclosing residual uncertainty and assurance scope.", roleplayGoalTr: "Gerçeği çıkarımdan ayırıp kanıt gücünü, kalan belirsizliği ve güvence kapsamını belirterek denetim sorgusuna yanıt ver.",
    sampleAnswer: "No. To distinguish fact from inference, the records establish the timing discrepancy, while the proposed cause is an inference. The weight of evidence supports it only provisionally, and residual uncertainty remains. Within the current scope of assurance, the defensible conclusion should therefore be limited to the confirmed fact.",
  },
  {
    id: "safety-executive-challenge-c2", title: "Weak Signal Challenge", titleTr: "Zayıf Risk Sinyali", level: "C2", category: "safety", location: "safety-zone", character: characters.safety,
    descriptionEn: "Challenge normalized risk diplomatically, clearly and without operational direction.", descriptionTr: "Normalleşmiş riski operasyonel yön vermeden diplomatik ve net biçimde sorgula.",
    targets: ["safety-c2-normalization-deviance", "safety-c2-challenge-complacency", "safety-c2-emerging-risk-signal", "safety-c2-proportional-urgency", "safety-c2-uncertainty-statement", "safety-c2-leadership-accountability"],
    listening: "Repeated exceptions do not prove harm, but they may be an emerging risk signal that leadership should not normalize.", listeningTr: "Tekrarlanan istisnalar zararı kanıtlamaz ancak liderliğin normalleştirmemesi gereken ortaya çıkan bir risk sinyali olabilir.", listeningAnswer: "The pattern may be a risk signal and warrants leadership attention without a claim of proven harm.",
    choicePrompt: "How do you challenge 'nothing has happened yet'?", choicePromptTr: "Henüz bir şey olmadı ifadesini nasıl sorgularsın?", choiceAnswer: "The absence of an incident does not remove the emerging risk signal or leadership accountability to review it.",
    tonePrompt: "Question normalized exceptions without blaming individuals.", tonePromptTr: "Kişileri suçlamadan normalleşmiş istisnaları sorgula.", toneAnswer: "I would like to challenge complacency around the pattern while keeping our urgency proportional to the evidence.",
    builderAnswer: "The uncertainty statement preserves proportional urgency while challenging normalization of deviance", builderTr: "Belirsizlik ifadesi sapmanın normalleşmesini sorgularken ölçülü aciliyeti korur.",
    openingLine: "These exceptions have happened for months without an incident. Why escalate now?", roleplayGoal: "Challenge normalization of deviance by naming the risk signal, preserving uncertainty and requesting accountable leadership review without giving operational instructions.", roleplayGoalTr: "Risk sinyalini adlandırıp belirsizliği koruyarak ve operasyon talimatı vermeden sorumlu liderlik incelemesi isteyerek sapmanın normalleşmesini sorgula.",
    sampleAnswer: "The absence of an incident does not rule out an emerging risk signal. Repeated exceptions may indicate normalization of deviance, although that remains an uncertainty statement rather than a confirmed outcome. With proportional urgency, I would challenge complacency and ask leadership to meet its accountability for authorized review.",
  },
  {
    id: "career-executive-diplomacy-c2", title: "Mandate Negotiation", titleTr: "Yetki Müzakeresi", level: "C2", category: "career", location: "training-center", character: characters.career,
    descriptionEn: "Negotiate authority, scope and leadership expectations with executive diplomacy.", descriptionTr: "Yetki, kapsam ve liderlik beklentilerini üst düzey diplomasiyle müzakere et.",
    targets: ["career-c2-executive-presence", "career-c2-negotiate-mandate", "career-c2-decision-authority", "career-c2-strategic-remit", "career-c2-diplomatic-boundary", "career-c2-leadership-narrative"],
    listening: "The role carries broad accountability, yet its decision authority and strategic remit remain deliberately vague.", listeningTr: "Rol geniş sorumluluk taşıyor ancak karar yetkisi ve stratejik görev alanı bilinçli biçimde belirsiz bırakılmış.", listeningAnswer: "The accountability is broad while authority and remit remain unclear.",
    choicePrompt: "How do you clarify the role without sounding defensive?", choicePromptTr: "Savunmacı görünmeden rolü nasıl netleştirirsin?", choiceAnswer: "Before accepting full accountability, could we clarify the strategic remit and corresponding decision authority?",
    tonePrompt: "Set a boundary around responsibility outside the mandate.", tonePromptTr: "Yetki alanı dışındaki sorumluluk konusunda sınır koy.", toneAnswer: "I am open to broader ownership, provided we negotiate the mandate and the authority needed to deliver it.",
    builderAnswer: "Executive presence includes setting a diplomatic boundary around an unclear strategic remit", builderTr: "Üst düzey liderlik duruşu belirsiz stratejik görev alanı çevresinde diplomatik sınır koymayı içerir.",
    openingLine: "We need someone who owns the outcome regardless of formal authority. Are you comfortable with that?", roleplayGoal: "Negotiate the mandate by aligning accountability with decision authority, clarifying strategic remit and setting a diplomatic boundary.", roleplayGoalTr: "Sorumluluğu karar yetkisiyle eşleştirip stratejik görev alanını netleştirerek ve diplomatik sınır koyarak yetki çerçevesini müzakere et.",
    sampleAnswer: "I am comfortable with meaningful accountability, and my leadership narrative reflects that. To negotiate the mandate responsibly, I would first clarify the strategic remit and decision authority. Executive presence also requires a diplomatic boundary: I can own the outcome where the role has the authority and sponsorship needed to influence it.",
  },
];

export const advancedScenarios: Scenario[] = [];

for (const level of ["C1", "C2"] as const) {
  let previousId: string | undefined;
  for (const category of categoryOrder) {
    const seed = seeds.find((item) => item.level === level && item.category === category);
    if (!seed) throw new Error(`Missing ${level}/${category} advanced mission seed.`);
    const scenario = buildMission(seed, previousId);
    advancedScenarios.push(scenario);
    previousId = scenario.id;
  }
}
