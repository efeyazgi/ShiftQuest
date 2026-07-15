"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Clock3, Grip, LoaderCircle, Radio, Send, Settings2, Sparkles } from "lucide-react";
import type { LearningErrorType, ScenarioStep } from "@/types";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  getRuntimeLLMConfig,
  useProviderSettingsStore,
} from "@/features/providers/store";

export type StepAnswer = {
  correct: boolean;
  answer: string | string[];
  feedback?: string;
  naturalAlternative?: string;
  errorType?: LearningErrorType;
};

const normalize = (value: string) => value.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();

function errorFromQuality(quality?: string): LearningErrorType {
  if (quality === "grammar-error") return "grammar";
  if (quality === "too-direct" || quality === "too-formal" || quality === "unnatural") return "tone";
  return "comprehension";
}

function ChoiceGame({ step, onAnswer }: { step: Extract<ScenarioStep, { type: "dialogue-choice" | "fill-blank" | "listening" | "tone-check" | "quick-response" }>; onAnswer: (answer: StepAnswer) => void }) {
  const [remaining, setRemaining] = useState(step.type === "quick-response" ? step.timeLimitSeconds : 0);
  const answered = useRef(false);

  useEffect(() => {
    if (step.type !== "quick-response") return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          if (!answered.current) {
            answered.current = true;
            onAnswer({ correct: false, answer: "timeout", feedback: "Süre doldu. Önce bağlamdaki anahtar fiile odaklan.", errorType: "timeout" });
          }
          return 0;
        }
        return value - 1;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [onAnswer, step]);

  return (
    <div className="space-y-4">
      {step.type === "listening" ? (
        <div className="grid gap-4 rounded-xl border border-cyan/20 bg-cyan/[0.05] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0"><p className="font-display text-[10px] uppercase tracking-[0.2em] text-cyan">Listening channel</p><p className="mt-1 text-xs leading-5 text-slate-400">Kaydı dinle, konuşmacının amacını veya eksik ifadeyi seç.</p></div>
          <AudioPlayer text={step.transcript} className="justify-start sm:justify-end" />
        </div>
      ) : null}
      {step.type === "quick-response" ? (
        <div className="flex items-center gap-2 text-sm font-bold text-amber"><Clock3 className="h-4 w-4" /> {remaining}s <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber transition-all" style={{ width: `${remaining / step.timeLimitSeconds * 100}%` }} /></div></div>
      ) : null}
      {step.type === "fill-blank" ? <p className="rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm text-white">{step.sentence.replace("___", "▰▰▰")}</p> : null}
      <div className="grid gap-2.5">
        {step.options.map((option, index) => (
          <button
            key={option.id}
            disabled={answered.current}
            onClick={() => {
              answered.current = true;
              onAnswer({ correct: option.isCorrect, answer: option.id, feedback: option.feedbackTr, naturalAlternative: option.naturalAlternative, errorType: option.isCorrect ? undefined : errorFromQuality(option.quality) });
            }}
            className="group flex min-h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3.5 text-left text-sm leading-relaxed text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan/40 hover:bg-cyan/[0.08] disabled:pointer-events-none disabled:opacity-60"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-black/30 font-display text-[10px] text-slate-500 group-hover:border-cyan/30 group-hover:text-cyan">{String.fromCharCode(65 + index)}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SentenceBuilder({ step, onAnswer }: { step: Extract<ScenarioStep, { type: "sentence-builder" }>; onAnswer: (answer: StepAnswer) => void }) {
  const [available, setAvailable] = useState(() => step.tokens.map((token, index) => ({ token, key: `${index}-${token}` })));
  const [answer, setAnswer] = useState<Array<{ token: string; key: string }>>([]);
  const sentence = answer.map((item) => item.token).join(" ");
  const submit = () => {
    const accepted = [step.correctOrder.join(" "), ...step.acceptedAnswers].map(normalize);
    onAnswer({ correct: accepted.includes(normalize(sentence)), answer: answer.map((item) => item.token), naturalAlternative: step.correctOrder.join(" "), errorType: "word-order" });
  };
  return (
    <div className="space-y-4">
      <div className="min-h-20 rounded-xl border border-dashed border-cyan/30 bg-cyan/5 p-3" aria-label="Oluşturulan cümle">
        {answer.length ? <div className="flex flex-wrap gap-2">{answer.map((item) => <button key={item.key} onClick={() => { setAnswer((current) => current.filter((entry) => entry.key !== item.key)); setAvailable((current) => [...current, item]); }} className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm text-cyan">{item.token}</button>)}</div> : <p className="pt-4 text-center text-xs text-slate-500">Kelimeleri buraya taşımak için sırayla seç</p>}
      </div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/15 p-3"><Grip className="mr-1 h-5 w-5 text-slate-600" />{available.map((item) => <button key={item.key} onClick={() => { setAvailable((current) => current.filter((entry) => entry.key !== item.key)); setAnswer((current) => [...current, item]); }} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-lime/35 hover:text-lime">{item.token}</button>)}</div>
      <Button onClick={submit} disabled={!answer.length}>Cümleyi kontrol et <Check className="h-4 w-4" /></Button>
    </div>
  );
}

function MatchingGame({ step, onAnswer }: { step: Extract<ScenarioStep, { type: "matching" }>; onAnswer: (answer: StepAnswer) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const rightItems = useMemo(() => [...step.pairs.map((pair) => pair.right)].sort((a, b) => a.localeCompare(b)), [step.pairs]);
  return (
    <div className="space-y-4">
      <div className="grid gap-2.5">
        {step.pairs.map((pair) => (
          <label key={pair.id} className="grid items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-2">
            <span className="text-sm font-semibold text-white">{pair.left}</span>
            <span className="relative"><select value={answers[pair.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [pair.id]: event.target.value }))} className="w-full appearance-none rounded-lg border border-white/10 bg-[#08151e] px-3 py-2.5 pr-9 text-sm text-slate-300"><option value="">Anlamı seç…</option>{rightItems.map((right) => <option key={right}>{right}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" /></span>
          </label>
        ))}
      </div>
      <Button disabled={Object.keys(answers).length !== step.pairs.length} onClick={() => { const correct = step.pairs.every((pair) => answers[pair.id] === pair.right); onAnswer({ correct, answer: Object.values(answers), naturalAlternative: step.pairs.map((pair) => `${pair.left}: ${pair.right}`).join(" · "), errorType: "vocabulary" }); }}>Eşleşmeleri kontrol et</Button>
    </div>
  );
}

function PuzzleGame({ step, onAnswer }: { step: Extract<ScenarioStep, { type: "word-puzzle" }>; onAnswer: (answer: StepAnswer) => void }) {
  const [value, setValue] = useState("");
  return (
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const accepted = [step.answer, ...step.acceptedAnswers].map(normalize); onAnswer({ correct: accepted.includes(normalize(value)), answer: value, naturalAlternative: step.answer, errorType: "vocabulary" }); }}>
      <div className="rounded-xl border border-amber/25 bg-amber/5 p-5 text-center"><p className="font-display text-[10px] uppercase tracking-[0.22em] text-amber">{step.puzzleKind.replace("-", " ")}</p><p className="my-4 font-display text-2xl font-black tracking-[0.25em] text-white">{step.scrambled}</p><p className="text-xs text-slate-400">{step.clueTr}</p></div>
      <input value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white placeholder:text-slate-600" placeholder="Cevabını yaz…" aria-label="Kelime bulmacası cevabı" />
      <Button type="submit" disabled={!value.trim()}>Cevabı kilitle</Button>
    </form>
  );
}

function RoleplayGame({ step, onAnswer }: { step: Extract<ScenarioStep, { type: "roleplay" }>; onAnswer: (answer: StepAnswer) => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const aiProvider = useProviderSettingsStore((state) => state.llm.provider);
  const words = message.trim() ? message.trim().split(/\s+/).length : 0;

  const submit = async () => {
    setLoading(true);
    let feedback = step.mockFeedback.summary;
    let naturalAlternative = step.sampleAnswer;
    if (aiProvider !== "mock") {
      try {
        const providerConfig = getRuntimeLLMConfig();
        const response = await fetch("/api/roleplay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            level: words > 24 ? "B2" : "B1",
            role: step.characterRole,
            context: step.userGoal,
            ...(providerConfig ? { providerConfig } : {}),
          }),
        });
        if (response.ok) {
          const body = await response.json() as { data?: { reply?: string; feedback?: { summary?: string; correction?: string } } };
          feedback = body.data?.feedback?.summary ?? feedback;
          naturalAlternative = body.data?.feedback?.correction ?? naturalAlternative;
        }
      } catch {
        /* Deterministic seed feedback remains available offline. */
      }
    }
    setLoading(false);
    onAnswer({ correct: words >= step.minimumWords, answer: message, feedback, naturalAlternative, errorType: words >= step.minimumWords ? undefined : "communication" as LearningErrorType });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan/20 bg-cyan/[0.05] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-[10px] uppercase tracking-[0.2em] text-cyan"><Radio className="h-3.5 w-3.5 animate-pulse" /> AI roleplay channel <span className="rounded border border-white/10 bg-black/20 px-2 py-1 text-[8px] tracking-normal text-slate-400">{aiProvider !== "mock" ? "External AI" : "Yerleşik pratik motoru"}</span><Link href="/settings#ai-voice-services" className="ml-auto inline-flex items-center gap-1 text-[8px] text-cyan hover:text-white"><Settings2 className="h-3 w-3" /> AI ayarları</Link></div>
        <p className="text-sm leading-relaxed text-white">“{step.openingLine}”</p><p className="mt-2 text-xs text-slate-400">Hedef: {step.userGoal}</p>
      </div>
      <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 700))} rows={5} className="w-full resize-none rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white placeholder:text-slate-600" placeholder="Write a clear, professional reply…" aria-label="Roleplay yanıtı" />
      <div className="flex flex-wrap items-center justify-between gap-3"><span className={cn("text-xs", words >= step.minimumWords ? "text-lime" : "text-slate-500")}>{words}/{step.minimumWords} minimum words</span><Button onClick={() => void submit()} disabled={loading || words < Math.max(2, Math.floor(step.minimumWords / 2))}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Yanıtı değerlendir</Button></div>
    </div>
  );
}

function BossGame({ step, onAnswer }: { step: Extract<ScenarioStep, { type: "boss-battle" }>; onAnswer: (answer: StepAnswer) => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [text, setText] = useState("");
  const phase = step.phases[phaseIndex];

  const answerPhase = (value: string, isCorrect?: boolean) => {
    const correct = isCorrect ?? normalize(value).includes(normalize(phase.expectedAnswer));
    const nextCorrect = correctCount + (correct ? 1 : 0);
    const nextAnswers = [...answers, value];
    if (phaseIndex === step.phases.length - 1) {
      onAnswer({ correct: nextCorrect >= step.minimumPhasesToPass, answer: nextAnswers, feedback: `${step.phases.length} aşamanın ${nextCorrect} tanesini tamamladın.`, naturalAlternative: phase.expectedAnswer, errorType: nextCorrect >= step.minimumPhasesToPass ? undefined : "comprehension" });
      return;
    }
    setCorrectCount(nextCorrect); setAnswers(nextAnswers); setPhaseIndex((index) => index + 1); setText("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-coral/30 bg-coral/5 p-4"><div className="flex items-center justify-between gap-3"><p className="font-display text-xs font-black uppercase tracking-[0.18em] text-coral"><Sparkles className="mr-2 inline h-4 w-4" />{step.bossName}</p><span className="font-display text-[10px] text-slate-400">PHASE {phaseIndex + 1}/{step.phases.length}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-coral transition-all" style={{ width: `${(phaseIndex + 1) / step.phases.length * 100}%` }} /></div></div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-sm leading-relaxed text-white">{phase.prompt}</p>{phase.ttsText ? <AudioPlayer text={phase.ttsText} compact className="mt-3" /> : null}</div>
      {phase.options?.length ? <div className="grid gap-2">{phase.options.map((option) => <button key={option.id} onClick={() => answerPhase(option.text, option.isCorrect)} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left text-sm text-slate-200 hover:border-coral/35 hover:bg-coral/5">{option.text}</button>)}</div> : <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (text.trim()) answerPhase(text); }}><input value={text} onChange={(event) => setText(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white" placeholder={phase.phaseType === "summarize" ? "Write your short summary…" : "Type the key phrase…"} /><Button type="submit" disabled={!text.trim()}>Next phase</Button></form>}
    </div>
  );
}

export function StepInteraction({ step, onAnswer }: { step: ScenarioStep; onAnswer: (answer: StepAnswer) => void }) {
  switch (step.type) {
    case "dialogue-choice": case "fill-blank": case "listening": case "tone-check": case "quick-response": return <ChoiceGame step={step} onAnswer={onAnswer} />;
    case "sentence-builder": return <SentenceBuilder step={step} onAnswer={onAnswer} />;
    case "matching": return <MatchingGame step={step} onAnswer={onAnswer} />;
    case "word-puzzle": return <PuzzleGame step={step} onAnswer={onAnswer} />;
    case "roleplay": return <RoleplayGame step={step} onAnswer={onAnswer} />;
    case "boss-battle": return <BossGame step={step} onAnswer={onAnswer} />;
  }
}
