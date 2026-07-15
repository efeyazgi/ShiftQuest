"use client";
/* eslint-disable react/jsx-no-comment-textnodes */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Bot, CheckCircle2, Clock3, Coins, Gamepad2, Lightbulb, LockKeyhole, MessageSquareText, ShieldAlert, Target, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getScenarioById } from "@/data/scenarios";
import { getVocabularyById } from "@/data/vocabulary";
import { useGameStore } from "@/features/game/store";
import { playGameSound } from "@/features/audio/game-sounds";
import type { AnswerAttempt, LearningErrorType, MissionResult } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { AudioPlayer } from "@/components/audio/audio-player";
import { InteractiveText } from "@/components/vocabulary/interactive-text";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StepInteraction, type StepAnswer } from "./step-interaction";

const categoryLabels = { office: "Office Communication", production: "Production Floor", meeting: "Meetings", quality: "Quality & Documentation", safety: "Safety Communication", career: "Career & Social" } as const;
const stepLabels = { "dialogue-choice": "Dialogue Choice", "sentence-builder": "Sentence Builder", "fill-blank": "Fill in the Blank", listening: "Listening Challenge", matching: "Match the Meaning", "tone-check": "Tone Check", "quick-response": "Quick Response", "word-puzzle": "Word Puzzle", roleplay: "AI Roleplay", "boss-battle": "Scenario Boss Battle" } as const;
const avatarPalette: Record<string, string> = { maya: "👩🏾‍💼", daniel: "🧑🏻‍💼", emre: "👷🏽", lena: "👩🏼‍🏭", sofia: "👩🏻‍💼", kerem: "🧑🏽‍🔬", nora: "👩🏾‍🔬", alex: "🧑🏼‍🏭", sam: "👷🏻", aylin: "👩🏻‍🔧", riley: "🧑🏾‍💼", james: "🧑🏼‍💻" };

function makeId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ScenarioPlayer({ scenarioId }: { scenarioId: string }) {
  const router = useRouter();
  const scenario = getScenarioById(scenarioId);
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);
  const progress = useGameStore((state) => state.progress);
  const previousAttempts = useGameStore((state) => state.attempts);
  const settings = useGameStore((state) => state.settings);
  const recordAnswer = useGameStore((state) => state.recordAnswer);
  const completeScenario = useGameStore((state) => state.completeScenario);
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<StepAnswer | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState<AnswerAttempt[]>([]);
  const stepStartedAt = useRef(Date.now());

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  const relevantHistory = useMemo(() => previousAttempts.filter((attempt) => attempt.level === profile?.level).slice(-15), [previousAttempts, profile?.level]);
  const recentAccuracy = relevantHistory.length ? relevantHistory.filter((attempt) => attempt.correct).length / relevantHistory.length * 100 : 70;
  const adaptiveMode = recentAccuracy >= 88 && profile?.level === "B2" ? "challenge" : recentAccuracy < 58 ? "support" : "standard";

  if (!hydrated || !profile) return <AppShell><LoadingScreen label="Vardiya profili yükleniyor" /></AppShell>;
  if (!scenario) return <AppShell><div className="mx-auto max-w-2xl px-5 py-24"><Panel className="p-8 text-center"><ShieldAlert className="mx-auto h-10 w-10 text-coral" /><h1 className="mt-4 text-2xl font-black">Görev bulunamadı</h1><p className="mt-2 text-slate-400">Bu görev kampüs kayıtlarında yok veya kaldırılmış.</p><Link href="/map" className="mt-6 inline-flex"><Button>Haritaya dön</Button></Link></Panel></div></AppShell>;

  const locked = progress.totalXp < scenario.unlock.requiredXp || scenario.unlock.requiredScenarioIds.some((id) => !progress.completedScenarioIds.includes(id));
  if (!started && locked) return <AppShell><div className="mx-auto max-w-2xl px-5 py-24"><Panel accent="amber" className="p-8 text-center"><LockKeyhole className="mx-auto h-11 w-11 text-amber" /><h1 className="mt-4 text-2xl font-black">Görev erişimi kilitli</h1><p className="mt-2 text-slate-400">Bu terminal için {scenario.unlock.requiredXp} XP ve önceki bağlı görevlerin tamamlanması gerekiyor.</p><Link href="/map" className="mt-6 inline-flex"><Button variant="secondary">Kariyer haritasına dön</Button></Link></Panel></div></AppShell>;

  const step = scenario.steps[stepIndex];
  const character = step.dialogue ? scenario.characters.find((item) => item.id === step.dialogue?.speakerId) : scenario.characters[stepIndex % scenario.characters.length];
  const progressPercent = started ? (stepIndex + (feedback ? 1 : 0)) / scenario.steps.length * 100 : 0;

  const answerStep = (answer: StepAnswer) => {
    if (feedback) return;
    const responseTimeMs = Date.now() - stepStartedAt.current;
    const attempt: AnswerAttempt = {
      id: makeId("answer"), scenarioId: scenario.id, stepId: step.id, questionType: step.type, category: scenario.category,
      correct: answer.correct, attemptNumber: 1, responseTimeMs, hintUsed: hintShown,
      vocabularyIds: step.targetVocabularyIds, errorType: answer.correct ? undefined : (answer.errorType ?? "comprehension") as LearningErrorType,
      level: profile.level, answer: answer.answer, createdAt: new Date().toISOString(),
    };
    recordAnswer(attempt);
    setSessionAttempts((current) => [...current, attempt]);
    setFeedback(answer);
    if (answer.correct) {
      const bonus = hintShown ? 0 : 3;
      setCorrectCount((value) => value + 1);
      setCombo((value) => value + 1);
      setEarnedXp((value) => value + step.xp + bonus);
      playGameSound("correct", settings.audio.soundEffects, settings.audio.volume);
    } else {
      setCombo(0);
      playGameSound("wrong", settings.audio.soundEffects, settings.audio.volume);
    }
  };

  const nextStep = () => {
    if (!feedback) return;
    if (stepIndex < scenario.steps.length - 1) {
      setStepIndex((index) => index + 1); setFeedback(null); setHintShown(false); stepStartedAt.current = Date.now();
      return;
    }
    const totalCorrect = correctCount;
    const accuracy = Math.round(totalCorrect / scenario.steps.length * 100);
    const xpEarned = Math.round(scenario.xpReward * (0.65 + accuracy / 285)) + earnedXp;
    const coinsEarned = Math.max(1, Math.round(scenario.coinReward * (0.6 + accuracy / 250)));
    const wrongVocabulary = [...new Set(sessionAttempts.filter((attempt) => !attempt.correct).flatMap((attempt) => attempt.vocabularyIds))];
    const result: MissionResult = {
      scenarioId: scenario.id, completedAt: new Date().toISOString(), score: totalCorrect * 1_000 + earnedXp,
      accuracy, correctAnswers: totalCorrect, totalSteps: scenario.steps.length, xpEarned, coinsEarned,
      hintsUsed: hintCount, firstTryCorrect: totalCorrect, newVocabularyIds: scenario.targetVocabularyIds,
      reviewVocabularyIds: wrongVocabulary, attempts: sessionAttempts,
    };
    completeScenario(result);
    playGameSound("complete", settings.audio.soundEffects, settings.audio.volume);
    router.push("/results");
  };

  if (!started) {
    return (
      <AppShell>
        <div className="app-frame flex flex-col py-6 sm:py-8 lg:min-h-[calc(100dvh-7rem)] xl:py-10">
          <Link href="/map" className="mb-5 inline-flex items-center gap-2 self-start text-xs font-semibold text-slate-400 hover:text-cyan"><ArrowLeft className="h-4 w-4" /> Kariyer haritası</Link>
          <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,.75fr)] xl:gap-8">
            <Panel className="relative overflow-hidden p-6 sm:p-9 lg:flex lg:items-center xl:p-12">
              <div className="absolute -right-14 -top-14 h-56 w-56 rounded-full bg-cyan/10 blur-3xl" />
              <div className="relative w-full">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-md border border-cyan/25 bg-cyan/10 px-2.5 py-1 font-display text-[9px] uppercase tracking-[0.2em] text-cyan">Mission {scenario.sortOrder.toString().padStart(2, "0")}</span><span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-display text-[9px] text-slate-400">{scenario.level}</span>{scenario.isBoss ? <span className="rounded-md border border-coral/30 bg-coral/10 px-2.5 py-1 font-display text-[9px] uppercase text-coral">Boss Battle</span> : null}</div>
                <p className="mt-8 font-display text-xs uppercase tracking-[0.22em] text-lime">{categoryLabels[scenario.category]}</p>
                <h1 className="mt-3 max-w-4xl text-[clamp(2.5rem,3.3vw,4.5rem)] font-black leading-[1.06] tracking-tight text-white">{scenario.title}</h1>
                <p className="mt-3 text-lg font-semibold text-cyan lg:text-xl">{scenario.titleTr}</p>
                <p className="mt-7 max-w-3xl text-base leading-7 text-slate-300 lg:text-lg lg:leading-8">{scenario.descriptionTr}</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 lg:text-base lg:leading-7">{scenario.descriptionEn}</p>
                <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-300 lg:text-sm"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan" /> {scenario.estimatedMinutes} dakika</span><span className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-lime" /> {scenario.steps.length} aşama</span><span className="flex items-center gap-2"><Zap className="h-4 w-4 text-lime" /> {scenario.xpReward}+ XP</span><span className="flex items-center gap-2"><Coins className="h-4 w-4 text-amber" /> {scenario.coinReward} coin</span></div>
                <Button size="lg" className="mt-9" onClick={() => { setStarted(true); stepStartedAt.current = Date.now(); }}>Vardiyayı başlat <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </Panel>
            <div className="flex flex-col justify-center gap-5">
              <Panel label="Crew channel"><div className="p-5 pt-4"><div className="space-y-3">{scenario.characters.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"><div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan/10 text-2xl">{avatarPalette[member.avatar] ?? "🧑‍💼"}</div><div><p className="text-sm font-bold text-white">{member.name}</p><p className="text-[11px] text-slate-500">{member.role}</p></div><span className="ml-auto h-2 w-2 rounded-full bg-lime shadow-lime" /></div>)}</div></div></Panel>
              <Panel label="Target vocabulary"><div className="p-5 pt-4"><div className="flex flex-wrap gap-2">{scenario.targetVocabularyIds.map(getVocabularyById).filter(Boolean).map((word) => <span key={word!.id} className="rounded-lg border border-cyan/15 bg-cyan/5 px-2.5 py-1.5 text-xs text-cyan">{word!.term}</span>)}</div></div></Panel>
              {scenario.communicationOnly ? <div className="flex gap-3 rounded-xl border border-amber/20 bg-amber/[0.08] p-4 text-xs leading-5 text-amber"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Bu görev yalnızca güvenlik iletişimi pratiğidir; operasyon veya ekipman talimatı içermez.</div> : null}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="app-frame py-5 sm:py-8 xl:py-9">
        <div className="mb-4 grid gap-3 rounded-xl border border-white/10 bg-panel/80 p-3 backdrop-blur sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-4">
          <Link href="/map" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Görevden çık</span></Link>
          <div><div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-500"><span>{scenario.title}</span><span>{stepIndex + 1}/{scenario.steps.length}</span></div><ProgressBar value={progressPercent} color="cyan" /></div>
          <div className="flex items-center justify-end gap-2"><span className="rounded-lg border border-lime/20 bg-lime/10 px-2.5 py-2 font-display text-[10px] text-lime">+{earnedXp} XP</span>{combo >= 2 ? <motion.span initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="rounded-lg border border-amber/25 bg-amber/10 px-2.5 py-2 font-display text-[10px] text-amber">COMBO ×{combo}</motion.span> : null}</div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[clamp(300px,22vw,380px)_minmax(0,1fr)] xl:gap-6">
          <aside className="space-y-4">
            <Panel className="overflow-hidden"><div className="relative grid min-h-52 place-items-center bg-gradient-to-b from-cyan/10 to-transparent p-5"><div className="absolute inset-0 bg-[url('/pipeline-pattern.svg')] bg-cover opacity-20" /><motion.div key={character?.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative grid h-28 w-28 place-items-center rounded-3xl border border-cyan/25 bg-[#102b39] text-6xl shadow-[0_0_40px_rgba(85,246,255,.12)]">{avatarPalette[character?.avatar ?? ""] ?? "🧑‍💼"}<span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-panel bg-lime" /></motion.div></div><div className="border-t border-white/[0.08] p-4 text-center"><p className="font-bold text-white">{character?.name ?? "ShiftQuest AI"}</p><p className="mt-1 text-xs text-cyan">{character?.role ?? "Mission System"}</p></div></Panel>
            <Panel label="Adaptive difficulty"><div className="p-4 pt-3"><div className="flex items-start gap-3">{adaptiveMode === "support" ? <BookOpen className="h-5 w-5 text-lime" /> : adaptiveMode === "challenge" ? <Target className="h-5 w-5 text-coral" /> : <Bot className="h-5 w-5 text-cyan" />}<div><p className="text-xs font-bold text-white">{adaptiveMode === "support" ? "Support mode" : adaptiveMode === "challenge" ? "Challenge mode" : "Balanced mode"}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{adaptiveMode === "support" ? "Türkçe ipuçları ve kelime desteği etkin." : adaptiveMode === "challenge" ? "İpuçları azaltıldı; yakın seçeneklere dikkat et." : "Zorluk son performansına uygun."}</p></div></div></div></Panel>
          </aside>

          <motion.section key={step.id} initial={{ opacity: 0, x: 18 }} animate={feedback && !feedback.correct && settings.accessibility.animations ? { opacity: 1, x: [0, -5, 5, -3, 0] } : { opacity: 1, x: 0 }} className="min-w-0">
            <Panel className="p-5 sm:p-7 lg:min-h-[520px] lg:p-9 xl:p-10">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="font-display text-[10px] uppercase tracking-[0.23em] text-cyan">{stepLabels[step.type]} // STEP {stepIndex + 1}</p><h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{step.title}</h2><p className="mt-2 text-sm text-slate-500">{step.instructionTr}</p></div>{step.type !== "listening" && (step.ttsText || step.dialogue?.ttsText) ? <AudioPlayer text={step.ttsText ?? step.dialogue!.ttsText} /> : null}</div>

              {step.dialogue ? <div className="mb-5 rounded-2xl rounded-tl-sm border border-cyan/20 bg-cyan/[0.055] p-4 sm:p-5"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan">{character?.name} // incoming</p><p className="text-base leading-7 text-white"><InteractiveText text={step.dialogue.text} vocabularyIds={step.targetVocabularyIds} scenarioId={scenario.id} /></p>{(profile.level === "B1" || adaptiveMode === "support") && adaptiveMode !== "challenge" ? <p className="mt-3 border-t border-white/[0.08] pt-3 text-sm text-slate-400">{step.dialogue.translationTr}</p> : null}</div> : null}

              <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"><MessageSquareText className="h-3.5 w-3.5" /> Görev</div><p className="text-base font-semibold leading-7 text-white"><InteractiveText text={step.prompt} vocabularyIds={step.targetVocabularyIds} scenarioId={scenario.id} /></p>{profile.level === "B1" || adaptiveMode === "support" ? <p className="mt-2 text-sm text-slate-500">{step.promptTr}</p> : null}</div>

              <AnimatePresence mode="wait">
                {!feedback ? <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><StepInteraction step={step} onAnswer={answerStep} /><div className="mt-5 border-t border-white/[0.08] pt-4"><button disabled={hintShown} onClick={() => { if (!hintShown) { setHintShown(true); setHintCount((count) => count + 1); } }} className="flex items-center gap-2 text-xs font-semibold text-amber transition hover:text-white disabled:cursor-default disabled:text-slate-500"><Lightbulb className="h-4 w-4" /> {hintShown ? step.hint.tr ?? step.hint.en : "İpucu kullan"}</button></div></motion.div> : (
                  <motion.div key="feedback" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-2xl border p-5", feedback.correct ? "border-lime/30 bg-lime/[0.07]" : "border-coral/30 bg-coral/[0.07]")}>
                    <div className="flex items-start gap-3">{feedback.correct ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-lime" /> : <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-coral" />}<div className="flex-1"><h3 className={cn("font-display text-sm font-black uppercase tracking-[0.12em]", feedback.correct ? "text-lime" : "text-coral")}>{feedback.correct ? "Clear communication!" : "Not quite — let’s tune it"}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{feedback.feedback || (feedback.correct ? step.explanationTr : step.explanationTr)}</p>{!feedback.correct ? <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[0.17em] text-slate-500">Neden?</p><p className="mt-1.5 text-sm text-slate-300">{step.explanationTr}</p></div> : null}{feedback.naturalAlternative ? <div className="mt-3 rounded-lg border border-cyan/15 bg-cyan/5 p-3"><p className="text-[10px] uppercase tracking-[0.17em] text-cyan">Daha doğal ifade</p><p className="mt-1.5 text-sm font-medium text-white">{feedback.naturalAlternative}</p></div> : null}</div></div>
                    <div className="mt-5 flex justify-end"><Button onClick={nextStep}>{stepIndex === scenario.steps.length - 1 ? "Görevi tamamla" : "Sonraki aşama"} <ArrowRight className="h-4 w-4" /></Button></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </motion.section>
        </div>
      </div>
    </AppShell>
  );
}
