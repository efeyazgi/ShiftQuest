import type {
  BaseScenarioStep,
  BossBattleStep,
  CEFRLevel,
  ChoiceOption,
  DialogueChoiceStep,
  FillBlankStep,
  ListeningStep,
  MatchingPair,
  MatchingStep,
  QuickResponseStep,
  RoleplayStep,
  Scenario,
  ScenarioCategory,
  ScenarioStep,
  SentenceBuilderStep,
  ToneCheckStep,
  WordPuzzleStep,
} from "../types";

type StepBase = Omit<BaseScenarioStep, "type">;

const baseStep = (
  id: string,
  title: string,
  prompt: string,
  promptTr: string,
  vocabularyIds: string[],
  hintTr: string,
  explanationEn: string,
  explanationTr: string,
): StepBase => ({
  id,
  title,
  instructionEn: "Choose or build the most natural professional response.",
  instructionTr: "En doğal ve profesyonel yanıtı seç veya oluştur.",
  prompt,
  promptTr,
  ttsText: prompt,
  xp: 12,
  targetVocabularyIds: vocabularyIds,
  hint: { en: explanationEn, tr: hintTr || undefined },
  explanationEn,
  explanationTr,
});

const choices = (
  id: string,
  correct: string,
  distractors: string[],
  explanationEn: string,
  explanationTr: string,
): ChoiceOption[] => [
  {
    id: `${id}-correct`,
    text: correct,
    isCorrect: true,
    quality: "correct",
    feedbackEn: explanationEn,
    feedbackTr: explanationTr,
  },
  ...distractors.map((text, index): ChoiceOption => ({
    id: `${id}-wrong-${index + 1}`,
    text,
    isCorrect: false,
    quality: index === 0 ? "too-direct" : index === 1 ? "unnatural" : "too-formal",
    feedbackEn: index === 0 ? "This sounds too direct for the situation." : "This is less natural in professional English.",
    feedbackTr: index === 0 ? "Bu ifade durum için fazla doğrudan." : "Bu ifade profesyonel İngilizcede daha az doğal.",
    naturalAlternative: correct,
  })),
];

const dialogueChoice = (
  id: string,
  level: CEFRLevel,
  prompt: string,
  promptTr: string,
  correct: string,
  distractors: string[],
  vocabularyIds: string[],
  hintTr: string,
  explanationEn: string,
  explanationTr: string,
): DialogueChoiceStep => ({
  ...baseStep(id, "Dialogue Choice", prompt, promptTr, vocabularyIds, level === "B1" ? hintTr : "", explanationEn, explanationTr),
  type: "dialogue-choice",
  instructionEn: "Select the most natural professional reply.",
  instructionTr: "En doğal ve profesyonel yanıtı seç.",
  options: choices(id, correct, distractors, explanationEn, explanationTr),
  correctOptionId: `${id}-correct`,
});

const sentenceBuilder = (
  id: string,
  level: CEFRLevel,
  prompt: string,
  promptTr: string,
  answer: string,
  vocabularyIds: string[],
  hintTr: string,
  explanationEn: string,
  explanationTr: string,
): SentenceBuilderStep => {
  const ordered = answer.replace(/[.,?]/g, "").split(" ");
  const splitAt = level === "B1" ? 2 : 3;
  return {
    ...baseStep(id, "Sentence Builder", prompt, promptTr, vocabularyIds, level === "B1" ? hintTr : "", explanationEn, explanationTr),
    type: "sentence-builder",
    instructionEn: "Put the words in the correct order.",
    instructionTr: "Kelimeleri doğru sıraya koy.",
    tokens: [...ordered.slice(splitAt), ...ordered.slice(0, splitAt)],
    correctOrder: ordered,
    acceptedAnswers: [answer, answer.replace(/[.?]$/, "")],
    punctuation: answer.endsWith("?") ? "?" : ".",
  };
};

const fillBlank = (
  id: string,
  level: CEFRLevel,
  sentence: string,
  sentenceTr: string,
  correct: string,
  distractors: string[],
  vocabularyIds: string[],
  hintTr: string,
  explanationEn: string,
  explanationTr: string,
): FillBlankStep => ({
  ...baseStep(id, "Fill in the Blank", sentence, sentenceTr, vocabularyIds, level === "B1" ? hintTr : "", explanationEn, explanationTr),
  type: "fill-blank",
  instructionEn: "Complete the sentence with the best expression.",
  instructionTr: "Cümleyi en uygun ifadeyle tamamla.",
  sentence,
  blankLabel: "___",
  options: choices(id, correct, distractors, explanationEn, explanationTr),
  correctOptionId: `${id}-correct`,
});

const listening = (
  id: string,
  level: CEFRLevel,
  transcript: string,
  transcriptTr: string,
  question: string,
  questionTr: string,
  correct: string,
  distractors: string[],
  vocabularyIds: string[],
  hintTr: string,
  explanationEn: string,
  explanationTr: string,
): ListeningStep => ({
  ...baseStep(id, "Listening Challenge", question, questionTr, vocabularyIds, level === "B1" ? hintTr : "", explanationEn, explanationTr),
  type: "listening",
  instructionEn: "Listen, then identify the speaker’s meaning.",
  instructionTr: "Dinle, ardından konuşmacının ne demek istediğini bul.",
  transcript,
  transcriptTr,
  ttsText: transcript,
  accent: level === "B1" ? "american" : "british",
  playbackRate: level === "B1" ? 0.75 : 1,
  task: "identify-intent",
  options: choices(id, correct, distractors, explanationEn, explanationTr),
  correctOptionId: `${id}-correct`,
});

const matching = (
  id: string,
  level: CEFRLevel,
  prompt: string,
  promptTr: string,
  pairs: MatchingPair[],
  vocabularyIds: string[],
  hintTr: string,
): MatchingStep => ({
  ...baseStep(id, "Match the Meaning", prompt, promptTr, vocabularyIds, level === "B1" ? hintTr : "", "Match each expression with its workplace meaning.", "Her ifadeyi iş yerindeki anlamıyla eşleştir."),
  type: "matching",
  instructionEn: "Match each English expression with its Turkish meaning.",
  instructionTr: "Her İngilizce ifadeyi Türkçe anlamıyla eşleştir.",
  pairs,
  shuffleRight: true,
});

const toneCheck = (
  id: string,
  level: CEFRLevel,
  context: string,
  contextTr: string,
  correct: string,
  distractors: string[],
  vocabularyIds: string[],
  hintTr: string,
  explanationEn: string,
  explanationTr: string,
): ToneCheckStep => ({
  ...baseStep(id, "Tone Check", context, contextTr, vocabularyIds, level === "B1" ? hintTr : "", explanationEn, explanationTr),
  type: "tone-check",
  instructionEn: "Choose the professional and appropriately polite sentence.",
  instructionTr: "Profesyonel ve uygun ölçüde kibar cümleyi seç.",
  context,
  options: choices(id, correct, distractors, explanationEn, explanationTr).map((option, index) => ({
    ...option,
    tone: option.isCorrect ? "professional" : index === 1 ? "direct" : index === 2 ? "rude" : "formal",
  })),
  correctOptionId: `${id}-correct`,
  desiredTone: "professional",
});

const quickResponse = (
  id: string,
  level: CEFRLevel,
  prompt: string,
  promptTr: string,
  correct: string,
  distractors: string[],
  vocabularyIds: string[],
  hintTr: string,
  explanationEn: string,
  explanationTr: string,
): QuickResponseStep => ({
  ...baseStep(id, "Quick Response", prompt, promptTr, vocabularyIds, level === "B1" ? hintTr : "", explanationEn, explanationTr),
  type: "quick-response",
  instructionEn: "Choose the best reply before the timer ends.",
  instructionTr: "Süre bitmeden en iyi yanıtı seç.",
  timeLimitSeconds: level === "B1" ? 15 : 10,
  options: choices(id, correct, distractors, explanationEn, explanationTr),
  correctOptionId: `${id}-correct`,
  comboBonusXp: 5,
});

const wordPuzzle = (
  id: string,
  level: CEFRLevel,
  prompt: string,
  promptTr: string,
  scrambled: string,
  answer: string,
  vocabularyIds: string[],
  hintTr: string,
): WordPuzzleStep => ({
  ...baseStep(id, "Word Puzzle", prompt, promptTr, vocabularyIds, level === "B1" ? hintTr : "", "Unscramble the workplace expression.", "İş yeri ifadesinin harflerini doğru sıraya getir."),
  type: "word-puzzle",
  instructionEn: "Unscramble the letters.",
  instructionTr: "Harfleri doğru sıraya koy.",
  puzzleKind: "anagram",
  scrambled,
  answer,
  clueEn: prompt,
  clueTr: promptTr,
  acceptedAnswers: [answer, answer.toLocaleLowerCase("en-US")],
});

const roleplay = (
  id: string,
  prompt: string,
  promptTr: string,
  characterId: string,
  characterRole: string,
  openingLine: string,
  userGoal: string,
  sampleAnswer: string,
  vocabularyIds: string[],
): RoleplayStep => ({
  ...baseStep(id, "AI Roleplay", prompt, promptTr, vocabularyIds, "", "Use a clear, natural and professional response.", "Açık, doğal ve profesyonel bir yanıt kullan."),
  type: "roleplay",
  instructionEn: "Write a concise professional reply to the character.",
  instructionTr: "Karaktere kısa ve profesyonel bir yanıt yaz.",
  characterId,
  characterRole,
  openingLine,
  userGoal,
  minimumWords: 12,
  maximumWords: 55,
  successCriteria: [
    { id: `${id}-clarity`, label: "Clarity", description: "The main message is immediately clear.", weight: 30 },
    { id: `${id}-tone`, label: "Professional tone", description: "The response is polite and natural.", weight: 30 },
    { id: `${id}-vocab`, label: "Target vocabulary", description: "At least one target expression is used correctly.", weight: 25 },
    { id: `${id}-grammar`, label: "Grammar", description: "Errors do not obscure meaning.", weight: 15 },
  ],
  sampleAnswer,
  mockFeedback: {
    grammar: 82,
    vocabulary: 86,
    naturalness: 84,
    professionalTone: 90,
    clarity: 88,
    summary: "Clear and professional. One shorter sentence would make the update even easier to follow.",
    corrections: [],
  },
});

const bossBattle = (
  id: string,
  prompt: string,
  promptTr: string,
  bossName: string,
  phases: BossBattleStep["phases"],
  vocabularyIds: string[],
): BossBattleStep => ({
  ...baseStep(id, "Scenario Boss Battle", prompt, promptTr, vocabularyIds, "", "Complete the linked communication tasks in sequence.", "Bağlantılı iletişim görevlerini sırayla tamamla."),
  type: "boss-battle",
  instructionEn: "Complete all three phases of the communication challenge.",
  instructionTr: "İletişim mücadelesinin üç aşamasını tamamla.",
  xp: 25,
  bossName,
  phases,
  minimumPhasesToPass: 2,
  bonusXp: 15,
});

const evaluation = (focus: string, focusTr: string) => ({
  successMessageEn: `Mission complete — you handled ${focus} clearly and professionally.`,
  successMessageTr: `Görev tamamlandı — ${focusTr} açık ve profesyonel biçimde yönettin.`,
  reviewMessageEn: `Review the target expressions and retry the steps where the tone or meaning was unclear.`,
  reviewMessageTr: "Hedef ifadeleri gözden geçir ve tonun veya anlamın belirsiz kaldığı adımları yeniden dene.",
  naturalExpressions: ["Could you clarify that?", "I’ll keep you updated.", "Let me double-check."],
});

const scenarioMeta = (
  id: string,
  title: string,
  titleTr: string,
  level: CEFRLevel,
  category: ScenarioCategory,
  sortOrder: number,
  targetVocabularyIds: string[],
  descriptionEn: string,
  descriptionTr: string,
): Omit<Scenario, "characters" | "steps" | "location" | "evaluation"> => ({
  id,
  slug: id,
  title,
  titleTr,
  descriptionEn,
  descriptionTr,
  level,
  category,
  estimatedMinutes: level === "B1" ? 6 : 9,
  targetVocabularyIds,
  xpReward: level === "B1" ? 100 : 145,
  coinReward: level === "B1" ? 35 : 50,
  unlock: { requiredXp: Math.max(0, (sortOrder - 2) * 40), requiredScenarioIds: [] },
  sortOrder,
  isBoss: level === "B2",
});

const officeCharacters = [
  { id: "maya", name: "Maya", role: "Project Coordinator", roleTr: "Proje Koordinatörü", avatar: "maya", accent: "american" as const },
  { id: "daniel", name: "Daniel", role: "Engineering Manager", roleTr: "Mühendislik Yöneticisi", avatar: "daniel", accent: "british" as const },
];

const productionCharacters = [
  { id: "emre", name: "Emre", role: "Production Operator", roleTr: "Üretim Operatörü", avatar: "emre", accent: "american" as const },
  { id: "lena", name: "Lena", role: "Shift Supervisor", roleTr: "Vardiya Süpervizörü", avatar: "lena", accent: "british" as const },
];

const meetingCharacters = [
  { id: "sofia", name: "Sofia", role: "Project Manager", roleTr: "Proje Yöneticisi", avatar: "sofia", accent: "british" as const },
  { id: "kerem", name: "Kerem", role: "Process Engineer", roleTr: "Proses Mühendisi", avatar: "kerem", accent: "american" as const },
];

const qualityCharacters = [
  { id: "nora", name: "Nora", role: "Quality Specialist", roleTr: "Kalite Uzmanı", avatar: "nora", accent: "british" as const },
  { id: "alex", name: "Alex", role: "Production Supervisor", roleTr: "Üretim Sorumlusu", avatar: "alex", accent: "american" as const },
];

const safetyCharacters = [
  { id: "sam", name: "Sam", role: "Safety Specialist", roleTr: "İş Güvenliği Uzmanı", avatar: "sam", accent: "american" as const },
  { id: "aylin", name: "Aylin", role: "Area Coordinator", roleTr: "Alan Koordinatörü", avatar: "aylin", accent: "british" as const },
];

const careerCharacters = [
  { id: "riley", name: "Riley", role: "HR Specialist", roleTr: "İK Uzmanı", avatar: "riley", accent: "american" as const },
  { id: "james", name: "James", role: "Foreign Colleague", roleTr: "Yabancı İş Arkadaşı", avatar: "james", accent: "british" as const },
];

const officeHelpB1: Scenario = {
  ...scenarioMeta(
    "office-help-first-week-b1",
    "A Helpful First Week",
    "İlk Haftada Yardım İstemek",
    "B1",
    "office",
    1,
    ["office-walk-through", "office-follow-up", "office-keep-updated", "office-double-check", "office-deadline", "office-priority"],
    "Ask for help, confirm a deadline and give a short task update with guided language.",
    "Yönlendirmeli dil desteğiyle yardım iste, teslim tarihini doğrula ve kısa bir görev güncellemesi ver.",
  ),
  location: "office-hub",
  characters: officeCharacters,
  evaluation: evaluation("your first-week office requests", "ilk haftandaki ofis taleplerini"),
  steps: [
    dialogueChoice(
      "office-b1-1", "B1", "Maya: This tracker is where we record every task. What would you like to ask?", "Maya: Tüm görevleri bu takip çizelgesine kaydediyoruz. Ne sormak istersin?",
      "Could you walk me through this tracker?", ["Show me this tracker.", "Could you walking me through it?"], ["office-walk-through"],
      "Kibar soru için ‘Could you...?’ kalıbını kullan.", "‘Could you walk me through...?’ is a natural way to ask for a step-by-step explanation.", "‘Could you walk me through...?’ adım adım açıklama istemenin doğal bir yoludur.",
    ),
    sentenceBuilder(
      "office-b1-2", "B1", "Promise to share news about the task.", "Görevle ilgili gelişmeleri paylaşacağına söz ver.",
      "I’ll keep you updated on the task.", ["office-keep-updated"], "‘I’ll’ ile başla; sonra haber verme kalıbını kullan.",
      "‘Keep you updated’ promises regular information.", "‘Keep you updated’ düzenli bilgi vereceğini ifade eder.",
    ),
    fillBlank(
      "office-b1-3", "B1", "Let me ___ the deadline before I reply.", "Yanıtlamadan önce son teslim tarihini tekrar kontrol edeyim.",
      "double-check", ["follow", "priority"], ["office-double-check", "office-deadline"], "‘Tekrar kontrol etmek’ anlamındaki birleşik fiili seç.",
      "‘Double-check’ means to check something again.", "‘Double-check’ bir şeyi tekrar kontrol etmek demektir.",
    ),
    listening(
      "office-b1-4", "B1", "The deadline has been moved to Friday, so please update your calendar.", "Son teslim tarihi cumaya alındı; lütfen takvimini güncelle.",
      "What changed?", "Ne değişti?", "The deadline is now Friday.", ["The meeting was cancelled.", "The task is already complete."], ["office-deadline"],
      "‘Moved to Friday’ ifadesine dikkat et.", "The speaker says the due date changed to Friday.", "Konuşmacı teslim tarihinin cumaya değiştiğini söylüyor.",
    ),
    toneCheck(
      "office-b1-5", "B1", "You need Maya’s help with an email attachment.", "E-posta ekiyle ilgili Maya’nın yardımına ihtiyacın var.",
      "Could you take a look at the attachment when you have a moment?", ["Look at this now.", "You must check my attachment."], ["office-attachment"],
      "İstek için ‘Could you...?’ ve zaman esnekliği kullan.", "The request is polite, specific and not demanding.", "İstek kibar, belirli ve emredici değildir.",
    ),
    quickResponse(
      "office-b1-6", "B1", "Daniel: Which task will you do first?", "Daniel: Önce hangi görevi yapacaksın?",
      "The client update is my first priority.", ["I have many works.", "Do not ask me."], ["office-priority", "office-workload"],
      "Önceliği doğrudan ama sakin biçimde belirt.", "This reply clearly identifies the first priority.", "Bu yanıt ilk önceliği açıkça belirtir.",
    ),
  ],
};

const officePrioritiesB2: Scenario = {
  ...scenarioMeta(
    "office-priority-reset-b2",
    "The Priority Reset",
    "Öncelikleri Yeniden Düzenleme",
    "B2",
    "office",
    2,
    ["office-workload", "office-reschedule", "office-feedback", "office-draft", "office-attachment", "office-be-responsible"],
    "Negotiate competing priorities, request nuanced feedback and summarize a revised plan.",
    "Çakışan öncelikleri müzakere et, ayrıntılı geri bildirim iste ve revize edilen planı özetle.",
  ),
  location: "office-hub",
  characters: officeCharacters,
  evaluation: evaluation("a nuanced workload discussion", "ayrıntılı bir iş yükü görüşmesini"),
  steps: [
    listening(
      "office-b2-1", "B2", "I know you’re responsible for the tracker, but the client draft now takes precedence. Let’s revisit the workload.", "Takip çizelgesinden sorumlu olduğunu biliyorum ancak müşteri taslağı artık öncelikli. İş yükünü yeniden değerlendirelim.",
      "What is Daniel proposing?", "Daniel ne öneriyor?", "Reassess the workload because the client draft is now more urgent.", ["Stop maintaining the tracker permanently.", "Send the unfinished draft immediately.", "Ask another department to own both tasks."], ["office-workload", "office-draft", "office-be-responsible"], "",
      "‘Takes precedence’ signals that priorities have changed, not that a task has disappeared.", "‘Takes precedence’ bir görevin ortadan kalktığını değil, önceliklerin değiştiğini belirtir.",
    ),
    matching(
      "office-b2-2", "B2", "Match the planning expressions.", "Planlama ifadelerini eşleştir.",
      [
        { id: "office-b2-p1", left: "workload", right: "iş yükü" },
        { id: "office-b2-p2", left: "reschedule", right: "yeniden zamanlamak" },
        { id: "office-b2-p3", left: "be responsible for", right: "-den sorumlu olmak" },
      ], ["office-workload", "office-reschedule", "office-be-responsible"], "",
    ),
    toneCheck(
      "office-b2-3", "B2", "You need to challenge an unrealistic deadline without sounding uncooperative.", "İş birliğine kapalı görünmeden gerçekçi olmayan bir teslim tarihine itiraz etmen gerekiyor.",
      "Given my current workload, could we revisit the deadline or agree on what should take priority?", ["This deadline is impossible, so I won’t do it.", "I would most respectfully petition for an alteration to the appointed date.", "Can’t you see that I already have too much work?"], ["office-workload", "office-priority", "office-deadline"], "",
      "This wording explains the constraint and invites a practical decision.", "Bu ifade kısıtı açıklar ve uygulanabilir bir karara davet eder.",
    ),
    wordPuzzle(
      "office-b2-4", "B2", "A preliminary version of a document.", "Bir belgenin ilk hâli.", "TFARD", "DRAFT", ["office-draft"], "",
    ),
    roleplay(
      "office-b2-5", "Request focused feedback on your draft and mention the attachment.", "Taslağın hakkında odaklı geri bildirim iste ve e-posta ekinden söz et.",
      "daniel", "Engineering Manager", "I have ten minutes before my next meeting. What would you like me to review?",
      "Politely direct Daniel to the attached draft and ask for feedback on clarity and priorities.",
      "Could you review the attached draft, particularly the priorities on page two? I’d appreciate your feedback on whether the timeline is clear.",
      ["office-feedback", "office-draft", "office-attachment"],
    ),
    bossBattle(
      "office-b2-6", "Turn three competing tasks into a professional revised plan.", "Birbiriyle çakışan üç görevi profesyonel bir revize plana dönüştür.", "Inbox Overload",
      [
        { id: "office-b2-boss-1", phaseType: "listen", prompt: "Identify which deadline moved.", ttsText: "The review has moved to Thursday, while the client draft remains due Wednesday.", expectedAnswer: "The review moved to Thursday.", targetVocabularyIds: ["office-reschedule", "office-deadline"] },
        { id: "office-b2-boss-2", phaseType: "choose", prompt: "Ask to confirm the new priority.", options: choices("office-b2-boss-choice", "Could we confirm which task should take priority?", ["Which thing do you want?", "Tell me the priority now.", "Might one elucidate the hierarchy?"], "This is clear and collaborative.", "Bu ifade açık ve iş birliğine dayalıdır."), expectedAnswer: "Could we confirm which task should take priority?", targetVocabularyIds: ["office-priority"] },
        { id: "office-b2-boss-3", phaseType: "summarize", prompt: "Summarize the revised plan in one or two sentences.", expectedAnswer: "I’ll complete the client draft first, reschedule the review and keep you updated.", targetVocabularyIds: ["office-draft", "office-reschedule", "office-keep-updated"] },
      ], ["office-workload", "office-reschedule", "office-draft", "office-priority"],
    ),
  ],
};

const productionShiftB1: Scenario = {
  ...scenarioMeta(
    "production-shift-start-b1", "Shift Start Check-In", "Vardiya Başlangıç Görüşmesi", "B1", "production", 3,
    ["production-shift-handover", "production-plan", "production-operator", "production-equipment-status", "production-output", "production-take-sample"],
    "Understand a simple handover, ask for status and request a sample using everyday production English.",
    "Basit bir vardiya teslimini anla, durum sor ve günlük üretim İngilizcesiyle numune iste.",
  ),
  location: "production-floor",
  characters: productionCharacters,
  evaluation: evaluation("a routine shift check-in", "rutin bir vardiya başlangıç görüşmesini"),
  steps: [
    listening(
      "production-b1-1", "B1", "The morning shift was completed without any major issues, and the output was on target.", "Sabah vardiyası ciddi bir sorun olmadan tamamlandı ve üretim miktarı hedefteydi.",
      "How did the morning shift go?", "Sabah vardiyası nasıl geçti?", "It finished normally and met the output target.", ["It stopped because of a major issue.", "No one checked the output."], ["production-shift-handover", "production-major-issue", "production-output"],
      "‘Without any major issues’ olumlu bir sonuç anlatır.", "The handover reports a normal shift and target output.", "Vardiya teslimi normal bir vardiya ve hedeflenen üretim miktarını bildiriyor.",
    ),
    dialogueChoice(
      "production-b1-2", "B1", "Lena: Do you have any questions before the shift begins?", "Lena: Vardiya başlamadan önce sorunuz var mı?",
      "Could you confirm the equipment status?", ["Equipment status now.", "Can you confirms equipment?"], ["production-equipment-status"],
      "Bilgi istemek için ‘Could you confirm...?’ kullan.", "This politely asks for a clear status update.", "Bu ifade net bir durum güncellemesini kibarca ister.",
    ),
    matching(
      "production-b1-3", "B1", "Match the shift words.", "Vardiya kelimelerini eşleştir.",
      [
        { id: "production-b1-p1", left: "shift handover", right: "vardiya teslimi" },
        { id: "production-b1-p2", left: "production plan", right: "üretim planı" },
        { id: "production-b1-p3", left: "operator", right: "operatör" },
      ], ["production-shift-handover", "production-plan", "production-operator"], "Önce bildiğin benzer Türkçe kelimeyi bul.",
    ),
    fillBlank(
      "production-b1-4", "B1", "Could someone ___ for the lab?", "Biri laboratuvar için numune alabilir mi?",
      "take a sample", ["make an output", "handover a plan"], ["production-take-sample"], "‘Numune almak’ kalıbını seç.",
      "‘Take a sample’ is the standard everyday request.", "‘Take a sample’ günlük kullanımda standart numune alma talebidir.",
    ),
    sentenceBuilder(
      "production-b1-5", "B1", "Ask to review today’s plan together.", "Bugünkü planı birlikte gözden geçirmeyi iste.",
      "Could we review the production plan together?", ["production-plan"], "‘Could we...?’ ile ortak eylem öner.",
      "‘Could we’ makes this a cooperative suggestion.", "‘Could we’ bunu iş birliğine dayalı bir öneri yapar.",
    ),
    quickResponse(
      "production-b1-6", "B1", "Emre: The output is slightly below the target. What should you say?", "Emre: Üretim miktarı hedefin biraz altında. Ne söylemelisin?",
      "Thanks for the update. I’ll let the supervisor know.", ["You made a bad output.", "It is not my problem."], ["production-output", "production-supervisor"],
      "Bilgiyi aldığını belirt ve ilgili kişiyi haberdar edeceğini söyle.", "The reply acknowledges the update and communicates the next contact.", "Yanıt güncellemeyi kabul eder ve sonraki iletişim kişisini belirtir.",
    ),
  ],
};

const productionDelayB2: Scenario = {
  ...scenarioMeta(
    "production-delay-briefing-b2", "Explaining a Production Delay", "Üretim Gecikmesini Açıklama", "B2", "production", 4,
    ["production-behind-schedule", "production-downtime", "production-investigate", "production-logbook", "production-current-status", "production-supervisor"],
    "Interpret a nuanced delay update, separate known facts from open questions and brief a supervisor.",
    "Ayrıntılı bir gecikme güncellemesini yorumla, bilinenleri açık sorulardan ayır ve süpervizöre bilgi ver.",
  ),
  location: "control-room",
  characters: productionCharacters,
  evaluation: evaluation("a fact-based delay briefing", "gerçeklere dayalı bir gecikme bilgilendirmesini"),
  steps: [
    listening(
      "production-b2-1", "B2", "We’re slightly behind schedule after forty minutes of downtime. The current status is stable, but the cause is still being investigated.", "Kırk dakikalık duruşun ardından programın biraz gerisindeyiz. Mevcut durum istikrarlı ancak neden hâlâ araştırılıyor.",
      "Which statement is fully supported?", "Hangi ifade tamamen destekleniyor?", "There was downtime, the status is stable, and the cause is not yet confirmed.", ["The cause has been confirmed and fixed.", "Production is ahead of schedule again.", "The supervisor requested another shutdown."], ["production-behind-schedule", "production-downtime", "production-investigate", "production-current-status"], "",
      "The update distinguishes confirmed facts from an ongoing investigation.", "Güncelleme, doğrulanmış bilgileri devam eden incelemeden ayırıyor.",
    ),
    fillBlank(
      "production-b2-2", "B2", "The cause has not been confirmed, so we need to ___ the issue further.", "Neden doğrulanmadı; bu yüzden sorunu daha ayrıntılı incelememiz gerekiyor.",
      "investigate", ["assume", "overlook", "handover"], ["production-investigate"], "",
      "‘Investigate’ communicates a careful fact-finding process.", "‘Investigate’ dikkatli bir bilgi toplama sürecini ifade eder.",
    ),
    toneCheck(
      "production-b2-3", "B2", "You need the operator’s observations without assigning blame.", "Suçlayıcı olmadan operatörün gözlemlerine ihtiyacın var.",
      "Could you walk me through what you observed before the downtime?", ["What did you do wrong before the line stopped?", "Explain yourself immediately.", "Might you furnish a comprehensive recital of antecedent events?"], ["production-downtime", "office-walk-through"], "",
      "The question asks for observations neutrally and in sequence.", "Soru gözlemleri tarafsız biçimde ve sırayla istiyor.",
    ),
    sentenceBuilder(
      "production-b2-4", "B2", "Give a careful status update without guessing the cause.", "Neden hakkında tahmin yürütmeden dikkatli bir durum güncellemesi ver.",
      "We are behind schedule, but the cause is still under investigation.", ["production-behind-schedule", "production-investigate"], "",
      "‘Still under investigation’ avoids presenting an assumption as a fact.", "‘Still under investigation’ bir varsayımı gerçek gibi sunmaktan kaçınır.",
    ),
    roleplay(
      "production-b2-5", "Brief Lena using only confirmed information.", "Lena’ya yalnızca doğrulanmış bilgileri kullanarak bilgi ver.",
      "lena", "Shift Supervisor", "Give me the current status and tell me what we know about the delay.",
      "State the downtime, current status and ongoing investigation; do not invent a technical cause.",
      "We had forty minutes of downtime and are slightly behind schedule. The current status is stable, and the cause is still being investigated. I’ll keep you updated.",
      ["production-downtime", "production-current-status", "production-investigate", "production-behind-schedule"],
    ),
    bossBattle(
      "production-b2-6", "Complete a fact-check, logbook summary and supervisor update.", "Bilgi doğrulama, kayıt defteri özeti ve süpervizör güncellemesini tamamla.", "Delay Decoder",
      [
        { id: "production-b2-boss-1", phaseType: "listen", prompt: "Identify the confirmed duration.", ttsText: "The logbook records thirty-eight minutes of downtime, not fifty.", expectedAnswer: "Thirty-eight minutes.", targetVocabularyIds: ["production-logbook", "production-downtime"] },
        { id: "production-b2-boss-2", phaseType: "choose", prompt: "Choose the neutral clarification request.", options: choices("production-b2-boss-choice", "Could you clarify whether that time is exact or approximate?", ["Your time is wrong.", "Give me the exact time.", "Would exactitude conceivably be attainable?"], "This checks precision without blame.", "Bu ifade suçlamadan kesinliği kontrol eder."), expectedAnswer: "Could you clarify whether that time is exact or approximate?", targetVocabularyIds: ["production-logbook"] },
        { id: "production-b2-boss-3", phaseType: "summarize", prompt: "Write a concise supervisor update.", expectedAnswer: "The logbook shows thirty-eight minutes of downtime; we are behind schedule and still investigating the cause.", targetVocabularyIds: ["production-logbook", "production-downtime", "production-investigate"] },
      ], ["production-logbook", "production-downtime", "production-behind-schedule", "production-investigate"],
    ),
  ],
};

const meetingActionItemsB1: Scenario = {
  ...scenarioMeta(
    "meeting-action-items-b1", "From Agenda to Action", "Gündemden Aksiyona", "B1", "meeting", 5,
    ["meeting-agenda", "meeting-action-item", "meeting-minutes", "meeting-share-opinion", "meeting-summarize", "meeting-go-over"],
    "Join a short team meeting, share a simple opinion and confirm the action items.",
    "Kısa bir ekip toplantısına katıl, basit bir görüş paylaş ve aksiyon maddelerini doğrula.",
  ),
  location: "meeting-room",
  characters: meetingCharacters,
  evaluation: evaluation("a clear team meeting", "açık bir ekip toplantısını"),
  steps: [
    dialogueChoice(
      "meeting-b1-1", "B1", "Sofia: Before we start, does everyone have the agenda?", "Sofia: Başlamadan önce gündem herkeste var mı?",
      "Yes, I have it. Could we go over the first item?", ["Start item one.", "Yes, we goes over it."], ["meeting-agenda", "meeting-go-over"],
      "Gündemi aldığını söyle ve kibarca ilk maddeye geçmeyi öner.", "The reply confirms receipt and politely moves the meeting forward.", "Yanıt gündemin alındığını doğrular ve toplantıyı kibarca ilerletir.",
    ),
    fillBlank(
      "meeting-b1-2", "B1", "May I ___ on the proposed date?", "Önerilen tarih hakkındaki görüşümü paylaşabilir miyim?",
      "share my opinion", ["make a minutes", "do agenda"], ["meeting-share-opinion"], "‘Görüşümü paylaşmak’ kalıbını seç.",
      "‘Share my opinion’ is a clear and polite meeting phrase.", "‘Share my opinion’ açık ve kibar bir toplantı ifadesidir.",
    ),
    listening(
      "meeting-b1-3", "B1", "Kerem will update the timeline by Thursday. That is our first action item.", "Kerem zaman çizelgesini perşembeye kadar güncelleyecek. Bu ilk aksiyon maddemiz.",
      "What must Kerem do?", "Kerem ne yapmalı?", "Update the timeline by Thursday.", ["Write the meeting minutes today.", "Cancel Thursday’s meeting."], ["meeting-action-item"],
      "Kişi, eylem ve zamana odaklan.", "An action item needs a clear owner, task and deadline.", "Bir aksiyon maddesinin net bir sorumlusu, görevi ve tarihi olmalıdır.",
    ),
    matching(
      "meeting-b1-4", "B1", "Match the meeting words.", "Toplantı kelimelerini eşleştir.",
      [
        { id: "meeting-b1-p1", left: "agenda", right: "gündem" },
        { id: "meeting-b1-p2", left: "action item", right: "aksiyon maddesi" },
        { id: "meeting-b1-p3", left: "meeting minutes", right: "toplantı tutanağı" },
      ], ["meeting-agenda", "meeting-action-item", "meeting-minutes"], "Toplantının planı ‘agenda’, kaydı ‘minutes’tır.",
    ),
    toneCheck(
      "meeting-b1-5", "B1", "You did not understand Sofia’s last point.", "Sofia’nın son söylediğini anlamadın.",
      "I’m not sure I understood correctly. Could you explain that again?", ["You make no sense.", "Repeat now."], ["meeting-clarify-meaning"],
      "Önce anlamadığını nazikçe belirt, sonra açıklama iste.", "This admits uncertainty without blaming the speaker.", "Bu ifade konuşmacıyı suçlamadan belirsizliği belirtir.",
    ),
    sentenceBuilder(
      "meeting-b1-6", "B1", "End by reviewing the assigned tasks.", "Atanan görevleri gözden geçirerek bitir.",
      "Let’s go over the action items.", ["meeting-go-over", "meeting-action-item"], "‘Let’s’ ortak bir öneri yapar.",
      "This is a natural way to review agreed tasks before closing.", "Bu ifade kapanıştan önce kararlaştırılan görevleri gözden geçirmenin doğal yoludur.",
    ),
  ],
};

const meetingTimelineB2: Scenario = {
  ...scenarioMeta(
    "meeting-timeline-challenge-b2", "Challenge the Timeline", "Zaman Planına Yapıcı İtiraz", "B2", "meeting", 6,
    ["meeting-concern", "meeting-perspective", "meeting-elaborate", "meeting-consensus", "meeting-bring-up", "meeting-interrupt"],
    "Raise a concern, disagree tactfully and move a cross-functional discussion toward consensus.",
    "Bir endişeyi dile getir, incelikli biçimde katılma ve birimler arası görüşmeyi uzlaşmaya taşı.",
  ),
  location: "meeting-room",
  characters: meetingCharacters,
  evaluation: evaluation("a tactful timeline challenge", "incelikli bir zaman planı itirazını"),
  steps: [
    listening(
      "meeting-b2-1", "B2", "From a quality perspective, the proposed launch date leaves very little time for review. I’m not rejecting it, but I do want to raise that concern.", "Kalite bakış açısından önerilen lansman tarihi inceleme için çok az zaman bırakıyor. Tarihi reddetmiyorum ancak bu endişeyi dile getirmek istiyorum.",
      "What is the speaker doing?", "Konuşmacı ne yapıyor?", "Flagging a risk while keeping the proposal open for discussion.", ["Rejecting the launch date completely.", "Approving the timeline without reservations.", "Asking to remove quality from the project."], ["meeting-perspective", "meeting-concern"], "",
      "The speaker distinguishes a concern from a final rejection.", "Konuşmacı bir endişeyi kesin bir ret kararından ayırıyor.",
    ),
    toneCheck(
      "meeting-b2-2", "B2", "You disagree with the estimate but want to keep the discussion constructive.", "Tahmine katılmıyorsun ancak görüşmeyi yapıcı tutmak istiyorsun.",
      "I see the reasoning, although I’m not fully convinced the estimate allows enough review time.", ["That estimate is clearly wrong.", "I categorically repudiate this untenable proposition.", "No, we are not doing that."], ["meeting-disagree-politely", "meeting-concern"], "",
      "The sentence acknowledges the reasoning before expressing a specific reservation.", "Cümle, belirli bir çekinceyi belirtmeden önce gerekçeyi kabul eder.",
    ),
    dialogueChoice(
      "meeting-b2-3", "B2", "Sofia: We can finish the review in two days. You need more detail before responding.", "Sofia: İncelemeyi iki günde bitirebiliriz. Yanıt vermeden önce daha fazla ayrıntıya ihtiyacın var.",
      "Could you elaborate on how the two-day estimate was calculated?", ["Prove that two days is enough.", "Could you explain?", "Would you be so kind as to expound upon the computational provenance?"], ["meeting-elaborate"], "",
      "The question requests the specific missing detail without implying the claim is false.", "Soru iddianın yanlış olduğunu ima etmeden eksik olan belirli ayrıntıyı ister.",
    ),
    sentenceBuilder(
      "meeting-b2-4", "B2", "Introduce a concern at the right moment.", "Uygun anda bir endişeyi gündeme getir.",
      "I’d like to bring up one concern before we decide.", ["meeting-bring-up", "meeting-concern"], "",
      "‘Bring up’ naturally introduces a topic for discussion.", "‘Bring up’ bir konuyu görüşmeye doğal biçimde sokar.",
    ),
    roleplay(
      "meeting-b2-5", "Respond to Sofia with a constructive alternative.", "Sofia’ya yapıcı bir alternatifle yanıt ver.",
      "sofia", "Project Manager", "If you disagree with Friday’s date, what would you suggest instead?",
      "Briefly explain the concern, propose an alternative and invite the group’s view.",
      "My concern is that Friday leaves too little review time. Could we consider Monday instead and check whether that works for the wider team?",
      ["meeting-concern", "meeting-perspective", "meeting-consensus"],
    ),
    bossBattle(
      "meeting-b2-6", "Guide the discussion from disagreement to a recorded decision.", "Görüşmeyi fikir ayrılığından kayıtlı bir karara taşı.", "Consensus Circuit",
      [
        { id: "meeting-b2-boss-1", phaseType: "listen", prompt: "Identify the unresolved concern.", ttsText: "Monday works for production, but quality still needs confirmation from the reviewer.", expectedAnswer: "Quality still needs reviewer confirmation.", targetVocabularyIds: ["meeting-concern", "meeting-perspective"] },
        { id: "meeting-b2-boss-2", phaseType: "choose", prompt: "Interrupt politely to clarify the decision.", options: choices("meeting-b2-boss-choice", "Sorry to interrupt, but could we confirm whether Monday is provisional?", ["Stop. Is Monday final?", "You haven’t made a decision.", "Pardon my interjection; might finality be elucidated?"], "This polite interruption asks a precise question.", "Bu kibar söz kesme, belirli bir soru sorar."), expectedAnswer: "Sorry to interrupt, but could we confirm whether Monday is provisional?", targetVocabularyIds: ["meeting-interrupt"] },
        { id: "meeting-b2-boss-3", phaseType: "summarize", prompt: "Record the provisional consensus and open action.", expectedAnswer: "We provisionally agreed on Monday, pending confirmation from the quality reviewer.", targetVocabularyIds: ["meeting-consensus", "meeting-minutes"] },
      ], ["meeting-consensus", "meeting-interrupt", "meeting-concern", "meeting-perspective"],
    ),
  ],
};

const missingDocumentB1: Scenario = {
  ...scenarioMeta(
    "missing-production-document-b1", "The Missing Production Document", "Eksik Üretim Belgesi", "B1", "quality", 7,
    ["quality-missing-document", "quality-under-review", "quality-check-team", "office-keep-updated", "office-necessary-changes", "quality-batch-record"],
    "Find out what is missing, ask about its status and give your manager a clear update.",
    "Neyin eksik olduğunu öğren, durumunu sor ve yöneticine açık bir güncelleme ver.",
  ),
  location: "quality-lab",
  characters: qualityCharacters,
  evaluation: evaluation("the missing production document", "eksik üretim belgesi durumunu"),
  steps: [
    listening(
      "quality-b1-1", "B1", "The production file is incomplete because yesterday’s batch record is missing.", "Dünkü parti kayıt formu eksik olduğu için üretim dosyası tamamlanmamış.",
      "What is the problem?", "Sorun nedir?", "Yesterday’s batch record is missing.", ["The whole production plan was cancelled.", "Today’s batch has already been approved."], ["quality-missing-document", "quality-batch-record"],
      "‘Missing’ kelimesi dosyada bulunmayan şeyi anlatır.", "The speaker identifies one missing document, not a production problem.", "Konuşmacı bir üretim sorunu değil, tek bir eksik belge belirtiyor.",
    ),
    dialogueChoice(
      "quality-b1-2", "B1", "Alex: We can’t complete the file yet. Ask for clarification.", "Alex: Dosyayı henüz tamamlayamıyoruz. Açıklama iste.",
      "Could you clarify which document is missing?", ["Which paper did you lose?", "Clarify me the missing."], ["quality-missing-document", "office-clarify"],
      "‘Could you clarify...?’ ile hangi belge olduğunu sor.", "This asks for the exact missing item without blaming anyone.", "Bu ifade kimseyi suçlamadan eksik olan şeyi tam olarak sorar.",
    ),
    fillBlank(
      "quality-b1-3", "B1", "Is the document still ___?", "Belge hâlâ inceleme altında mı?",
      "under review", ["behind output", "on deadline"], ["quality-under-review"], "‘İnceleme altında’ anlamındaki kalıbı seç.",
      "‘Under review’ describes a document that is currently being checked.", "‘Under review’ şu anda kontrol edilen bir belgeyi anlatır.",
    ),
    matching(
      "quality-b1-4", "B1", "Match the document expressions.", "Belge ifadelerini eşleştir.",
      [
        { id: "quality-b1-p1", left: "missing document", right: "eksik belge" },
        { id: "quality-b1-p2", left: "under review", right: "inceleme altında" },
        { id: "quality-b1-p3", left: "batch record", right: "parti kayıt formu" },
      ], ["quality-missing-document", "quality-under-review", "quality-batch-record"], "Belgenin yokluğu ve inceleme durumu farklı ifadelerdir.",
    ),
    sentenceBuilder(
      "quality-b1-5", "B1", "Suggest asking quality before making changes.", "Değişiklik yapmadan önce kaliteye danışmayı öner.",
      "We should check with the quality team first.", ["quality-check-team"], "‘We should’ ile öneri yap.",
      "The sentence suggests the correct communication route without giving an operational instruction.", "Cümle operasyon talimatı vermeden uygun iletişim yolunu önerir.",
    ),
    bossBattle(
      "quality-b1-6", "Understand the status, consult quality and update your manager.", "Durumu anla, kaliteye danış ve yöneticini bilgilendir.", "Document Dash",
      [
        { id: "quality-b1-boss-1", phaseType: "listen", prompt: "Identify the document status.", ttsText: "Quality has the batch record, and it is still under review.", expectedAnswer: "The batch record is with quality and under review.", targetVocabularyIds: ["quality-batch-record", "quality-under-review"] },
        { id: "quality-b1-boss-2", phaseType: "choose", prompt: "Choose the best next communication.", options: choices("quality-b1-boss-choice", "I’ll check with the quality team and confirm the status.", ["I’ll change the record myself.", "Quality must finish now."], "This checks with the responsible team without making assumptions.", "Bu ifade varsayım yapmadan sorumlu ekibe danışır."), expectedAnswer: "I’ll check with the quality team and confirm the status.", targetVocabularyIds: ["quality-check-team"] },
        { id: "quality-b1-boss-3", phaseType: "summarize", prompt: "Give your manager a short update.", expectedAnswer: "The batch record is under review. I’ll keep you updated and make the necessary changes after quality responds.", targetVocabularyIds: ["office-keep-updated", "office-necessary-changes", "quality-under-review"] },
      ], ["quality-missing-document", "quality-under-review", "quality-check-team", "office-keep-updated", "office-necessary-changes"],
    ),
  ],
};

const qualityDiscrepancyB2: Scenario = {
  ...scenarioMeta(
    "quality-record-discrepancy-b2", "The Record Discrepancy", "Kayıt Tutarsızlığı", "B2", "quality", 8,
    ["quality-batch-record", "quality-sop", "quality-deviation", "quality-corrective-action", "quality-discrepancy", "quality-traceability"],
    "Report a documentation discrepancy precisely, avoid premature conclusions and agree on follow-up communication.",
    "Bir dokümantasyon tutarsızlığını kesin biçimde bildir, erken sonuçlardan kaçın ve takip iletişiminde anlaş.",
  ),
  location: "quality-lab",
  characters: qualityCharacters,
  evaluation: evaluation("a documentation discrepancy", "dokümantasyon tutarsızlığını"),
  steps: [
    listening(
      "quality-b2-1", "B2", "The batch record lists 14:20, whereas the supporting form shows 14:40. We’ve confirmed the discrepancy, but not its cause.", "Parti kaydı 14.20’yi, destekleyici form ise 14.40’ı gösteriyor. Tutarsızlığı doğruladık ancak nedenini doğrulamadık.",
      "What is known?", "Ne biliniyor?", "The records contain different times, but the reason is not confirmed.", ["The later time is definitely correct.", "The supporting form should be discarded.", "A corrective action has already been completed."], ["quality-batch-record", "quality-discrepancy"], "",
      "The speaker confirms the mismatch while withholding judgment about its cause.", "Konuşmacı farklılığı doğrularken nedeni hakkında hüküm vermiyor.",
    ),
    toneCheck(
      "quality-b2-2", "B2", "Ask the author about the different times without suggesting misconduct.", "Farklı saatleri, uygunsuzluk ima etmeden yazara sor.",
      "Could you help me understand why these two records show different times?", ["Why did you enter the wrong time?", "Explain this discrepancy immediately.", "Might the temporal divergence be elucidated?"], ["quality-discrepancy"], "",
      "This neutral question focuses on the records rather than accusing the person.", "Bu tarafsız soru kişiyi suçlamak yerine kayıtlara odaklanır.",
    ),
    fillBlank(
      "quality-b2-3", "B2", "Accurate dates support document ___.", "Doğru tarihler belge izlenebilirliğini destekler.",
      "traceability", ["availability", "output", "workload"], ["quality-traceability"], "",
      "‘Traceability’ is the ability to follow the history of a record.", "‘Traceability’, bir kaydın geçmişini takip edebilme özelliğidir.",
    ),
    matching(
      "quality-b2-4", "B2", "Match the quality communication terms.", "Kalite iletişimi terimlerini eşleştir.",
      [
        { id: "quality-b2-p1", left: "deviation", right: "sapma" },
        { id: "quality-b2-p2", left: "corrective action", right: "düzeltici faaliyet" },
        { id: "quality-b2-p3", left: "discrepancy", right: "tutarsızlık" },
      ], ["quality-deviation", "quality-corrective-action", "quality-discrepancy"], "",
    ),
    roleplay(
      "quality-b2-5", "Report the discrepancy to Nora without proposing an unapproved correction.", "Onaylanmamış bir düzeltme önermeden tutarsızlığı Nora’ya bildir.",
      "nora", "Quality Specialist", "What exactly did you find, and what has been confirmed so far?",
      "Describe the two records, distinguish fact from assumption and ask how to document the follow-up.",
      "The batch record shows 14:20, while the supporting form shows 14:40. The discrepancy is confirmed, but the cause is not. Could you advise how we should document the follow-up according to the SOP?",
      ["quality-batch-record", "quality-discrepancy", "quality-sop"],
    ),
    bossBattle(
      "quality-b2-6", "Move from a precise observation to an agreed documentation follow-up.", "Kesin bir gözlemden kararlaştırılmış dokümantasyon takibine geç.", "Traceability Trial",
      [
        { id: "quality-b2-boss-1", phaseType: "listen", prompt: "Separate the confirmed fact from the suggestion.", ttsText: "The dates differ. Nora suggests opening a deviation record, subject to her manager’s confirmation.", expectedAnswer: "The date difference is confirmed; the deviation record is still a suggestion.", targetVocabularyIds: ["quality-discrepancy", "quality-deviation"] },
        { id: "quality-b2-boss-2", phaseType: "choose", prompt: "Request confirmation of the documentation route.", options: choices("quality-b2-boss-choice", "Could you confirm whether we should document this as a deviation?", ["I’ll open a deviation now.", "This is obviously a deviation.", "Would deviation classification be deemed apposite?"], "This asks the responsible specialist to confirm the route.", "Bu ifade uygun yolu sorumlu uzmana doğrulatır."), expectedAnswer: "Could you confirm whether we should document this as a deviation?", targetVocabularyIds: ["quality-deviation", "quality-sop"] },
        { id: "quality-b2-boss-3", phaseType: "summarize", prompt: "Summarize the fact and pending decision.", expectedAnswer: "We confirmed a time discrepancy; quality is confirming the appropriate documentation and any corrective follow-up.", targetVocabularyIds: ["quality-discrepancy", "quality-corrective-action"] },
      ], ["quality-discrepancy", "quality-deviation", "quality-sop", "quality-corrective-action"],
    ),
  ],
};

const safetyReminderB1: Scenario = {
  ...scenarioMeta(
    "safety-ppe-reminder-b1", "The Polite PPE Reminder", "Kibar KKD Hatırlatması", "B1", "safety", 9,
    ["safety-ppe", "safety-unsafe-condition", "safety-warning-sign", "safety-restricted-area", "safety-report-immediately", "safety-briefing"],
    "Understand safety signs, give a polite PPE reminder and report an observation to the right colleague.",
    "Güvenlik levhalarını anla, kibar bir KKD hatırlatması yap ve bir gözlemi doğru iş arkadaşına bildir.",
  ),
  location: "safety-zone",
  characters: safetyCharacters,
  evaluation: evaluation("a respectful safety reminder", "saygılı bir güvenlik hatırlatmasını"),
  communicationOnly: true,
  steps: [
    listening(
      "safety-b1-1", "B1", "Before we enter, please check the sign and make sure you have the required PPE.", "Girmeden önce lütfen levhayı kontrol edin ve gerekli KKD’nizin olduğundan emin olun.",
      "What is the speaker asking?", "Konuşmacı ne istiyor?", "Check the sign and confirm the required PPE is present.", ["Operate the nearby equipment.", "Remove every warning sign."], ["safety-ppe", "safety-warning-sign"],
      "Konuşmacı levha ve gerekli koruyucu donanımdan söz ediyor.", "The message is a communication reminder, not equipment instruction.", "Mesaj bir iletişim hatırlatmasıdır; ekipman talimatı değildir.",
    ),
    dialogueChoice(
      "safety-b1-2", "B1", "A visitor is approaching the marked area without the PPE shown on the sign.", "Bir ziyaretçi, levhada gösterilen KKD olmadan işaretli alana yaklaşıyor.",
      "Excuse me, the sign says PPE is required in this area.", ["You can’t go there like that.", "Put those things on now."], ["safety-ppe", "safety-warning-sign"],
      "Önce ‘Excuse me’ de, sonra levhadaki gerekliliği açıkla.", "This reminder is calm, specific and based on the posted sign.", "Bu hatırlatma sakin, belirli ve asılı levhaya dayalıdır.",
    ),
    matching(
      "safety-b1-3", "B1", "Match the safety communication words.", "Güvenlik iletişimi kelimelerini eşleştir.",
      [
        { id: "safety-b1-p1", left: "warning sign", right: "uyarı levhası" },
        { id: "safety-b1-p2", left: "restricted area", right: "girişi kısıtlı alan" },
        { id: "safety-b1-p3", left: "safety briefing", right: "güvenlik bilgilendirmesi" },
      ], ["safety-warning-sign", "safety-restricted-area", "safety-briefing"], "‘Restricted’ girişin kısıtlı olduğunu anlatır.",
    ),
    toneCheck(
      "safety-b1-4", "B1", "You need to tell Aylin about a damaged warning sign.", "Aylin’e hasarlı bir uyarı levhasını bildirmen gerekiyor.",
      "Aylin, I’d like to report a damaged warning sign near the entrance.", ["The sign is bad. Fix it.", "Someone failed with the sign."], ["safety-warning-sign", "production-report-issue"],
      "Gözlemi ve yerini tarafsız biçimde söyle.", "The report identifies the observation and location without blame.", "Bildirim gözlemi ve yeri suçlama olmadan belirtir.",
    ),
    sentenceBuilder(
      "safety-b1-5", "B1", "Report an observation clearly.", "Bir gözlemi açıkça bildir.",
      "I’d like to report an unsafe condition.", ["safety-unsafe-condition"], "‘I’d like to report...’ ile başla.",
      "This is a standard, calm opening for a safety report.", "Bu, güvenlik bildirimi için standart ve sakin bir başlangıçtır.",
    ),
    quickResponse(
      "safety-b1-6", "B1", "Sam: Is there anything else I should know?", "Sam: Bilmem gereken başka bir şey var mı?",
      "Yes, the warning sign at the entrance is damaged.", ["Maybe things are bad.", "No, but I did not check."], ["safety-warning-sign", "safety-report-immediately"],
      "Gözlemi kısa ve belirli biçimde paylaş.", "The answer gives a specific observation that Sam can follow up on.", "Yanıt Sam’in takip edebileceği belirli bir gözlem sunar.",
    ),
  ],
};

const safetyReportB2: Scenario = {
  ...scenarioMeta(
    "safety-observation-report-b2", "Report, Clarify, Escalate", "Bildir, Açıkla, İlet", "B2", "safety", 10,
    ["safety-spill", "safety-leak", "safety-incident", "safety-near-miss", "safety-hazard", "safety-assembly-point"],
    "Communicate an observed spill clearly, distinguish observation from assumption and relay the safety team’s message.",
    "Gözlenen bir dökülmeyi açıkça bildir, gözlemi varsayımdan ayır ve güvenlik ekibinin mesajını ilet.",
  ),
  location: "safety-zone",
  characters: safetyCharacters,
  evaluation: evaluation("a precise safety observation report", "kesin bir güvenlik gözlem bildirimini"),
  communicationOnly: true,
  steps: [
    listening(
      "safety-b2-1", "B2", "I can see liquid beside the marked walkway, but I can’t confirm where it came from. I’ve contacted the safety coordinator.", "İşaretli yürüme yolunun yanında sıvı görüyorum ancak nereden geldiğini doğrulayamıyorum. Güvenlik koordinatörüyle iletişime geçtim.",
      "Which report is accurate?", "Hangi bildirim doğrudur?", "There is an observed spill; its source is unknown and safety has been contacted.", ["A leaking pipe has been confirmed.", "The spill has already been cleaned.", "The area is confirmed safe for entry."], ["safety-spill", "safety-leak"], "",
      "The speaker reports only what is visible and avoids guessing the source.", "Konuşmacı yalnızca görüneni bildiriyor ve kaynak hakkında tahmin yürütmüyor.",
    ),
    dialogueChoice(
      "safety-b2-2", "B2", "Sam: Can you describe exactly what you observed?", "Sam: Tam olarak ne gözlemlediğini anlatabilir misin?",
      "I noticed a small spill beside the marked walkway; I can’t confirm the source.", ["There is definitely a serious leak.", "Something dangerous happened somewhere.", "The equipment must have failed."], ["safety-spill", "safety-leak", "safety-hazard"], "",
      "The answer separates a specific observation from an unconfirmed cause.", "Yanıt belirli bir gözlemi doğrulanmamış bir nedenden ayırır.",
    ),
    fillBlank(
      "safety-b2-3", "B2", "Please record this as an observation; we have not classified it as an ___ yet.", "Lütfen bunu gözlem olarak kaydedin; henüz olay olarak sınıflandırmadık.",
      "incident", ["agenda", "attachment", "output"], ["safety-incident"], "",
      "‘Incident’ is a classification; the sentence explicitly says that decision is pending.", "‘Incident’ bir sınıflandırmadır; cümle bu kararın beklediğini açıkça belirtir.",
    ),
    toneCheck(
      "safety-b2-4", "B2", "You need Sam to confirm the message you should relay to colleagues.", "İş arkadaşlarına ileteceğin mesajı Sam’in doğrulaması gerekiyor.",
      "Could you confirm exactly what you’d like me to tell the team?", ["Tell me what to say right now.", "I’ll make up a warning for everyone.", "Might the desired verbal formulation be supplied?"], ["safety-follow-instructions"], "",
      "The question requests precise wording from the responsible specialist.", "Soru, sorumlu uzmandan kesin mesajı ister.",
    ),
    roleplay(
      "safety-b2-5", "Give Aylin a concise, factual observation report.", "Aylin’e kısa ve gerçeklere dayalı bir gözlem bildirimi ver.",
      "aylin", "Area Coordinator", "Tell me what you saw, where it was and what remains unconfirmed.",
      "State the visible spill and location, say the source is unknown and mention that safety was contacted. Do not give cleanup or equipment instructions.",
      "I observed a small spill beside the marked walkway. I can’t confirm its source, and I have contacted the safety coordinator for guidance.",
      ["safety-spill", "safety-hazard", "safety-incident"],
    ),
    bossBattle(
      "safety-b2-6", "Relay a safety communication without adding assumptions or operational advice.", "Varsayım veya operasyon önerisi eklemeden bir güvenlik mesajını ilet.", "Signal Relay",
      [
        { id: "safety-b2-boss-1", phaseType: "listen", prompt: "Identify the instruction in the coordinator’s message.", ttsText: "Please tell the team that access is restricted until the safety review is complete. Do not speculate about the cause.", expectedAnswer: "Relay that access is restricted and do not speculate about the cause.", targetVocabularyIds: ["safety-restricted-area", "safety-hazard"] },
        { id: "safety-b2-boss-2", phaseType: "choose", prompt: "Choose the accurate relay message.", options: choices("safety-b2-boss-choice", "Safety has asked us to keep the area restricted while they review the observation.", ["The area is dangerous because equipment failed.", "Someone should fix the leak now.", "It would appear catastrophe is imminent."], "This relays the approved message without inventing a cause or action.", "Bu ifade neden veya eylem uydurmadan onaylı mesajı iletir."), expectedAnswer: "Safety has asked us to keep the area restricted while they review the observation.", targetVocabularyIds: ["safety-restricted-area", "safety-incident"] },
        { id: "safety-b2-boss-3", phaseType: "summarize", prompt: "Write a factual log summary of the communication.", expectedAnswer: "A spill was observed beside the walkway; the source is unconfirmed, safety was contacted and the access message was relayed.", targetVocabularyIds: ["safety-spill", "safety-incident"] },
      ], ["safety-spill", "safety-leak", "safety-incident", "safety-hazard"],
    ),
  ],
};

const careerIntroductionB1: Scenario = {
  ...scenarioMeta(
    "career-team-introduction-b1", "Meet the Team", "Ekiple Tanışma", "B1", "career", 11,
    ["career-introduce", "career-internship", "career-responsibility", "career-lunch-break", "career-teamwork", "career-congratulate"],
    "Introduce yourself, describe a simple internship task and join friendly workplace small talk.",
    "Kendini tanıt, basit bir staj görevini anlat ve arkadaşça iş yeri sohbetine katıl.",
  ),
  location: "training-center",
  characters: careerCharacters,
  evaluation: evaluation("a friendly professional introduction", "arkadaşça ve profesyonel bir tanışmayı"),
  steps: [
    dialogueChoice(
      "career-b1-1", "B1", "James: Welcome to the team! Tell us a little about yourself.", "James: Ekibe hoş geldin! Bize biraz kendinden söz et.",
      "Thanks! I’m a graduate engineer, and I’m interested in production and quality.", ["I am engineer. Give me work.", "Myself graduate and quality."], ["career-introduce"],
      "Teşekkür et, rolünü ve ilgi alanını kısa biçimde söyle.", "The introduction is brief, friendly and relevant to work.", "Tanıtım kısa, arkadaşça ve işle ilgilidir.",
    ),
    fillBlank(
      "career-b1-2", "B1", "I completed an ___ in a quality laboratory.", "Bir kalite laboratuvarında staj yaptım.",
      "internship", ["attachment", "agenda"], ["career-internship"], "Geçici iş deneyimi anlamındaki kelimeyi seç.",
      "‘Internship’ describes a period of practical work experience.", "‘Internship’ uygulamalı iş deneyimi dönemini anlatır.",
    ),
    listening(
      "career-b1-3", "B1", "My main responsibility was preparing a short weekly summary for the team.", "Temel sorumluluğum ekip için kısa bir haftalık özet hazırlamaktı.",
      "What did the speaker do?", "Konuşmacı ne yaptı?", "Prepared a weekly team summary.", ["Managed the whole laboratory.", "Organized daily interviews."], ["career-responsibility"],
      "‘Main responsibility’ sonrasında gelen göreve odaklan.", "The speaker names one specific responsibility.", "Konuşmacı tek bir belirli sorumluluk anlatıyor.",
    ),
    matching(
      "career-b1-4", "B1", "Match the social and career expressions.", "Sosyal ve kariyer ifadelerini eşleştir.",
      [
        { id: "career-b1-p1", left: "internship", right: "staj" },
        { id: "career-b1-p2", left: "teamwork", right: "takım çalışması" },
        { id: "career-b1-p3", left: "lunch break", right: "öğle arası" },
      ], ["career-internship", "career-teamwork", "career-lunch-break"], "‘Team’ ekip, ‘lunch’ öğle yemeği demektir.",
    ),
    sentenceBuilder(
      "career-b1-5", "B1", "Invite your colleague to lunch.", "İş arkadaşını öğle yemeğine davet et.",
      "Would you like to join us for lunch?", ["career-lunch-break"], "‘Would you like...?’ ile kibar davet yap.",
      "‘Would you like to...?’ is a friendly, low-pressure invitation.", "‘Would you like to...?’ arkadaşça ve baskısız bir davettir.",
    ),
    quickResponse(
      "career-b1-6", "B1", "James: I just finished my first big project!", "James: İlk büyük projemi az önce bitirdim!",
      "Congratulations! That’s a great achievement.", ["Finally you finished.", "Why did it take so long?"], ["career-congratulate", "career-achievement"],
      "Önce tebrik et, sonra başarıyı olumlu değerlendir.", "This response warmly recognizes the colleague’s achievement.", "Bu yanıt iş arkadaşının başarısını içtenlikle takdir eder.",
    ),
  ],
};

const careerInterviewB2: Scenario = {
  ...scenarioMeta(
    "career-interview-follow-up-b2", "Interview Signal", "Mülakat Sinyali", "B2", "career", 12,
    ["career-strength", "career-development-area", "career-hands-on-experience", "career-achievement", "career-problem-solving", "career-phone-call"],
    "Frame your experience with evidence, discuss a development area and handle a professional follow-up call.",
    "Deneyimini kanıtlarla anlat, bir gelişim alanını tartış ve profesyonel takip görüşmesini yürüt.",
  ),
  location: "training-center",
  characters: careerCharacters,
  evaluation: evaluation("an evidence-based interview conversation", "kanıta dayalı bir mülakat görüşmesini"),
  steps: [
    listening(
      "career-b2-1", "B2", "Rather than listing every course you took, choose one example that shows how you approached a problem and what the team achieved.", "Aldığın her dersi sıralamak yerine bir probleme nasıl yaklaştığını ve ekibin ne başardığını gösteren tek bir örnek seç.",
      "What advice is Riley giving?", "Riley ne öneriyor?", "Use one concrete example that demonstrates problem-solving and results.", ["Describe every technical course in detail.", "Avoid mentioning teamwork.", "Only state personal qualities without evidence."], ["career-problem-solving", "career-achievement"], "",
      "The advice prioritizes a specific example over a list of claims.", "Öneri, iddia listesinden çok belirli bir örneğe öncelik veriyor.",
    ),
    toneCheck(
      "career-b2-2", "B2", "The interviewer asks about a weakness. Frame it as an honest development area.", "Görüşmeci zayıf yönünü soruyor. Bunu dürüst bir gelişim alanı olarak anlat.",
      "Presenting to large groups is a development area, so I’ve been volunteering for short project updates to improve.", ["I have no weaknesses relevant to this role.", "Public speaking is terrible and I avoid it.", "My perfectionism is simply too exceptional."], ["career-development-area"], "",
      "The response is honest and includes a concrete improvement action.", "Yanıt dürüsttür ve somut bir gelişim eylemi içerir.",
    ),
    fillBlank(
      "career-b2-3", "B2", "My internship gave me ___ with laboratory documentation.", "Stajım bana laboratuvar dokümantasyonu konusunda uygulamalı deneyim kazandırdı.",
      "hands-on experience", ["a hands experience", "practical agenda", "direct output"], ["career-hands-on-experience", "career-internship"], "",
      "‘Hands-on experience’ means practical experience gained by doing the work.", "‘Hands-on experience’ işi yaparak kazanılan uygulamalı deneyim demektir.",
    ),
    sentenceBuilder(
      "career-b2-4", "B2", "Connect a strength to a workplace example.", "Güçlü yönünü bir iş yeri örneğine bağla.",
      "One of my strengths is turning complex updates into clear summaries.", ["career-strength", "meeting-summarize"], "",
      "A credible strength is specific enough to be supported with an example.", "İnandırıcı bir güçlü yön, örnekle desteklenebilecek kadar belirgindir.",
    ),
    roleplay(
      "career-b2-5", "Answer Riley’s behavioural interview question.", "Riley’nin davranışsal mülakat sorusunu yanıtla.",
      "riley", "HR Specialist", "Tell me about a time you helped your team solve a problem.",
      "Give a short situation, explain your contribution and state the result without exaggerating your responsibility.",
      "During my internship, our weekly data was difficult to compare. I suggested a shared summary format and checked it with my supervisor. The team then prepared updates more consistently.",
      ["career-problem-solving", "career-teamwork", "career-achievement"],
    ),
    bossBattle(
      "career-b2-6", "Handle a professional follow-up call after the interview.", "Mülakat sonrasında profesyonel takip görüşmesini yürüt.", "Call Quest",
      [
        { id: "career-b2-boss-1", phaseType: "listen", prompt: "Identify the caller’s purpose.", ttsText: "I’m calling to thank you for the interview and to confirm when you expect to share an update.", expectedAnswer: "To thank the interviewer and ask about the update timeline.", targetVocabularyIds: ["career-phone-call", "office-follow-up"] },
        { id: "career-b2-boss-2", phaseType: "choose", prompt: "Ask for Riley professionally.", options: choices("career-b2-boss-choice", "Could I speak to Riley regarding yesterday’s interview, please?", ["Put Riley on the phone.", "Is Riley there or not?", "Might Riley’s telephonic presence be procured?"], "This identifies the person and purpose politely.", "Bu ifade kişiyi ve amacı kibarca belirtir."), expectedAnswer: "Could I speak to Riley regarding yesterday’s interview, please?", targetVocabularyIds: ["career-phone-call"] },
        { id: "career-b2-boss-3", phaseType: "summarize", prompt: "Leave a concise message if Riley is unavailable.", expectedAnswer: "Please tell Riley that I called to thank her for the interview and ask about the expected update timeline.", targetVocabularyIds: ["career-leave-message", "office-get-back"] },
      ], ["career-phone-call", "career-achievement", "career-strength", "career-problem-solving"],
    ),
  ],
};

/**
 * Exactly twelve seed missions: one guided B1 and one nuanced B2 mission for
 * every category. B1 missions use three-option questions and Turkish hints;
 * B2 missions use four close options, open roleplay and multi-phase bosses.
 */
export const scenarios: Scenario[] = [
  officeHelpB1,
  officePrioritiesB2,
  productionShiftB1,
  productionDelayB2,
  meetingActionItemsB1,
  meetingTimelineB2,
  missingDocumentB1,
  qualityDiscrepancyB2,
  safetyReminderB1,
  safetyReportB2,
  careerIntroductionB1,
  careerInterviewB2,
];

export const seedScenarios = scenarios;
export const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

export const getScenarioById = (id: string): Scenario | undefined => scenarioById.get(id);

export const getScenariosByCategory = (category: ScenarioCategory): Scenario[] =>
  scenarios.filter((scenario) => scenario.category === category);

export const getScenariosByLevel = (level: CEFRLevel): Scenario[] =>
  scenarios.filter((scenario) => scenario.level === level);

export const getAvailableScenarios = (
  level: CEFRLevel,
  totalXp: number,
  completedScenarioIds: string[],
): Scenario[] =>
  scenarios.filter(
    (scenario) =>
      scenario.level === level &&
      scenario.unlock.requiredXp <= totalXp &&
      scenario.unlock.requiredScenarioIds.every((id) => completedScenarioIds.includes(id)),
  );

export const scenarioCategoryCounts: Record<ScenarioCategory, number> = scenarios.reduce(
  (counts, scenario) => ({ ...counts, [scenario.category]: counts[scenario.category] + 1 }),
  { office: 0, production: 0, meeting: 0, quality: 0, safety: 0, career: 0 },
);

/** Resolves a step without widening its discriminated union. */
export const getScenarioStep = (scenarioId: string, stepId: string): ScenarioStep | undefined =>
  getScenarioById(scenarioId)?.steps.find((step) => step.id === stepId);
