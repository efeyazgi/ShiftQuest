"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRuntimeTTSConfig,
  useProviderSettingsStore,
} from "@/features/providers/store";

export type SpeechLanguage = "en-US" | "en-GB" | "tr-TR";
export type SpeechStatus = "idle" | "loading" | "playing" | "paused" | "error";
export type SpeechSource = "browser" | "neural" | null;

type CachedAudio = { url: string; mimeType: string };
const audioCache = new Map<string, CachedAudio>();
let cacheRevision = -1;

function clearAudioCache() {
  for (const cached of audioCache.values()) {
    if (cached.url.startsWith("blob:")) URL.revokeObjectURL(cached.url);
  }
  audioCache.clear();
}

function browserSpeak(
  text: string,
  language: SpeechLanguage,
  rate: number,
  volume: number,
  voiceName: string,
  onEnd: () => void,
  onError: () => void,
) {
  if (!("speechSynthesis" in window)) throw new Error("Speech synthesis is unavailable");
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = rate;
  utterance.volume = volume;
  const voices = window.speechSynthesis.getVoices();
  const exactVoice = voiceName
    ? voices.find((voice) => voice.name === voiceName || voice.voiceURI === voiceName)
    : undefined;
  const languageVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(language.toLowerCase().slice(0, 2)),
  );
  if (exactVoice ?? languageVoice) utterance.voice = exactVoice ?? languageVoice!;
  utterance.onend = onEnd;
  utterance.onerror = onError;
  window.speechSynthesis.speak(utterance);
}

export function useTTS() {
  const providerMode = useProviderSettingsStore((state) => state.tts.provider);
  const browserVoice = useProviderSettingsStore((state) => state.tts.browserVoice);
  const englishVoice = useProviderSettingsStore((state) => state.tts.englishVoice);
  const turkishVoice = useProviderSettingsStore((state) => state.tts.turkishVoice);
  const revision = useProviderSettingsStore((state) => state.revision);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [source, setSource] = useState<SpeechSource>(null);
  const [isFallback, setIsFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastRef = useRef<{
    text: string;
    language: SpeechLanguage;
    rate: number;
    volume: number;
  } | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus("idle");
  }, []);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    stop();
    setSource(null);
    setIsFallback(false);
  }, [revision, stop]);

  const play = useCallback(async (
    text: string,
    language: SpeechLanguage = "en-US",
    rate = 1,
    volume = 0.8,
  ): Promise<SpeechSource | "error"> => {
    stop();
    lastRef.current = { text, language, rate, volume };
    setStatus("loading");
    setIsFallback(false);

    if (cacheRevision !== revision) {
      clearAudioCache();
      cacheRevision = revision;
    }

    const playInBrowser = (fallback: boolean): SpeechSource | "error" => {
      try {
        setSource("browser");
        setIsFallback(fallback);
        setStatus("playing");
        browserSpeak(
          text,
          language,
          rate,
          volume,
          browserVoice,
          () => setStatus("idle"),
          () => setStatus("error"),
        );
        return "browser";
      } catch {
        setSource(null);
        setStatus("error");
        return "error";
      }
    };

    if (providerMode === "browser") return playInBrowser(false);

    const providerConfig = getRuntimeTTSConfig();
    const configuredVoice = language === "tr-TR"
      ? turkishVoice.trim()
      : englishVoice.trim();
    const cacheKey = [
      revision,
      providerConfig?.baseUrl ?? "server",
      providerConfig?.model ?? "server",
      configuredVoice,
      language,
      rate,
      text,
    ].join("|");

    try {
      let cached = audioCache.get(cacheKey);
      if (!cached) {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            language,
            speed: rate,
            ...(configuredVoice ? { voice: configuredVoice } : {}),
            ...(providerConfig ? { providerConfig } : {}),
          }),
        });
        if (response.ok) {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.startsWith("audio/")) {
            const blob = await response.blob();
            cached = { url: URL.createObjectURL(blob), mimeType: contentType };
          } else {
            const body = (await response.json()) as Record<string, unknown>;
            const data = (body.data && typeof body.data === "object"
              ? body.data
              : body) as Record<string, unknown>;
            const base64 = typeof data.audioBase64 === "string"
              ? data.audioBase64
              : typeof data.audio === "string"
                ? data.audio
                : undefined;
            if (base64) {
              const mimeType = typeof data.mimeType === "string"
                ? data.mimeType
                : "audio/mpeg";
              cached = { url: `data:${mimeType};base64,${base64}`, mimeType };
            }
          }
        }
        if (cached) audioCache.set(cacheKey, cached);
      }
      if (cached) {
        setSource("neural");
        setIsFallback(false);
        const audio = new Audio(cached.url);
        audio.playbackRate = rate;
        audio.volume = volume;
        audio.onended = () => setStatus("idle");
        audio.onerror = () => setStatus("error");
        audioRef.current = audio;
        await audio.play();
        setStatus("playing");
        return "neural";
      }
    } catch {
      // Runtime and environment provider errors intentionally keep the lesson usable.
    }

    return playInBrowser(true);
  }, [browserVoice, englishVoice, providerMode, revision, stop, turkishVoice]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setStatus("paused");
      return;
    }
    if (typeof window !== "undefined" && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current?.paused) {
      void audioRef.current.play();
      setStatus("playing");
      return;
    }
    if (typeof window !== "undefined" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("playing");
    }
  }, []);

  const replay = useCallback(() => {
    const last = lastRef.current;
    if (last) void play(last.text, last.language, last.rate, last.volume);
  }, [play]);

  return {
    status,
    source,
    isFallback,
    providerMode,
    play,
    pause,
    resume,
    replay,
    stop,
  };
}
