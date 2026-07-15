"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AccentPreference,
  AppSettings,
  AnswerAttempt,
  CareerArea,
  CEFRLevel,
  LearningActivity,
  MissionResult,
  UserProfile,
  UserProgress,
  VocabularyProgress,
} from "@/types";
import { careerTitles } from "@/data/career";

const STORAGE_KEY = "shiftquest-game-v1";

export const initialSettings: AppSettings = {
  theme: "dark",
  audio: {
    music: false,
    soundEffects: true,
    narration: true,
    speechRate: 1,
    volume: 0.8,
  },
  accessibility: {
    animations: true,
    reducedMotion: false,
    highContrast: false,
  },
  preferredLanguage: "tr",
};

export const initialProgress: UserProgress = {
  totalXp: 0,
  coins: 50,
  currentTitleId: "engineering-intern",
  streakDays: 0,
  completedScenarioIds: [],
  unlockedAchievementIds: [],
  unlockedRegionIds: ["office-hub", "training-center"],
  scenarioProgress: {},
  vocabularyProgress: {},
  dailyMinutes: {},
};

type OnboardingInput = {
  displayName: string;
  level: CEFRLevel;
  careerArea: CareerArea;
  accent: AccentPreference;
  dailyGoalMinutes: 5 | 10 | 15 | 20;
  avatarId: string;
};

export type GameSavePayload = {
  profile: UserProfile | null;
  settings: AppSettings;
  progress: UserProgress;
  attempts: AnswerAttempt[];
  activities: LearningActivity[];
};

type GameStore = GameSavePayload & {
  version: number;
  hydrated: boolean;
  lastResult: MissionResult | null;
  setHydrated: (hydrated: boolean) => void;
  completeOnboarding: (input: OnboardingInput) => void;
  updateProfile: (profile: Partial<Omit<UserProfile, "id" | "createdAt">>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateAudioSettings: (audio: Partial<AppSettings["audio"]>) => void;
  updateAccessibility: (accessibility: Partial<AppSettings["accessibility"]>) => void;
  recordAnswer: (attempt: AnswerAttempt) => void;
  saveVocabulary: (vocabularyId: string, scenarioId?: string) => void;
  toggleVocabularyFavorite: (vocabularyId: string) => void;
  reviewVocabulary: (vocabularyId: string, correct: boolean) => void;
  completeScenario: (result: MissionResult) => void;
  addStudyMinutes: (minutes: number) => void;
  clearLastResult: () => void;
  resetAll: () => void;
  importData: (payload: GameSavePayload) => boolean;
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeVocabularyProgress(vocabularyId: string, scenarioId = "word-vault"): VocabularyProgress {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  return {
    vocabularyId,
    firstLearnedAt: now.toISOString(),
    nextReviewAt: next.toISOString(),
    correctCount: 0,
    incorrectCount: 0,
    masteryScore: 10,
    difficulty: 3,
    leitnerBox: 1,
    learnedInScenarioId: scenarioId,
    favorite: false,
  };
}

function calculateStreak(progress: UserProgress, now = new Date()) {
  const today = localDateKey(now);
  if (progress.lastActiveDate === today) return progress.streakDays;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return progress.lastActiveDate === localDateKey(yesterday) ? progress.streakDays + 1 : 1;
}

function titleForXp(xp: number) {
  return [...careerTitles].reverse().find((title) => xp >= title.minimumXp)?.id ?? "engineering-intern";
}

function achievementIds(progress: UserProgress, result: MissionResult) {
  const unlocked = new Set(progress.unlockedAchievementIds);
  unlocked.add("first-shift");
  if (result.accuracy >= 90) unlocked.add("clear-communicator");
  if (result.hintsUsed === 0) unlocked.add("no-hint-needed");
  if (progress.streakDays >= 7) unlocked.add("seven-day-streak");
  if (Object.keys(progress.vocabularyProgress).length >= 20) unlocked.add("vocabulary-builder");
  return [...unlocked];
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      version: 1,
      hydrated: false,
      profile: null,
      settings: initialSettings,
      progress: initialProgress,
      attempts: [],
      activities: [],
      lastResult: null,
      setHydrated: (hydrated) => set({ hydrated }),
      completeOnboarding: (input) => {
        const now = new Date().toISOString();
        set({
          profile: {
            ...input,
            id: globalThis.crypto?.randomUUID?.() ?? `player-${Date.now()}`,
            displayName: input.displayName.trim() || "Engineer",
            onboardingComplete: true,
            createdAt: now,
            updatedAt: now,
          },
        });
      },
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() }
            : null,
        })),
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
      updateAudioSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, audio: { ...state.settings.audio, ...updates } },
        })),
      updateAccessibility: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            accessibility: { ...state.settings.accessibility, ...updates },
          },
        })),
      recordAnswer: (attempt) =>
        set((state) => {
          const vocabularyProgress = { ...state.progress.vocabularyProgress };
          for (const vocabularyId of attempt.vocabularyIds) {
            const current = vocabularyProgress[vocabularyId] ?? makeVocabularyProgress(vocabularyId, attempt.scenarioId);
            vocabularyProgress[vocabularyId] = {
              ...current,
              correctCount: current.correctCount + (attempt.correct ? 1 : 0),
              incorrectCount: current.incorrectCount + (attempt.correct ? 0 : 1),
              masteryScore: Math.max(0, Math.min(100, current.masteryScore + (attempt.correct ? 4 : -7))),
            };
          }
          return {
            attempts: [...state.attempts, attempt].slice(-2_000),
            progress: { ...state.progress, vocabularyProgress },
          };
        }),
      saveVocabulary: (vocabularyId, scenarioId) =>
        set((state) => ({
          progress: {
            ...state.progress,
            vocabularyProgress: {
              ...state.progress.vocabularyProgress,
              [vocabularyId]:
                state.progress.vocabularyProgress[vocabularyId] ?? makeVocabularyProgress(vocabularyId, scenarioId),
            },
          },
        })),
      toggleVocabularyFavorite: (vocabularyId) =>
        set((state) => {
          const current = state.progress.vocabularyProgress[vocabularyId] ?? makeVocabularyProgress(vocabularyId);
          return {
            progress: {
              ...state.progress,
              vocabularyProgress: {
                ...state.progress.vocabularyProgress,
                [vocabularyId]: { ...current, favorite: !current.favorite },
              },
            },
          };
        }),
      reviewVocabulary: (vocabularyId, correct) =>
        set((state) => {
          const current = state.progress.vocabularyProgress[vocabularyId] ?? makeVocabularyProgress(vocabularyId);
          const box = Math.max(1, Math.min(5, correct ? current.leitnerBox + 1 : 1)) as 1 | 2 | 3 | 4 | 5;
          const now = new Date();
          const next = new Date(now);
          next.setDate(next.getDate() + [0, 1, 3, 7, 14, 30][box]);
          const updated: VocabularyProgress = {
            ...current,
            leitnerBox: box,
            lastReviewedAt: now.toISOString(),
            nextReviewAt: next.toISOString(),
            correctCount: current.correctCount + (correct ? 1 : 0),
            incorrectCount: current.incorrectCount + (correct ? 0 : 1),
            masteryScore: Math.max(0, Math.min(100, current.masteryScore + (correct ? 12 : -10))),
          };
          return {
            progress: {
              ...state.progress,
              vocabularyProgress: { ...state.progress.vocabularyProgress, [vocabularyId]: updated },
            },
          };
        }),
      completeScenario: (result) =>
        set((state) => {
          const now = new Date();
          const today = localDateKey(now);
          const totalXp = state.progress.totalXp + result.xpEarned;
          const completedScenarioIds = state.progress.completedScenarioIds.includes(result.scenarioId)
            ? state.progress.completedScenarioIds
            : [...state.progress.completedScenarioIds, result.scenarioId];
          const vocabularyProgress = { ...state.progress.vocabularyProgress };
          for (const vocabularyId of result.newVocabularyIds) {
            vocabularyProgress[vocabularyId] ??= makeVocabularyProgress(vocabularyId, result.scenarioId);
          }
          const nextProgress: UserProgress = {
            ...state.progress,
            totalXp,
            coins: state.progress.coins + result.coinsEarned,
            currentTitleId: titleForXp(totalXp),
            streakDays: calculateStreak(state.progress, now),
            lastActiveDate: today,
            completedScenarioIds,
            vocabularyProgress,
            dailyMinutes: {
              ...state.progress.dailyMinutes,
              [today]: (state.progress.dailyMinutes[today] ?? 0) + Math.max(1, Math.round(result.totalSteps * 0.8)),
            },
            scenarioProgress: {
              ...state.progress.scenarioProgress,
              [result.scenarioId]: {
                scenarioId: result.scenarioId,
                status: "completed",
                currentStepIndex: result.totalSteps,
                bestAccuracy: Math.max(
                  state.progress.scenarioProgress[result.scenarioId]?.bestAccuracy ?? 0,
                  result.accuracy,
                ),
                bestScore: Math.max(state.progress.scenarioProgress[result.scenarioId]?.bestScore ?? 0, result.score),
                attempts: (state.progress.scenarioProgress[result.scenarioId]?.attempts ?? 0) + 1,
                hintsUsed: result.hintsUsed,
                completedAt: result.completedAt,
                lastPlayedAt: result.completedAt,
              },
            },
          };
          nextProgress.unlockedAchievementIds = achievementIds(nextProgress, result);
          const activity: LearningActivity = {
            id: globalThis.crypto?.randomUUID?.() ?? `activity-${Date.now()}`,
            type: "scenario-complete",
            occurredAt: result.completedAt,
            durationSeconds: result.totalSteps * 48,
            xpEarned: result.xpEarned,
            scenarioId: result.scenarioId,
            metadata: { accuracy: result.accuracy, hintsUsed: result.hintsUsed },
          };
          return {
            progress: nextProgress,
            activities: [...state.activities, activity].slice(-1_000),
            lastResult: result,
          };
        }),
      addStudyMinutes: (minutes) =>
        set((state) => {
          const today = localDateKey();
          return {
            progress: {
              ...state.progress,
              dailyMinutes: {
                ...state.progress.dailyMinutes,
                [today]: (state.progress.dailyMinutes[today] ?? 0) + Math.max(0, minutes),
              },
            },
          };
        }),
      clearLastResult: () => set({ lastResult: null }),
      resetAll: () =>
        set({
          profile: null,
          settings: initialSettings,
          progress: initialProgress,
          attempts: [],
          activities: [],
          lastResult: null,
          hydrated: true,
        }),
      importData: (payload) => {
        if (!payload || !payload.settings || !payload.progress || !Array.isArray(payload.attempts)) return false;
        set({ ...payload, version: 1, lastResult: null, hydrated: true });
        return true;
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ profile, settings, progress, attempts, activities, lastResult, version }) => ({
        profile,
        settings,
        progress,
        attempts,
        activities,
        lastResult,
        version,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export function exportGameData() {
  return { exportedAt: new Date().toISOString(), version: 1, ...getGameSavePayload() };
}

export function getGameSavePayload(): GameSavePayload {
  const { profile, settings, progress, attempts, activities } = useGameStore.getState();
  return { profile, settings, progress, attempts, activities };
}
