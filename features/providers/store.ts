"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  runtimeLLMConfigSchema,
  runtimeTTSConfigSchema,
  type RuntimeLLMConfig,
  type RuntimeTTSConfig,
} from "@/lib/providers/runtime-config";
import {
  GOOGLE_GEMINI_NATIVE_BASE_URL,
  GOOGLE_GEMINI_TEXT_MODEL,
  GOOGLE_GEMINI_TTS_MODEL,
  GOOGLE_GEMINI_TTS_VOICE,
} from "@/lib/providers/google-gemini";

export type RuntimeLLMProvider =
  | "mock"
  | "openai-compatible"
  | "google-gemini";
export type RuntimeTTSProvider =
  | "browser"
  | "openai-compatible"
  | "google-gemini";

export type LLMProviderSettings = {
  provider: RuntimeLLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type TTSProviderSettings = {
  provider: RuntimeTTSProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  englishVoice: string;
  turkishVoice: string;
  browserVoice: string;
  useSharedAIKey: boolean;
};

const initialLLMSettings: LLMProviderSettings = {
  provider: "mock",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "",
};

const initialTTSSettings: TTSProviderSettings = {
  provider: "browser",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "",
  englishVoice: "alloy",
  turkishVoice: "alloy",
  browserVoice: "",
  useSharedAIKey: true,
};

type ProviderSettingsStore = {
  hydrated: boolean;
  revision: number;
  llm: LLMProviderSettings;
  tts: TTSProviderSettings;
  setHydrated: (hydrated: boolean) => void;
  updateLLM: (updates: Partial<LLMProviderSettings>) => void;
  updateTTS: (updates: Partial<TTSProviderSettings>) => void;
  clearLLM: () => void;
  clearTTS: () => void;
  clearAll: () => void;
};

function nextLLMSettings(
  current: LLMProviderSettings,
  updates: Partial<LLMProviderSettings>,
): LLMProviderSettings {
  if (!updates.provider || updates.provider === current.provider) {
    return { ...current, ...updates };
  }

  const providerDefaults: Partial<LLMProviderSettings> =
    updates.provider === "google-gemini"
      ? {
          apiKey: "",
          baseUrl: GOOGLE_GEMINI_NATIVE_BASE_URL,
          model: GOOGLE_GEMINI_TEXT_MODEL,
        }
      : updates.provider === "openai-compatible"
        ? { apiKey: "", baseUrl: "https://api.openai.com/v1", model: "" }
        : {};
  return { ...current, ...providerDefaults, ...updates };
}

function nextTTSSettings(
  current: TTSProviderSettings,
  updates: Partial<TTSProviderSettings>,
): TTSProviderSettings {
  if (!updates.provider || updates.provider === current.provider) {
    return { ...current, ...updates };
  }

  const providerDefaults: Partial<TTSProviderSettings> =
    updates.provider === "google-gemini"
      ? {
          apiKey: "",
          baseUrl: GOOGLE_GEMINI_NATIVE_BASE_URL,
          model: GOOGLE_GEMINI_TTS_MODEL,
          englishVoice: GOOGLE_GEMINI_TTS_VOICE,
          turkishVoice: GOOGLE_GEMINI_TTS_VOICE,
        }
      : updates.provider === "openai-compatible"
        ? {
            apiKey: "",
            baseUrl: "https://api.openai.com/v1",
            model: "",
            englishVoice: "alloy",
            turkishVoice: "alloy",
          }
        : {};
  return { ...current, ...providerDefaults, ...updates };
}

export const useProviderSettingsStore = create<ProviderSettingsStore>()(
  persist(
    (set) => ({
      hydrated: false,
      revision: 0,
      llm: initialLLMSettings,
      tts: initialTTSSettings,
      setHydrated: (hydrated) => set({ hydrated }),
      updateLLM: (updates) =>
        set((state) => ({
          llm: nextLLMSettings(state.llm, updates),
          revision: state.revision + 1,
        })),
      updateTTS: (updates) =>
        set((state) => ({
          tts: nextTTSSettings(state.tts, updates),
          revision: state.revision + 1,
        })),
      clearLLM: () =>
        set((state) => ({
          llm: { ...initialLLMSettings },
          revision: state.revision + 1,
        })),
      clearTTS: () =>
        set((state) => ({
          tts: { ...initialTTSSettings },
          revision: state.revision + 1,
        })),
      clearAll: () =>
        set((state) => ({
          llm: { ...initialLLMSettings },
          tts: { ...initialTTSSettings },
          revision: state.revision + 1,
        })),
    }),
    {
      name: "shiftquest-runtime-providers-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ revision, llm, tts }) => ({ revision, llm, tts }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

function clean(value: string) {
  return value.trim();
}

export function getRuntimeLLMConfig(): RuntimeLLMConfig | undefined {
  const { llm } = useProviderSettingsStore.getState();
  if (llm.provider === "mock") return undefined;
  const parsed = runtimeLLMConfigSchema.safeParse({
    provider: llm.provider,
    apiKey: llm.apiKey,
    baseUrl:
      llm.provider === "google-gemini"
        ? GOOGLE_GEMINI_NATIVE_BASE_URL
        : clean(llm.baseUrl),
    model: clean(llm.model),
  });
  return parsed.success ? parsed.data : undefined;
}

export function getRuntimeTTSConfig(): RuntimeTTSConfig | undefined {
  const { llm, tts } = useProviderSettingsStore.getState();
  if (tts.provider === "browser" || !clean(tts.turkishVoice)) return undefined;
  const canShareAIKey =
    tts.useSharedAIKey && llm.provider === tts.provider;
  const parsed = runtimeTTSConfigSchema.safeParse({
    provider: tts.provider,
    apiKey: canShareAIKey ? llm.apiKey : tts.apiKey,
    baseUrl: clean(tts.baseUrl),
    model: clean(tts.model),
    voice: clean(tts.englishVoice),
  });
  return parsed.success ? parsed.data : undefined;
}

export function providerSettingsAreComplete(kind: "llm" | "tts") {
  return kind === "llm" ? Boolean(getRuntimeLLMConfig()) : Boolean(getRuntimeTTSConfig());
}
