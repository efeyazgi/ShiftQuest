import type { ScenarioCategory, VocabularyItem } from "@/types";

import {
  generatedScenarioSchema,
  type FeedbackInput,
  type FeedbackResult,
  type GeneratedScenario,
  type LLMProvider,
  type RoleplayInput,
  type RoleplayResult,
  type ScenarioGenerationInput,
} from "./contracts";

type VocabularySeed = Pick<
  VocabularyItem,
  | "term"
  | "meaningTr"
  | "partOfSpeech"
  | "ipa"
  | "pronunciationTr"
  | "exampleEn"
  | "exampleTr"
>;

type CategoryKit = {
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  location: GeneratedScenario["location"];
  character: {
    name: string;
    role: string;
    roleTr: string;
  };
  openingLine: string;
  openingLineTr: string;
  vocabulary: VocabularySeed[];
};

const CATEGORY_KITS: Record<ScenarioCategory, CategoryKit> = {
  office: {
    title: "The Priority Update",
    titleTr: "Öncelik Güncellemesi",
    description:
      "Clarify priorities and give a concise progress update to a colleague.",
    descriptionTr:
      "Öncelikleri netleştir ve bir çalışma arkadaşına kısa bir ilerleme bilgisi ver.",
    location: "office-hub",
    character: {
      name: "Maya",
      role: "Project coordinator",
      roleTr: "Proje koordinatörü",
    },
    openingLine: "Can you give me a quick update before the team meeting?",
    openingLineTr: "Ekip toplantısından önce bana kısa bir bilgi verebilir misin?",
    vocabulary: [
      {
        term: "keep you updated",
        meaningTr: "seni gelişmelerden haberdar etmek",
        partOfSpeech: "phrase",
        ipa: "/kiːp juː ʌpˈdeɪtɪd/",
        pronunciationTr: "kiip yu apdeytıd",
        exampleEn: "I’ll keep you updated as the task progresses.",
        exampleTr: "Görev ilerledikçe seni bilgilendireceğim.",
      },
      {
        term: "double-check",
        meaningTr: "tekrar kontrol etmek",
        partOfSpeech: "verb",
        ipa: "/ˌdʌbəl ˈtʃek/",
        pronunciationTr: "dabıl çek",
        exampleEn: "Let me double-check the latest version.",
        exampleTr: "En son sürümü tekrar kontrol edeyim.",
      },
      {
        term: "meet the deadline",
        meaningTr: "son teslim tarihine yetişmek",
        partOfSpeech: "phrase",
        ipa: "/miːt ðə ˈdedlaɪn/",
        pronunciationTr: "miit dı dedlayn",
        exampleEn: "We are on track to meet the deadline.",
        exampleTr: "Son teslim tarihine yetişme yolundayız.",
      },
      {
        term: "follow up",
        meaningTr: "takibini yapmak",
        partOfSpeech: "phrasal verb",
        ipa: "/ˈfɒləʊ ʌp/",
        pronunciationTr: "falov ap",
        exampleEn: "I’ll follow up with the design team this afternoon.",
        exampleTr: "Bu öğleden sonra tasarım ekibiyle konuyu takip edeceğim.",
      },
      {
        term: "current priority",
        meaningTr: "mevcut öncelik",
        partOfSpeech: "phrase",
        ipa: "/ˈkʌrənt praɪˈɒrəti/",
        pronunciationTr: "karınt prayorıti",
        exampleEn: "Could you confirm the current priority for me?",
        exampleTr: "Benim için mevcut önceliği teyit eder misin?",
      },
    ],
  },
  production: {
    title: "A Clear Shift Handover",
    titleTr: "Net Bir Vardiya Teslimi",
    description:
      "Exchange status information during a shift handover without giving operating instructions.",
    descriptionTr:
      "Operasyon talimatı vermeden vardiya tesliminde durum bilgisi paylaş.",
    location: "production-floor",
    character: {
      name: "Daniel",
      role: "Shift supervisor",
      roleTr: "Vardiya sorumlusu",
    },
    openingLine: "Before you leave, is there anything the next shift should know?",
    openingLineTr: "Ayrılmadan önce sonraki vardiyanın bilmesi gereken bir şey var mı?",
    vocabulary: [
      {
        term: "shift handover",
        meaningTr: "vardiya teslimi",
        partOfSpeech: "phrase",
        ipa: "/ʃɪft ˈhændəʊvə/",
        pronunciationTr: "şift hendovır",
        exampleEn: "I added the latest status to the shift handover note.",
        exampleTr: "Son durumu vardiya teslim notuna ekledim.",
      },
      {
        term: "slightly behind schedule",
        meaningTr: "programın biraz gerisinde",
        partOfSpeech: "phrase",
        ipa: "/ˈslaɪtli bɪˈhaɪnd ˈʃedjuːl/",
        pronunciationTr: "slaytli bihaynd şedyul",
        exampleEn: "The team is slightly behind schedule today.",
        exampleTr: "Ekip bugün programın biraz gerisinde.",
      },
      {
        term: "current status",
        meaningTr: "mevcut durum",
        partOfSpeech: "phrase",
        ipa: "/ˈkʌrənt ˈsteɪtəs/",
        pronunciationTr: "karınt steytıs",
        exampleEn: "Could you confirm the current status of the order?",
        exampleTr: "Siparişin mevcut durumunu teyit eder misin?",
      },
      {
        term: "major issue",
        meaningTr: "önemli sorun",
        partOfSpeech: "phrase",
        ipa: "/ˈmeɪdʒə ˈɪʃuː/",
        pronunciationTr: "meycır işu",
        exampleEn: "The shift ended without any major issues.",
        exampleTr: "Vardiya önemli bir sorun olmadan sona erdi.",
      },
      {
        term: "check with the supervisor",
        meaningTr: "sorumluya danışmak",
        partOfSpeech: "phrase",
        ipa: "/tʃek wɪð ðə ˈsuːpəvaɪzə/",
        pronunciationTr: "çek wid dı supırvayzır",
        exampleEn: "I’ll check with the supervisor and get back to you.",
        exampleTr: "Sorumluya danışıp sana geri döneceğim.",
      },
    ],
  },
  meeting: {
    title: "Action Items in Focus",
    titleTr: "Aksiyon Maddeleri Gündemde",
    description:
      "Ask for clarification, share an opinion, and confirm meeting actions.",
    descriptionTr:
      "Açıklama iste, görüşünü paylaş ve toplantı aksiyonlarını teyit et.",
    location: "meeting-room",
    character: {
      name: "Olivia",
      role: "Project manager",
      roleTr: "Proje yöneticisi",
    },
    openingLine: "Let’s make sure everyone understands the next steps.",
    openingLineTr: "Herkesin sonraki adımları anladığından emin olalım.",
    vocabulary: [
      {
        term: "clarify",
        meaningTr: "netleştirmek, açıklamak",
        partOfSpeech: "verb",
        ipa: "/ˈklærɪfaɪ/",
        pronunciationTr: "klerıfay",
        exampleEn: "Could you clarify what you mean by urgent?",
        exampleTr: "Acil derken neyi kastettiğini açıklayabilir misin?",
      },
      {
        term: "action item",
        meaningTr: "aksiyon maddesi",
        partOfSpeech: "phrase",
        ipa: "/ˈækʃən ˌaɪtəm/",
        pronunciationTr: "ekşın aytım",
        exampleEn: "I’ll add that as an action item.",
        exampleTr: "Bunu bir aksiyon maddesi olarak ekleyeceğim.",
      },
      {
        term: "go over",
        meaningTr: "gözden geçirmek",
        partOfSpeech: "phrasal verb",
        ipa: "/ɡəʊ ˈəʊvə/",
        pronunciationTr: "gov ovır",
        exampleEn: "Let’s go over the main points once more.",
        exampleTr: "Ana noktaları bir kez daha gözden geçirelim.",
      },
      {
        term: "from my perspective",
        meaningTr: "benim bakış açıma göre",
        partOfSpeech: "phrase",
        ipa: "/frəm maɪ pəˈspektɪv/",
        pronunciationTr: "from may pörspektiv",
        exampleEn: "From my perspective, the second option is clearer.",
        exampleTr: "Benim bakış açıma göre ikinci seçenek daha net.",
      },
      {
        term: "summarize",
        meaningTr: "özetlemek",
        partOfSpeech: "verb",
        ipa: "/ˈsʌməraɪz/",
        pronunciationTr: "samırayz",
        exampleEn: "Could I briefly summarize what we agreed?",
        exampleTr: "Üzerinde anlaştıklarımızı kısaca özetleyebilir miyim?",
      },
    ],
  },
  quality: {
    title: "The Missing Document",
    titleTr: "Eksik Belge",
    description:
      "Discuss a missing production document and request a quality review politely.",
    descriptionTr:
      "Eksik bir üretim belgesini konuş ve kibarca kalite incelemesi iste.",
    location: "quality-lab",
    character: {
      name: "Aylin",
      role: "Quality specialist",
      roleTr: "Kalite uzmanı",
    },
    openingLine: "The latest production document is not in the shared folder.",
    openingLineTr: "Son üretim belgesi ortak klasörde yok.",
    vocabulary: [
      {
        term: "missing document",
        meaningTr: "eksik belge",
        partOfSpeech: "phrase",
        ipa: "/ˈmɪsɪŋ ˈdɒkjəmənt/",
        pronunciationTr: "mising dokyument",
        exampleEn: "Could you help me check the missing document?",
        exampleTr: "Eksik belgeyi kontrol etmeme yardımcı olabilir misin?",
      },
      {
        term: "under review",
        meaningTr: "inceleme altında",
        partOfSpeech: "phrase",
        ipa: "/ˈʌndə rɪˈvjuː/",
        pronunciationTr: "andır rivyu",
        exampleEn: "The document is still under review.",
        exampleTr: "Belge hâlâ inceleme altında.",
      },
      {
        term: "quality approval",
        meaningTr: "kalite onayı",
        partOfSpeech: "phrase",
        ipa: "/ˈkwɒləti əˈpruːvəl/",
        pronunciationTr: "kuolıti apruvıl",
        exampleEn: "We may need quality approval before the update.",
        exampleTr: "Güncellemeden önce kalite onayı gerekebilir.",
      },
      {
        term: "necessary changes",
        meaningTr: "gerekli değişiklikler",
        partOfSpeech: "phrase",
        ipa: "/ˈnesəsəri ˈtʃeɪndʒɪz/",
        pronunciationTr: "nesıseri çeyncız",
        exampleEn: "I’ll make the necessary changes after the review.",
        exampleTr: "İncelemeden sonra gerekli değişiklikleri yapacağım.",
      },
      {
        term: "according to the procedure",
        meaningTr: "prosedüre göre",
        partOfSpeech: "phrase",
        ipa: "/əˈkɔːdɪŋ tə ðə prəˈsiːdʒə/",
        pronunciationTr: "akording tı dı prosicır",
        exampleEn: "According to the procedure, the form needs a review.",
        exampleTr: "Prosedüre göre formun incelenmesi gerekiyor.",
      },
    ],
  },
  safety: {
    title: "Report It Clearly",
    titleTr: "Durumu Net Bildir",
    description:
      "Use clear safety communication and refer the situation to authorized staff.",
    descriptionTr:
      "Net güvenlik iletişimi kullan ve durumu yetkili personele bildir.",
    location: "safety-zone",
    character: {
      name: "Marcus",
      role: "Safety coordinator",
      roleTr: "İş güvenliği koordinatörü",
    },
    openingLine: "Thanks for stopping and reporting what you noticed.",
    openingLineTr: "Durup fark ettiğin şeyi bildirdiğin için teşekkürler.",
    vocabulary: [
      {
        term: "unsafe condition",
        meaningTr: "güvensiz durum",
        partOfSpeech: "phrase",
        ipa: "/ʌnˈseɪf kənˈdɪʃən/",
        pronunciationTr: "anseyf kondişın",
        exampleEn: "I’d like to report a possible unsafe condition.",
        exampleTr: "Olası bir güvensiz durumu bildirmek istiyorum.",
      },
      {
        term: "keep a safe distance",
        meaningTr: "güvenli mesafeyi korumak",
        partOfSpeech: "phrase",
        ipa: "/kiːp ə seɪf ˈdɪstəns/",
        pronunciationTr: "kiip ı seyf distıns",
        exampleEn: "Please keep a safe distance while we inform the safety team.",
        exampleTr: "Güvenlik ekibine haber verirken lütfen güvenli mesafeyi koru.",
      },
      {
        term: "warning sign",
        meaningTr: "uyarı levhası",
        partOfSpeech: "phrase",
        ipa: "/ˈwɔːnɪŋ saɪn/",
        pronunciationTr: "vorning sayn",
        exampleEn: "I noticed that the warning sign was difficult to see.",
        exampleTr: "Uyarı levhasının görülmesinin zor olduğunu fark ettim.",
      },
      {
        term: "inform the safety team",
        meaningTr: "güvenlik ekibine bilgi vermek",
        partOfSpeech: "phrase",
        ipa: "/ɪnˈfɔːm ðə ˈseɪfti tiːm/",
        pronunciationTr: "inform dı seyfti tiim",
        exampleEn: "I’ll inform the safety team right away.",
        exampleTr: "Güvenlik ekibine hemen bilgi vereceğim.",
      },
      {
        term: "thanks for pointing that out",
        meaningTr: "bunu belirttiğin için teşekkürler",
        partOfSpeech: "phrase",
        ipa: "/θæŋks fə ˈpɔɪntɪŋ ðæt aʊt/",
        pronunciationTr: "tenks for pointing det aut",
        exampleEn: "Thanks for pointing that out; I’ll report it now.",
        exampleTr: "Bunu belirttiğin için teşekkürler; şimdi bildireceğim.",
      },
    ],
  },
  career: {
    title: "A Professional Introduction",
    titleTr: "Profesyonel Bir Tanışma",
    description:
      "Introduce your experience and keep a workplace conversation moving naturally.",
    descriptionTr:
      "Deneyimini tanıt ve iş yeri sohbetini doğal biçimde sürdür.",
    location: "training-center",
    character: {
      name: "Sophie",
      role: "HR specialist",
      roleTr: "İnsan kaynakları uzmanı",
    },
    openingLine: "It’s nice to meet you. Could you tell me about yourself?",
    openingLineTr: "Tanıştığımıza memnun oldum. Biraz kendinden bahseder misin?",
    vocabulary: [
      {
        term: "be responsible for",
        meaningTr: "bir şeyden sorumlu olmak",
        partOfSpeech: "phrase",
        ipa: "/bi rɪˈspɒnsəbəl fɔː/",
        pronunciationTr: "bi risponsıbıl for",
        exampleEn: "I was responsible for organizing the project notes.",
        exampleTr: "Proje notlarını düzenlemekten sorumluydum.",
      },
      {
        term: "hands-on experience",
        meaningTr: "uygulamalı deneyim",
        partOfSpeech: "phrase",
        ipa: "/ˌhændz ɒn ɪkˈspɪəriəns/",
        pronunciationTr: "hendz on ikspiryıns",
        exampleEn: "My internship gave me useful hands-on experience.",
        exampleTr: "Stajım bana faydalı uygulamalı deneyim kazandırdı.",
      },
      {
        term: "work well with",
        meaningTr: "biriyle iyi çalışmak",
        partOfSpeech: "phrase",
        ipa: "/wɜːk wel wɪð/",
        pronunciationTr: "vörk vel wid",
        exampleEn: "I work well with people from different teams.",
        exampleTr: "Farklı ekiplerden kişilerle iyi çalışırım.",
      },
      {
        term: "looking forward to",
        meaningTr: "sabırsızlıkla beklemek",
        partOfSpeech: "phrase",
        ipa: "/ˈlʊkɪŋ ˈfɔːwəd tuː/",
        pronunciationTr: "luking forvırd tu",
        exampleEn: "I’m looking forward to learning more about the role.",
        exampleTr: "Rol hakkında daha fazla şey öğrenmeyi sabırsızlıkla bekliyorum.",
      },
      {
        term: "get back to you",
        meaningTr: "sana geri dönmek",
        partOfSpeech: "phrase",
        ipa: "/ɡet bæk tə juː/",
        pronunciationTr: "get bek tı yu",
        exampleEn: "I’ll check my schedule and get back to you shortly.",
        exampleTr: "Programımı kontrol edip kısa süre içinde sana döneceğim.",
      },
    ],
  },
};

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function chooseCategory(input: ScenarioGenerationInput): ScenarioCategory {
  if (input.category) return input.category;
  const categories = Object.keys(CATEGORY_KITS) as ScenarioCategory[];
  const index = stableHash(`${input.level}:${input.weakVocabulary.join("|")}`) % categories.length;
  return categories[index] ?? "office";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sentenceCase(message: string): string {
  const compact = message.trim().replace(/\s+/g, " ");
  if (!compact) return "Could you clarify that, please?";
  const capitalized = compact[0]!.toUpperCase() + compact.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function buildCorrection(message: string): string {
  const normalized = sentenceCase(message);
  const directCommand = /^(send|give|tell|check|fix|do|update|explain)\b/i.exec(
    message.trim(),
  );
  if (!directCommand) return normalized;

  let request = normalized
    .replace(/[.!?]+$/, "")
    .replace(/\bplease\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  request = request.replace(
    /^(send me|check|update|review|fix) (report|document|file|draft|form|record|attachment)\b/,
    "$1 the $2",
  );
  return `Could you ${request}, please?`;
}

export class MockLLMProvider implements LLMProvider {
  readonly id = "deterministic-mock";
  readonly kind = "mock" as const;

  async testConnection(): Promise<void> {
    return Promise.resolve();
  }

  async generateScenario(
    input: ScenarioGenerationInput,
  ): Promise<GeneratedScenario> {
    const category = chooseCategory(input);
    const kit = CATEGORY_KITS[category];
    const variant = stableHash(JSON.stringify(input)).toString(36).slice(0, 7);
    const scenarioId = `generated-${category}-${input.level.toLowerCase()}-${variant}`;
    const characterId = `${scenarioId}-character`;

    const weakVocabulary = new Set(
      input.weakVocabulary.map((term) => term.trim().toLowerCase()),
    );
    const orderedVocabulary = [...kit.vocabulary].sort(
      (left, right) =>
        Number(weakVocabulary.has(right.term.toLowerCase())) -
        Number(weakVocabulary.has(left.term.toLowerCase())),
    );
    const vocabulary = orderedVocabulary.map((item, index) => ({
      ...item,
      id: `${scenarioId}-vocab-${index + 1}-${slugify(item.term)}`,
      category,
      level: input.level,
      tags: [category, "generated", input.level.toLowerCase()],
      audioText: item.term,
    }));

    const steps = vocabulary.map((item, index) => {
      const correctOptionId = `${scenarioId}-step-${index + 1}-correct`;
      return {
        id: `${scenarioId}-step-${index + 1}`,
        type: "dialogue-choice" as const,
        title: `Professional response ${index + 1}`,
        instructionEn: `Choose the most natural professional sentence using “${item.term}”.`,
        instructionTr: `“${item.term}” ifadesini kullanan en doğal profesyonel cümleyi seç.`,
        prompt: `What is the best response in this ${category} conversation?`,
        promptTr: `Bu ${category} konuşmasında en uygun yanıt hangisidir?`,
        dialogue: {
          speakerId: characterId,
          text: index === 0 ? kit.openingLine : "How would you communicate this clearly?",
          translationTr:
            index === 0
              ? kit.openingLineTr
              : "Bunu net bir şekilde nasıl ifade ederdin?",
          ttsText: index === 0 ? kit.openingLine : "How would you communicate this clearly?",
        },
        ttsText: item.exampleEn,
        xp: input.level === "B2" ? 28 : 22,
        targetVocabularyIds: [item.id],
        hint: {
          en: "Look for a clear sentence with a calm, collaborative tone.",
          tr:
            input.level === "B1"
              ? "Net, sakin ve iş birliğine açık cümleyi ara."
              : "Ton ve doğallık farkına dikkat et.",
        },
        explanationEn: `“${item.exampleEn}” is clear, natural, and suitable for workplace communication.`,
        explanationTr: `“${item.exampleEn}” net, doğal ve iş yeri iletişimine uygundur.`,
        options: [
          {
            id: correctOptionId,
            text: item.exampleEn,
            isCorrect: true,
            quality: "correct" as const,
            feedbackEn: "Natural, clear, and professional.",
            feedbackTr: "Doğal, net ve profesyonel.",
          },
          {
            id: `${scenarioId}-step-${index + 1}-direct`,
            text: "Do it now and tell me.",
            isCorrect: false,
            quality: "too-direct" as const,
            feedbackEn: "This sounds too direct for a collaborative workplace exchange.",
            feedbackTr: "Bu ifade iş birliğine dayalı bir iş yeri konuşması için fazla doğrudan.",
            naturalAlternative: item.exampleEn,
          },
          {
            id: `${scenarioId}-step-${index + 1}-unnatural`,
            text: "I am wanting the information for this situation.",
            isCorrect: false,
            quality: "unnatural" as const,
            feedbackEn: "The grammar and phrasing are not natural in this context.",
            feedbackTr: "Dil bilgisi ve ifade bu bağlamda doğal değil.",
            naturalAlternative: item.exampleEn,
          },
          ...(input.level === "B2"
            ? [
                {
                  id: `${scenarioId}-step-${index + 1}-formal`,
                  text:
                    "I would be most obliged if this matter could receive your immediate consideration.",
                  isCorrect: false,
                  quality: "too-formal" as const,
                  feedbackEn:
                    "This is grammatical, but it is unnecessarily formal for an everyday workplace exchange.",
                  feedbackTr:
                    "Bu cümle dil bilgisi açısından doğru ancak günlük iş iletişimi için gereksiz derecede resmî.",
                  naturalAlternative: item.exampleEn,
                },
              ]
            : []),
        ],
        correctOptionId,
      };
    });

    const generated = {
      id: scenarioId,
      slug: scenarioId,
      title: `${kit.title} · ${input.level}`,
      titleTr: kit.titleTr,
      descriptionEn: kit.description,
      descriptionTr: kit.descriptionTr,
      level: input.level,
      category,
      location: kit.location,
      estimatedMinutes: input.level === "B2" ? 8 : 6,
      characters: [
        {
          id: characterId,
          name: kit.character.name,
          role: kit.character.role,
          roleTr: kit.character.roleTr,
          avatar: "/avatars/mentor.svg",
          accent: category === "meeting" ? "british" : "american",
        },
      ],
      steps,
      targetVocabularyIds: vocabulary.map((item) => item.id),
      targetVocabulary: vocabulary,
      xpReward: input.level === "B2" ? 180 : 140,
      coinReward: input.level === "B2" ? 36 : 28,
      unlock: { requiredXp: 0, requiredScenarioIds: [] },
      evaluation: {
        successMessageEn: "Clear communication—your shift is complete.",
        successMessageTr: "Net iletişim—vardiyan tamamlandı.",
        reviewMessageEn: "Review the phrases once more, then try the mission again.",
        reviewMessageTr: "İfadeleri bir kez daha gözden geçirip görevi tekrar dene.",
        naturalExpressions: vocabulary.slice(0, 4).map((item) => item.exampleEn),
      },
      sortOrder: 9_000 + (stableHash(scenarioId) % 900),
      isBoss: false,
      communicationOnly: input.category === "safety",
    };

    return generatedScenarioSchema.parse(generated) as GeneratedScenario;
  }

  async evaluateFeedback(input: FeedbackInput): Promise<FeedbackResult> {
    const message = input.message.trim();
    const words = message.match(/[A-Za-zÀ-ž'-]+/g) ?? [];
    const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
    const startsWithCapital = /^[A-Z]/.test(message);
    const endsWithPunctuation = /[.!?]$/.test(message);
    const containsCommonVerb = /\b(am|is|are|was|were|be|have|has|do|need|can|could|would|will|should|check|update|review|confirm|clarify)\b/i.test(
      message,
    );
    const polite = /\b(please|could you|would you|thank|thanks|may i|could i)\b/i.test(
      message,
    );
    const workplacePhrase = /\b(update|review|deadline|priority|follow up|clarify|confirm|team|document|schedule|procedure|supervisor)\b/i.test(
      message,
    );
    const collaborative =
      polite ||
      /\b(keep\s+(you|them|the team)\s+updated|get back to you|let me|i(?:'|’)ll check|i will check)\b/i.test(
        message,
      );
    const directCommand = /^(send|give|tell|check|fix|do|update)\b/i.test(message);
    const usefulLength = words.length >= 4 && words.length <= 45;

    const grammar = clampScore(
      48 + (startsWithCapital ? 14 : 0) + (endsWithPunctuation ? 12 : 0) +
        (containsCommonVerb ? 20 : 0) + (usefulLength ? 6 : 0),
    );
    const vocabulary = clampScore(
      48 + Math.min(26, uniqueWords.size * 2) + (workplacePhrase ? 16 : 0) +
        (input.level === "B2" && words.length > 10 ? 6 : 0),
    );
    const naturalness = clampScore(
      57 + (usefulLength ? 18 : 0) + (collaborative ? 12 : 0) -
        (directCommand ? 18 : 0),
    );
    const professionalTone = clampScore(
      55 + (collaborative ? 25 : 0) + (workplacePhrase ? 10 : 0) -
        (directCommand ? 24 : 0),
    );
    const clarity = clampScore(
      58 + (containsCommonVerb ? 16 : 0) + (usefulLength ? 18 : 0) -
        (words.length > 55 ? 20 : 0),
    );
    const correction = buildCorrection(message);
    const changed = correction !== message;

    return {
      grammar,
      vocabulary,
      naturalness,
      professionalTone,
      clarity,
      summary:
        professionalTone >= 75
          ? "Your response is clear and appropriately professional. Check the suggested version for a small polish."
          : "Your meaning is understandable. A softer request form would sound more collaborative at work.",
      corrections: changed
        ? [
            {
              original: message,
              suggestion: correction,
              reason: directCommand
                ? "A polite request is more collaborative than a direct command."
                : "Capitalization and punctuation make the message easier to read.",
            },
          ]
        : [],
      correction,
      strengths: [
        ...(containsCommonVerb ? ["The main action is easy to identify."] : []),
        ...(workplacePhrase ? ["You used relevant workplace vocabulary."] : []),
      ].slice(0, 4),
    };
  }

  async continueRoleplay(input: RoleplayInput): Promise<RoleplayResult> {
    const feedback = await this.evaluateFeedback(input);
    const role = input.role?.trim() || "team colleague";
    const sessionComplete = input.history.length >= 5;
    const reply = sessionComplete
      ? `Thanks, that is clear. I’ll note the update and follow up with the relevant team.`
      : `Thanks for the update. As your ${role}, I’d like to understand the next communication step. Who should we keep updated?`;

    return {
      reply,
      feedback,
      suggestedPhrases: [
        "I’ll keep the relevant team updated.",
        "Could you clarify the next step?",
        "Let me double-check and get back to you.",
      ],
      sessionComplete,
    };
  }
}
