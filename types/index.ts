/** Shared domain contracts for ShiftQuest's static and persisted data. */

export type CEFRLevel = "B1" | "B2";
export type AccentPreference = "american" | "british";
export type CareerArea =
  | "general"
  | "production"
  | "process"
  | "quality"
  | "laboratory"
  | "pharma";

export type ScenarioCategory =
  | "office"
  | "production"
  | "meeting"
  | "quality"
  | "safety"
  | "career";

export type CampusLocation =
  | "office-hub"
  | "production-floor"
  | "control-room"
  | "quality-lab"
  | "meeting-room"
  | "safety-zone"
  | "maintenance-area"
  | "training-center";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "phrase"
  | "phrasal verb"
  | "idiom";

export interface VocabularyItem {
  id: string;
  term: string;
  meaningTr: string;
  partOfSpeech: PartOfSpeech;
  ipa: string;
  pronunciationTr: string;
  exampleEn: string;
  exampleTr: string;
  category: ScenarioCategory | "general";
  level: CEFRLevel;
  tags: string[];
  audioText?: string;
}

export interface ScenarioCharacter {
  id: string;
  name: string;
  role: string;
  roleTr: string;
  avatar: string;
  accent: AccentPreference;
}

export interface DialogueLine {
  speakerId: string;
  text: string;
  translationTr: string;
  ttsText: string;
}

export interface StepHint {
  en: string;
  tr?: string;
}

export interface BaseScenarioStep {
  id: string;
  type: ScenarioStepType;
  title: string;
  instructionEn: string;
  instructionTr: string;
  prompt: string;
  promptTr?: string;
  dialogue?: DialogueLine;
  ttsText?: string;
  xp: number;
  targetVocabularyIds: string[];
  hint: StepHint;
  explanationEn: string;
  explanationTr: string;
}

export type ChoiceQuality =
  | "correct"
  | "grammar-error"
  | "too-direct"
  | "too-formal"
  | "unnatural"
  | "off-topic";

export interface ChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
  quality: ChoiceQuality;
  feedbackEn: string;
  feedbackTr: string;
  naturalAlternative?: string;
}

export interface DialogueChoiceStep extends BaseScenarioStep {
  type: "dialogue-choice";
  options: ChoiceOption[];
  correctOptionId: string;
}

export interface SentenceBuilderStep extends BaseScenarioStep {
  type: "sentence-builder";
  tokens: string[];
  correctOrder: string[];
  acceptedAnswers: string[];
  punctuation?: string;
}

export interface FillBlankStep extends BaseScenarioStep {
  type: "fill-blank";
  sentence: string;
  blankLabel: string;
  options: ChoiceOption[];
  correctOptionId: string;
}

export type ListeningTask = "select-sentence" | "missing-word" | "identify-intent";

export interface ListeningStep extends BaseScenarioStep {
  type: "listening";
  transcript: string;
  transcriptTr: string;
  accent: AccentPreference;
  playbackRate: 0.75 | 1 | 1.25;
  task: ListeningTask;
  options: ChoiceOption[];
  correctOptionId: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchingStep extends BaseScenarioStep {
  type: "matching";
  pairs: MatchingPair[];
  shuffleRight: boolean;
}

export type ProfessionalTone = "professional" | "friendly" | "direct" | "formal" | "rude";

export interface ToneOption extends ChoiceOption {
  tone: ProfessionalTone;
}

export interface ToneCheckStep extends BaseScenarioStep {
  type: "tone-check";
  context: string;
  options: ToneOption[];
  correctOptionId: string;
  desiredTone: ProfessionalTone;
}

export interface QuickResponseStep extends BaseScenarioStep {
  type: "quick-response";
  timeLimitSeconds: number;
  options: ChoiceOption[];
  correctOptionId: string;
  comboBonusXp: number;
}

export type PuzzleKind = "anagram" | "missing-letters" | "letter-chain" | "word-search";

export interface WordPuzzleStep extends BaseScenarioStep {
  type: "word-puzzle";
  puzzleKind: PuzzleKind;
  scrambled: string;
  answer: string;
  clueEn: string;
  clueTr: string;
  acceptedAnswers: string[];
}

export interface RoleplayCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;
}

export interface RoleplayStep extends BaseScenarioStep {
  type: "roleplay";
  characterId: string;
  characterRole: string;
  openingLine: string;
  userGoal: string;
  minimumWords: number;
  maximumWords: number;
  successCriteria: RoleplayCriterion[];
  sampleAnswer: string;
  mockFeedback: RoleplayFeedback;
}

export interface BossPhase {
  id: string;
  phaseType: "listen" | "choose" | "build" | "summarize";
  prompt: string;
  ttsText?: string;
  options?: ChoiceOption[];
  tokens?: string[];
  expectedAnswer: string;
  targetVocabularyIds: string[];
}

export interface BossBattleStep extends BaseScenarioStep {
  type: "boss-battle";
  bossName: string;
  phases: BossPhase[];
  minimumPhasesToPass: number;
  bonusXp: number;
}

export type ScenarioStepType =
  | "dialogue-choice"
  | "sentence-builder"
  | "fill-blank"
  | "listening"
  | "matching"
  | "tone-check"
  | "quick-response"
  | "word-puzzle"
  | "roleplay"
  | "boss-battle";

export type ScenarioStep =
  | DialogueChoiceStep
  | SentenceBuilderStep
  | FillBlankStep
  | ListeningStep
  | MatchingStep
  | ToneCheckStep
  | QuickResponseStep
  | WordPuzzleStep
  | RoleplayStep
  | BossBattleStep;

export interface ScenarioEvaluation {
  successMessageEn: string;
  successMessageTr: string;
  reviewMessageEn: string;
  reviewMessageTr: string;
  naturalExpressions: string[];
}

export interface ScenarioUnlockRule {
  requiredXp: number;
  requiredScenarioIds: string[];
  requiredTitleId?: string;
}

export interface Scenario {
  id: string;
  slug: string;
  title: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  level: CEFRLevel;
  category: ScenarioCategory;
  location: CampusLocation;
  estimatedMinutes: number;
  characters: ScenarioCharacter[];
  steps: ScenarioStep[];
  targetVocabularyIds: string[];
  xpReward: number;
  coinReward: number;
  unlock: ScenarioUnlockRule;
  evaluation: ScenarioEvaluation;
  sortOrder: number;
  isBoss: boolean;
  communicationOnly?: boolean;
}

export interface RoleplayFeedback {
  grammar: number;
  vocabulary: number;
  naturalness: number;
  professionalTone: number;
  clarity: number;
  summary: string;
  corrections: Array<{ original: string; suggestion: string; reason: string }>;
}

export type AchievementKind =
  | "scenario"
  | "accuracy"
  | "streak"
  | "vocabulary"
  | "category"
  | "no-hint"
  | "speed"
  | "roleplay";

export interface AchievementRequirement {
  metric: string;
  operator: "gte" | "eq" | "lte";
  value: number;
  category?: ScenarioCategory;
}

export interface Achievement {
  id: string;
  name: string;
  nameTr: string;
  description: string;
  descriptionTr: string;
  icon: string;
  kind: AchievementKind;
  rarity: "common" | "rare" | "epic" | "legendary";
  requirement: AchievementRequirement;
  xpReward: number;
  coinReward: number;
  hidden?: boolean;
}

export interface CareerTitle {
  id: string;
  rank: number;
  name: string;
  nameTr: string;
  minimumXp: number;
  description: string;
  color: string;
  icon: string;
  unlocks: string[];
  disclaimer?: string;
}

export interface CareerRegion {
  id: CampusLocation;
  name: string;
  nameTr: string;
  description: string;
  requiredXp: number;
  position: { x: number; y: number };
  accentColor: string;
  icon: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  level: CEFRLevel;
  careerArea: CareerArea;
  accent: AccentPreference;
  dailyGoalMinutes: 5 | 10 | 15 | 20;
  avatarId: string;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AudioSettings {
  music: boolean;
  soundEffects: boolean;
  narration: boolean;
  speechRate: 0.75 | 1 | 1.25;
  volume: number;
}

export interface AccessibilitySettings {
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface AppSettings {
  theme: "dark" | "light" | "system";
  audio: AudioSettings;
  accessibility: AccessibilitySettings;
  preferredLanguage: "tr" | "en";
}

export interface ScenarioProgress {
  scenarioId: string;
  status: "locked" | "available" | "in-progress" | "completed";
  currentStepIndex: number;
  bestAccuracy: number;
  bestScore: number;
  attempts: number;
  hintsUsed: number;
  completedAt?: string;
  lastPlayedAt?: string;
}

export interface VocabularyProgress {
  vocabularyId: string;
  firstLearnedAt: string;
  lastReviewedAt?: string;
  nextReviewAt: string;
  correctCount: number;
  incorrectCount: number;
  masteryScore: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  leitnerBox: 1 | 2 | 3 | 4 | 5;
  learnedInScenarioId: string;
  favorite: boolean;
}

export interface UserProgress {
  totalXp: number;
  coins: number;
  currentTitleId: string;
  streakDays: number;
  lastActiveDate?: string;
  completedScenarioIds: string[];
  unlockedAchievementIds: string[];
  unlockedRegionIds: CampusLocation[];
  scenarioProgress: Record<string, ScenarioProgress>;
  vocabularyProgress: Record<string, VocabularyProgress>;
  dailyMinutes: Record<string, number>;
}

export type LearningErrorType =
  | "grammar"
  | "vocabulary"
  | "listening"
  | "tone"
  | "word-order"
  | "comprehension"
  | "timeout";

export interface AnswerAttempt {
  id: string;
  scenarioId: string;
  stepId: string;
  questionType: ScenarioStepType;
  category: ScenarioCategory;
  correct: boolean;
  attemptNumber: number;
  responseTimeMs: number;
  hintUsed: boolean;
  vocabularyIds: string[];
  errorType?: LearningErrorType;
  level: CEFRLevel;
  answer: string | string[];
  createdAt: string;
}

export interface LearningActivity {
  id: string;
  type: "answer" | "scenario-complete" | "vocabulary-review" | "daily-shift" | "roleplay";
  occurredAt: string;
  durationSeconds: number;
  xpEarned: number;
  scenarioId?: string;
  vocabularyId?: string;
  metadata?: Record<string, string | number | boolean | string[]>;
}

export interface SkillScores {
  vocabulary: number;
  listening: number;
  grammar: number;
  communication: number;
}

export interface CategoryPerformance {
  category: ScenarioCategory;
  attempts: number;
  correct: number;
  accuracy: number;
  averageResponseTimeMs: number;
}

export interface StrugglingVocabulary {
  vocabularyId: string;
  incorrectCount: number;
  lastSeenAt: string;
  masteryScore: number;
}

export interface AnalyticsSummary {
  generatedAt: string;
  strongestCategory?: ScenarioCategory;
  weakestCategory?: ScenarioCategory;
  categoryPerformance: CategoryPerformance[];
  strugglingVocabulary: StrugglingVocabulary[];
  mostFrequentError?: LearningErrorType;
  averageResponseTimeMs: number;
  recentAccuracy: number;
  previousAccuracy: number;
  improvementPercent: number;
  skillScores: SkillScores;
  insights: string[];
}

export interface MissionResult {
  scenarioId: string;
  completedAt: string;
  score: number;
  accuracy: number;
  correctAnswers: number;
  totalSteps: number;
  xpEarned: number;
  coinsEarned: number;
  hintsUsed: number;
  firstTryCorrect: number;
  newVocabularyIds: string[];
  reviewVocabularyIds: string[];
  attempts: AnswerAttempt[];
}

export interface AppState {
  version: number;
  profile: UserProfile | null;
  settings: AppSettings;
  progress: UserProgress;
  attempts: AnswerAttempt[];
  activities: LearningActivity[];
  lastSyncedAt?: string;
}
