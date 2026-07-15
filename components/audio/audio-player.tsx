"use client";

import Link from "next/link";
import {
  AudioLines,
  CircleAlert,
  Cloud,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Square,
} from "lucide-react";
import { useState } from "react";
import { useGameStore } from "@/features/game/store";
import { type SpeechLanguage, useTTS } from "@/features/audio/use-tts";
import { cn } from "@/components/ui/cn";

type AudioPlayerProps = {
  text: string;
  language?: SpeechLanguage;
  compact?: boolean;
  className?: string;
};

export function AudioPlayer({ text, language, compact = false, className }: AudioPlayerProps) {
  const profile = useGameStore((state) => state.profile);
  const audio = useGameStore((state) => state.settings.audio);
  const updateAudio = useGameStore((state) => state.updateAudioSettings);
  const [rate, setRate] = useState(audio.speechRate);
  const tts = useTTS();
  const resolvedLanguage = language ?? (profile?.accent === "british" ? "en-GB" : "en-US");

  if (!audio.narration) {
    return (
      <Link
        href="/settings#ai-voice-services"
        className="inline-flex items-center gap-2 rounded-lg border border-amber/20 bg-amber/[0.06] px-3 py-2 text-[10px] font-semibold text-amber"
      >
        <CircleAlert className="h-3.5 w-3.5" /> Seslendirme kapalı · Ayarlara git
      </Link>
    );
  }

  const statusLabel = tts.status === "loading"
    ? "Ses hazırlanıyor"
    : tts.isFallback
      ? "Neural ses bağlanamadı · tarayıcı sesi"
      : tts.source === "neural"
        ? "Neural ses"
        : tts.providerMode !== "browser"
          ? "Neural ses seçili"
          : "Tarayıcı sesi";

  const primaryAction = tts.status === "paused"
    ? tts.resume
    : () => { void tts.play(text, resolvedLanguage, rate, audio.volume); };

  return (
    <div
      className={cn(
        compact
          ? "flex shrink-0 flex-nowrap items-center gap-1.5"
          : "flex w-full flex-wrap items-center gap-2 rounded-xl border border-cyan/15 bg-black/20 p-2 sm:w-auto",
        className,
      )}
      aria-label="Seslendirme kontrolleri"
    >
      <button
        type="button"
        className={cn(
          "grid place-items-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan transition hover:bg-cyan/20",
          compact ? "h-9 w-9" : "h-10 w-10",
        )}
        onClick={primaryAction}
        aria-label={tts.status === "paused" ? "Devam et" : "Oynat"}
      >
        {tts.status === "loading" ? (
          <AudioLines className="h-4 w-4 animate-pulse" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      {tts.status === "playing" ? (
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white"
          onClick={tts.pause}
          aria-label="Duraklat"
        >
          <Pause className="h-4 w-4" />
        </button>
      ) : null}

      {tts.status === "playing" || tts.status === "paused" || tts.status === "loading" ? (
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white"
          onClick={tts.stop}
          aria-label="Durdur"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:text-white"
        onClick={tts.replay}
        aria-label="Tekrar oynat"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>

      {!compact ? (
        <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5" aria-label="Oynatma hızı">
          {([0.75, 1, 1.25] as const).map((value) => (
            <button
              type="button"
              key={value}
              className={cn(
                "rounded-md px-2.5 py-1.5 font-display text-[9px] transition",
                rate === value ? "bg-cyan/15 text-cyan" : "text-slate-500 hover:text-white",
              )}
              onClick={() => {
                setRate(value);
                updateAudio({ speechRate: value });
              }}
              aria-pressed={rate === value}
            >
              {value}x
            </button>
          ))}
        </div>
      ) : null}

      {compact ? (
        tts.isFallback ? (
          <span className="h-2 w-2 rounded-full bg-amber" title={statusLabel} />
        ) : null
      ) : (
        <div className="flex basis-full items-center justify-between gap-3 border-t border-white/[0.08] px-1 pt-2 sm:basis-auto sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-semibold",
            tts.isFallback || tts.status === "error" ? "text-amber" : "text-slate-400",
          )}>
            {tts.source === "neural" ? <Cloud className="h-3.5 w-3.5 text-cyan" /> : <AudioLines className="h-3.5 w-3.5" />}
            {tts.status === "error" ? "Ses kullanılamıyor" : statusLabel}
          </span>
          <Link
            href="/settings#ai-voice-services"
            className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-cyan transition hover:text-white"
          >
            <Settings2 className="h-3.5 w-3.5" /> Ayarla
          </Link>
        </div>
      )}
    </div>
  );
}
