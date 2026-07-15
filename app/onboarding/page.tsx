"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Factory,
  FlaskConical,
  Gauge,
  HardHat,
  Languages,
  Leaf,
  Microscope,
  Radio,
  Sparkles,
  UserRound,
  Volume2,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { BrandLockup } from "@/components/landing/brand-lockup";
import { useGameStore } from "@/features/game/store";
import { useCloudSync } from "@/features/sync/cloud-sync-provider";
import type { AccentPreference, CareerArea, CEFRLevel } from "@/types";

type DailyGoal = 5 | 10 | 15 | 20;
type IconType = LucideIcon;

type FormState = {
  level: CEFRLevel;
  careerArea: CareerArea;
  accent: AccentPreference;
  dailyGoalMinutes: DailyGoal;
  avatarId: string;
  displayName: string;
};

const steps = [
  { short: "Level", label: "English level", icon: Gauge },
  { short: "Route", label: "Career route", icon: Factory },
  { short: "Voice", label: "Voice preference", icon: Volume2 },
  { short: "Goal", label: "Daily target", icon: Clock3 },
  { short: "ID", label: "Engineer ID", icon: UserRound },
] as const;

const careerOptions: Array<{
  id: CareerArea;
  title: string;
  description: string;
  icon: IconType;
}> = [
  { id: "general", title: "General chemical engineering", description: "A balanced route across teams", icon: Beaker },
  { id: "production", title: "Production", description: "Shift and floor communication", icon: Factory },
  { id: "process", title: "Process", description: "Updates, analysis and handovers", icon: Gauge },
  { id: "quality", title: "Quality", description: "Documents, review and approval", icon: ClipboardCheck },
  { id: "laboratory", title: "Laboratory", description: "Samples, results and teamwork", icon: Microscope },
  { id: "pharma", title: "Pharmaceutical", description: "Regulated workplace dialogue", icon: FlaskConical },
];

const avatars: Array<{
  id: string;
  name: string;
  role: string;
  icon: IconType;
  color: string;
  glow: string;
}> = [
  { id: "nova", name: "Nova", role: "Systems thinker", icon: Sparkles, color: "from-cyan/30 to-blue-500/10", glow: "border-cyan/50 text-cyan" },
  { id: "relay", name: "Relay", role: "Clear communicator", icon: Radio, color: "from-lime/25 to-emerald-500/10", glow: "border-lime/50 text-lime" },
  { id: "forge", name: "Forge", role: "Floor problem-solver", icon: HardHat, color: "from-amber/30 to-orange-500/10", glow: "border-amber/50 text-amber" },
  { id: "flux", name: "Flux", role: "Process explorer", icon: Waves, color: "from-violet-400/25 to-fuchsia-500/10", glow: "border-violet-400/50 text-violet-300" },
  { id: "core", name: "Core", role: "Steady operator", icon: Zap, color: "from-coral/25 to-red-500/10", glow: "border-coral/50 text-coral" },
  { id: "sage", name: "Sage", role: "Quality-minded", icon: Leaf, color: "from-emerald-300/25 to-teal-500/10", glow: "border-emerald-300/50 text-emerald-300" },
];

function ChoiceCard({
  checked,
  name,
  value,
  onChange,
  icon: Icon,
  eyebrow,
  title,
  description,
  detail,
}: {
  checked: boolean;
  name: string;
  value: string;
  onChange: () => void;
  icon: IconType;
  eyebrow?: string;
  title: string;
  description: string;
  detail?: string;
}) {
  return (
    <label className={`group relative flex cursor-pointer gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${checked ? "border-cyan/60 bg-cyan/[0.09] shadow-[0_0_28px_rgba(85,246,255,0.08)]" : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.045]"}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl border transition ${checked ? "border-cyan/40 bg-cyan/15 text-cyan" : "border-white/10 bg-white/5 text-white/40 group-hover:text-white/70"}`}>
        <Icon className="size-5" aria-hidden={true} />
      </span>
      <span className="min-w-0 flex-1">
        {eyebrow && <span className={`block text-[9px] font-black uppercase tracking-[0.18em] ${checked ? "text-cyan" : "text-white/35"}`}>{eyebrow}</span>}
        <span className="mt-0.5 block font-display text-sm font-black uppercase tracking-[0.02em] text-white">{title}</span>
        <span className="mt-1.5 block text-xs leading-5 text-white/45">{description}</span>
        {detail && <span className="mt-3 block text-[10px] font-bold text-white/65">{detail}</span>}
      </span>
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition ${checked ? "border-cyan bg-cyan text-ink" : "border-white/20"}`}>
        {checked && <Check className="size-3.5" aria-hidden="true" />}
      </span>
    </label>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const completeOnboarding = useGameStore((state) => state.completeOnboarding);
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);
  const { status: cloudStatus } = useCloudSync();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [form, setForm] = useState<FormState>({
    level: "B1",
    careerArea: "general",
    accent: "american",
    dailyGoalMinutes: 10,
    avatarId: "nova",
    displayName: "",
  });

  useEffect(() => {
    const cloudReady = cloudStatus !== "loading" && cloudStatus !== "idle";
    if (hydrated && cloudReady && profile?.onboardingComplete) router.replace("/map");
  }, [cloudStatus, hydrated, profile?.onboardingComplete, router]);

  const goTo = (nextStep: number) => {
    if (nextStep < 0 || nextStep >= steps.length) return;
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const onNext = () => {
    if (step === steps.length - 1) return;
    goTo(step + 1);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step !== steps.length - 1) {
      onNext();
      return;
    }

    const displayName = form.displayName.trim();
    if (displayName.length < 2) {
      setNameError("Enter at least 2 characters for your engineer ID.");
      return;
    }

    setSubmitting(true);
    completeOnboarding({ ...form, displayName });
    router.push("/map");
  };

  const stage = steps[step];

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white selection:bg-cyan selection:text-ink">
      <div className="pointer-events-none absolute inset-0 bg-arcade-grid bg-[size:50px_50px] opacity-[0.16]" />
      <div className="pointer-events-none absolute -left-60 top-1/4 size-[520px] rounded-full bg-cyan/[0.08] blur-[110px]" />
      <div className="pointer-events-none absolute -right-60 bottom-0 size-[520px] rounded-full bg-lime/[0.06] blur-[120px]" />

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label="Return to ShiftQuest home"><BrandLockup compact /></Link>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-lime" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Recruitment terminal online</span>
        </div>
        <span className="font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl gap-6 px-5 pb-8 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <aside className="hidden py-12 lg:block">
          <p className="text-[9px] font-black uppercase tracking-[0.23em] text-cyan">Engineer setup</p>
          <h1 className="mt-4 font-display text-3xl font-black uppercase leading-none tracking-[-0.04em]">Build your player profile.</h1>
          <p className="mt-4 text-sm leading-6 text-white/45">Five quick choices tune the language, missions and audio to your route.</p>

          <ol className="mt-12 space-y-1" aria-label="Onboarding progress">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const done = index < step;
              const active = index === step;
              return (
                <li key={item.short} className="relative flex min-h-[68px] gap-4">
                  {index < steps.length - 1 && <span className={`absolute left-[17px] top-9 h-[34px] w-px ${done ? "bg-cyan/50" : "bg-white/10"}`} />}
                  <button
                    type="button"
                    onClick={() => index <= step && goTo(index)}
                    disabled={index > step}
                    aria-current={active ? "step" : undefined}
                    className="group flex w-full items-start gap-4 text-left disabled:cursor-default"
                  >
                    <span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-xl border transition ${active ? "border-cyan/60 bg-cyan text-ink shadow-[0_0_22px_rgba(85,246,255,0.25)]" : done ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 bg-panel text-white/25"}`}>
                      {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <span className="pt-0.5">
                      <span className={`block text-[9px] font-black uppercase tracking-[0.18em] ${active ? "text-cyan" : "text-white/30"}`}>Checkpoint {index + 1}</span>
                      <span className={`mt-1 block text-sm font-bold ${active || done ? "text-white" : "text-white/35"}`}>{item.label}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Cloud save</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-white/60"><CheckCircle2 className="size-4 text-lime" /> Progress syncs to your account.</div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col lg:py-8">
          <div className="mb-5 flex gap-1.5 lg:hidden" aria-hidden="true">
            {steps.map((item, index) => <span key={item.short} className={`h-1.5 flex-1 rounded-full transition ${index <= step ? "bg-cyan" : "bg-white/10"}`} />)}
          </div>

          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1822]/90 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/35"><span className="size-1.5 rounded-full bg-cyan" /> Calibration / {stage.short}</div>
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-display text-[8px] font-black uppercase tracking-[0.13em] text-white/35">Auto-save</span>
            </div>

            <div className="relative flex-1 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : direction * -20 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                  className="mx-auto max-w-3xl"
                >
                  {step === 0 && (
                    <fieldset>
                      <legend className="sr-only">Choose your English level</legend>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan">Checkpoint 01</p>
                      <h2 className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] sm:text-5xl">Where should we set the difficulty?</h2>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">This changes dialogue length, hints and how close the answer choices feel. You can change it later.</p>
                      <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <ChoiceCard checked={form.level === "B1"} name="level" value="B1" onChange={() => setForm((current) => ({ ...current, level: "B1" }))} icon={Building2} eyebrow="Supported route" title="B1 · Intermediate" description="Clear, shorter conversations with extra Turkish support." detail="3 choices · frequent hints · slower audio available" />
                        <ChoiceCard checked={form.level === "B2"} name="level" value="B2" onChange={() => setForm((current) => ({ ...current, level: "B2" }))} icon={Zap} eyebrow="Challenge route" title="B2 · Upper intermediate" description="More natural dialogue, close choices and nuanced tone." detail="4 choices · fewer hints · complex roleplay" />
                      </div>
                    </fieldset>
                  )}

                  {step === 1 && (
                    <fieldset>
                      <legend className="sr-only">Choose your career route</legend>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan">Checkpoint 02</p>
                      <h2 className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] sm:text-5xl">Pick your first career route.</h2>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">Your route recommends the most relevant missions first. The whole campus remains available as you progress.</p>
                      <div className="mt-8 grid gap-3 md:grid-cols-2">
                        {careerOptions.map((option) => <ChoiceCard key={option.id} checked={form.careerArea === option.id} name="careerArea" value={option.id} onChange={() => setForm((current) => ({ ...current, careerArea: option.id }))} icon={option.icon} title={option.title} description={option.description} />)}
                      </div>
                    </fieldset>
                  )}

                  {step === 2 && (
                    <fieldset>
                      <legend className="sr-only">Choose your preferred English accent</legend>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan">Checkpoint 03</p>
                      <h2 className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] sm:text-5xl">Tune the comms channel.</h2>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">Choose the voice you want to hear most often. Some missions will still introduce different speakers.</p>
                      <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <ChoiceCard checked={form.accent === "american"} name="accent" value="american" onChange={() => setForm((current) => ({ ...current, accent: "american" }))} icon={Radio} eyebrow="Channel US-01" title="American English" description="General American pronunciation for dialogue and phrase playback." detail="Example: schedule /ˈskedʒuːl/" />
                        <ChoiceCard checked={form.accent === "british"} name="accent" value="british" onChange={() => setForm((current) => ({ ...current, accent: "british" }))} icon={Waves} eyebrow="Channel UK-01" title="British English" description="Modern British pronunciation for dialogue and phrase playback." detail="Example: schedule /ˈʃedjuːl/" />
                      </div>
                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber/15 bg-amber/[0.05] p-4 text-xs leading-5 text-white/50"><Languages className="mt-0.5 size-4 shrink-0 text-amber" /> Mission text uses widely understood international workplace English whichever voice you select.</div>
                    </fieldset>
                  )}

                  {step === 3 && (
                    <fieldset>
                      <legend className="sr-only">Choose your daily practice goal</legend>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan">Checkpoint 04</p>
                      <h2 className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] sm:text-5xl">Set a sustainable shift.</h2>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">A short daily run is enough to build momentum. You will never lose XP for missing a day or making a mistake.</p>
                      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {([5, 10, 15, 20] as DailyGoal[]).map((minutes, index) => {
                          const checked = form.dailyGoalMinutes === minutes;
                          const labels = ["Quick check-in", "Steady rhythm", "Focused run", "Deep session"];
                          return (
                            <label key={minutes} className={`relative cursor-pointer overflow-hidden rounded-2xl border p-4 text-center transition sm:p-6 ${checked ? "border-lime/60 bg-lime/[0.09] shadow-[0_0_28px_rgba(199,255,74,0.08)]" : "border-white/10 bg-white/[0.025] hover:border-white/25"}`}>
                              <input type="radio" name="dailyGoal" value={minutes} checked={checked} onChange={() => setForm((current) => ({ ...current, dailyGoalMinutes: minutes }))} className="sr-only" />
                              <Clock3 className={`mx-auto size-5 ${checked ? "text-lime" : "text-white/30"}`} />
                              <span className="mt-5 block font-display text-3xl font-black">{minutes}</span>
                              <span className={`mt-1 block text-[9px] font-black uppercase tracking-[0.15em] ${checked ? "text-lime" : "text-white/35"}`}>minutes</span>
                              <span className="mt-4 block text-[10px] text-white/45">{labels[index]}</span>
                              {checked && <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-lime text-ink"><Check className="size-3.5" /></span>}
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-7 rounded-2xl border border-white/10 bg-black/10 p-4">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.16em] text-white/35"><span>Daily capacity</span><span className="text-lime">{form.dailyGoalMinutes <= 5 ? "1 micro mission" : form.dailyGoalMinutes <= 10 ? "1 full mission" : form.dailyGoalMinutes <= 15 ? "1 mission + review" : "2 missions"}</span></div>
                        <div className="mt-3 flex gap-1.5">{Array.from({ length: 4 }).map((_, index) => <span key={index} className={`h-2 flex-1 rounded-sm ${index < form.dailyGoalMinutes / 5 ? "bg-lime" : "bg-white/10"}`} />)}</div>
                      </div>
                    </fieldset>
                  )}

                  {step === 4 && (
                    <fieldset>
                      <legend className="sr-only">Choose an avatar and enter your display name</legend>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan">Final checkpoint</p>
                      <h2 className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] sm:text-5xl">Issue your engineer ID.</h2>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">Choose the operator icon that will represent you across the campus.</p>

                      <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {avatars.map((avatar) => {
                          const Icon = avatar.icon;
                          const checked = form.avatarId === avatar.id;
                          return (
                            <label key={avatar.id} className={`group relative cursor-pointer rounded-2xl border p-2.5 text-center transition sm:p-3 ${checked ? `${avatar.glow} bg-white/[0.06] shadow-[0_0_28px_rgba(85,246,255,0.08)]` : "border-white/10 bg-white/[0.025] text-white/40 hover:border-white/25"}`}>
                              <input type="radio" name="avatar" value={avatar.id} checked={checked} onChange={() => setForm((current) => ({ ...current, avatarId: avatar.id }))} className="sr-only" />
                              <span className={`mx-auto grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br ${avatar.color}`}><Icon className="size-6 sm:size-7" aria-hidden={true} /></span>
                              <span className="mt-2 block font-display text-[9px] font-black uppercase text-white">{avatar.name}</span>
                              {checked && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-cyan text-ink"><Check className="size-2.5" /></span>}
                            </label>
                          );
                        })}
                      </div>

                      <div className="mt-7">
                        <label htmlFor="displayName" className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Display name / callsign</label>
                        <div className={`mt-2 flex items-center rounded-2xl border bg-black/10 px-4 transition focus-within:border-cyan/60 ${nameError ? "border-coral/60" : "border-white/10"}`}>
                          <span className="font-display text-xs font-black text-cyan">SQ-</span>
                          <input id="displayName" autoComplete="nickname" maxLength={24} value={form.displayName} onChange={(event) => { setNameError(""); setForm((current) => ({ ...current, displayName: event.target.value })); }} placeholder="Your name" className="min-w-0 flex-1 bg-transparent px-2 py-4 text-sm font-bold text-white outline-none placeholder:text-white/20" aria-describedby={nameError ? "name-error" : "name-help"} aria-invalid={Boolean(nameError)} />
                          <span className="text-[9px] font-bold text-white/25">{form.displayName.length}/24</span>
                        </div>
                        {nameError ? <p id="name-error" className="mt-2 text-xs text-coral">{nameError}</p> : <p id="name-help" className="mt-2 text-[10px] text-white/35">This is stored locally and shown in your game HUD.</p>}
                      </div>

                      <div className="mt-6 grid gap-2 rounded-2xl border border-cyan/15 bg-cyan/[0.04] p-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 sm:grid-cols-3">
                        <span><span className="text-cyan">Level</span> · {form.level}</span>
                        <span><span className="text-cyan">Voice</span> · {form.accent === "american" ? "American" : "British"}</span>
                        <span><span className="text-cyan">Goal</span> · {form.dailyGoalMinutes} min/day</span>
                      </div>
                    </fieldset>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-black/10 px-5 py-4 sm:px-8 sm:py-5">
              <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0 || submitting} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.15em] text-white/45 transition hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-0"><ArrowLeft className="size-4" /> Back</button>
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-white/25 sm:block">Use Tab + Enter to navigate</span>
              <button type="submit" disabled={submitting} className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime px-5 font-display text-[10px] font-black uppercase tracking-[0.13em] text-ink shadow-[0_0_24px_rgba(199,255,74,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(199,255,74,0.28)] disabled:cursor-wait disabled:opacity-60 sm:px-7">
                {step === steps.length - 1 ? (submitting ? "Launching..." : "Enter campus") : "Next checkpoint"}
                {step === steps.length - 1 ? <Sparkles className="size-4" /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
