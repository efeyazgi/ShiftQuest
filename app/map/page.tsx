"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Coins,
  Crown,
  Factory,
  Flame,
  FlaskConical,
  GraduationCap,
  HardHat,
  LockKeyhole,
  MapPinned,
  MonitorDot,
  Play,
  Presentation,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { careerRegions, careerTitles, scenarios } from "@/data";
import { useGameStore } from "@/features/game/store";
import { useCloudSync } from "@/features/sync/cloud-sync-provider";
import type { CampusLocation, Scenario, ScenarioCategory } from "@/types";

const locationIcons: Record<CampusLocation, LucideIcon> = {
  "office-hub": Building2,
  "production-floor": Factory,
  "control-room": MonitorDot,
  "quality-lab": FlaskConical,
  "meeting-room": Presentation,
  "safety-zone": ShieldCheck,
  "maintenance-area": Wrench,
  "training-center": GraduationCap,
};

const categoryMeta: Record<ScenarioCategory, { label: string; className: string }> = {
  office: { label: "Office comms", className: "border-cyan/25 bg-cyan/10 text-cyan" },
  production: { label: "Production", className: "border-amber/25 bg-amber/10 text-amber" },
  meeting: { label: "Meetings", className: "border-violet-400/25 bg-violet-400/10 text-violet-300" },
  quality: { label: "Quality", className: "border-emerald-300/25 bg-emerald-300/10 text-emerald-300" },
  safety: { label: "Safety", className: "border-coral/25 bg-coral/10 text-coral" },
  career: { label: "Career + social", className: "border-pink-300/25 bg-pink-300/10 text-pink-300" },
};

const careerCategory: Record<string, ScenarioCategory | undefined> = {
  general: undefined,
  production: "production",
  process: "production",
  quality: "quality",
  laboratory: "quality",
  pharma: "quality",
};

const careerLabel: Record<string, string> = {
  general: "General chemical engineering",
  production: "Production",
  process: "Process engineering",
  quality: "Quality",
  laboratory: "Laboratory",
  pharma: "Pharmaceutical",
};

type MissionState = {
  unlocked: boolean;
  completed: boolean;
  inProgress: boolean;
  xpRemaining: number;
  missingIds: string[];
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function MapLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-6 text-center text-white">
      <div>
        <div className="relative mx-auto grid size-16 place-items-center rounded-2xl border border-cyan/30 bg-cyan/10 text-cyan shadow-[0_0_40px_rgba(85,246,255,0.16)]">
          <Radio className="size-7 animate-pulse" aria-hidden={true} />
          <span className="absolute -inset-2 animate-ping rounded-[1.25rem] border border-cyan/15" />
        </div>
        <p className="mt-6 font-display text-xs font-black uppercase tracking-[0.2em]">Connecting to campus</p>
        <p className="mt-2 text-xs text-white/35">Restoring your saved shift data…</p>
      </div>
    </main>
  );
}

function RequirementText({ state }: { state: MissionState }) {
  if (state.completed) return <span className="text-lime">Mission complete</span>;
  if (state.inProgress) return <span className="text-cyan">Continue your run</span>;
  if (state.unlocked) return <span className="text-white/45">Ready to launch</span>;
  if (state.xpRemaining > 0 && state.missingIds.length > 0) {
    return <span>{state.xpRemaining} XP + {state.missingIds.length} prerequisite{state.missingIds.length > 1 ? "s" : ""}</span>;
  }
  if (state.xpRemaining > 0) return <span>Earn {state.xpRemaining} more XP</span>;
  return <span>Complete {state.missingIds.length} prerequisite mission{state.missingIds.length > 1 ? "s" : ""}</span>;
}

function MissionCard({
  scenario,
  state,
  index,
  recommended,
  isDaily,
}: {
  scenario: Scenario;
  state: MissionState;
  index: number;
  recommended: boolean;
  isDaily: boolean;
}) {
  const category = categoryMeta[scenario.category];
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl border font-display text-[10px] font-black ${state.completed ? "border-lime/25 bg-lime/10 text-lime" : state.unlocked ? category.className : "border-white/10 bg-white/[0.025] text-white/25"}`}>
            {state.completed ? <Check className="size-4" aria-hidden={true} /> : state.unlocked ? String(index + 1).padStart(2, "0") : <LockKeyhole className="size-4" aria-hidden={true} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${state.unlocked || state.completed ? category.className : "border-white/10 bg-white/[0.025] text-white/25"}`}>{category.label}</span>
              <span className={`rounded-full border px-2 py-1 font-display text-[8px] font-black ${scenario.level === "B1" ? "border-cyan/20 bg-cyan/[0.06] text-cyan/70" : "border-lime/20 bg-lime/[0.06] text-lime/70"}`}>{scenario.level}</span>
              {scenario.isBoss && <span className="flex items-center gap-1 rounded-full border border-coral/25 bg-coral/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-coral"><Crown className="size-2.5" /> Boss</span>}
              {recommended && !state.completed && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber"><Star className="size-2.5 fill-current" /> Your route</span>}
              {isDaily && !state.completed && <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.12em] text-lime"><Sparkles className="size-2.5" /> Daily pick</span>}
            </div>
            <h3 className={`mt-3 font-display text-sm font-black uppercase leading-5 tracking-[0.01em] ${state.unlocked || state.completed ? "text-white" : "text-white/38"}`}>{scenario.title}</h3>
            <p className="mt-1 text-[10px] font-medium text-white/30">{scenario.titleTr}</p>
          </div>
        </div>
        {state.completed ? <BadgeCheck className="size-5 shrink-0 text-lime" aria-label="Completed" /> : state.unlocked ? <ChevronRight className="size-5 shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-cyan" aria-hidden={true} /> : null}
      </div>

      <p className={`mt-5 line-clamp-2 text-xs leading-5 ${state.unlocked || state.completed ? "text-white/45" : "text-white/25"}`}>{scenario.descriptionEn}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.07] pt-4 text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">
        <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" /> {scenario.estimatedMinutes} min</span>
        <span className="flex items-center gap-1.5"><Zap className="size-3.5" /> {scenario.xpReward} XP</span>
        <span className="flex items-center gap-1.5"><Coins className="size-3.5" /> {scenario.coinReward}</span>
        <span className="ml-auto text-[9px] normal-case tracking-normal"><RequirementText state={state} /></span>
      </div>
    </>
  );

  const cardClass = `group relative block h-full overflow-hidden rounded-2xl border p-5 transition ${
    state.completed
      ? "border-lime/20 bg-lime/[0.035] hover:border-lime/35"
      : state.unlocked
        ? "border-white/10 bg-white/[0.028] hover:-translate-y-0.5 hover:border-cyan/30 hover:bg-white/[0.045]"
        : "border-white/[0.07] bg-black/[0.12]"
  }`;

  return state.unlocked ? (
    <Link href={`/scenario/${scenario.id}`} className={cardClass} aria-label={`${state.inProgress ? "Continue" : "Start"} ${scenario.title}`}>
      {content}
    </Link>
  ) : (
    <article className={cardClass} aria-label={`${scenario.title}, locked`}>
      {content}
    </article>
  );
}

export default function CareerMapPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const profile = useGameStore((state) => state.profile);
  const progress = useGameStore((state) => state.progress);
  const hydrated = useGameStore((state) => state.hydrated);
  const { status: cloudStatus } = useCloudSync();
  const cloudLoading = cloudStatus === "loading" || cloudStatus === "idle";

  useEffect(() => {
    if (hydrated && !cloudLoading && !profile?.onboardingComplete) router.replace("/onboarding");
  }, [cloudLoading, hydrated, profile, router]);

  const missionStates = useMemo(() => {
    const completed = new Set(progress.completedScenarioIds);
    return new Map<string, MissionState>(
      scenarios.map((scenario) => {
        const missingIds = scenario.unlock.requiredScenarioIds.filter((id) => !completed.has(id));
        const xpRemaining = Math.max(0, scenario.unlock.requiredXp - progress.totalXp);
        const isCompleted = completed.has(scenario.id);
        const stored = progress.scenarioProgress[scenario.id];
        return [
          scenario.id,
          {
            unlocked: isCompleted || (xpRemaining === 0 && missingIds.length === 0),
            completed: isCompleted,
            inProgress: stored?.status === "in-progress",
            xpRemaining,
            missingIds,
          },
        ];
      }),
    );
  }, [progress.completedScenarioIds, progress.scenarioProgress, progress.totalXp]);

  const dailyMission = useMemo(() => {
    if (!profile) return undefined;
    const preferredCategory = careerCategory[profile.careerArea];
    const available = scenarios.filter((scenario) => {
      const state = missionStates.get(scenario.id);
      return state?.unlocked && !state.completed;
    });
    return (
      available.find((scenario) => scenario.level === profile.level && scenario.category === preferredCategory) ??
      available.find((scenario) => scenario.level === profile.level) ??
      available.find((scenario) => scenario.category === preferredCategory) ??
      available[0] ??
      scenarios.find((scenario) => scenario.level === profile.level)
    );
  }, [missionStates, profile]);

  if (!hydrated || cloudLoading) return <MapLoading />;
  if (!profile?.onboardingComplete) return <MapLoading />;

  const currentTitleIndex = Math.max(0, careerTitles.findIndex((title) => title.id === progress.currentTitleId));
  const currentTitle = careerTitles[currentTitleIndex] ?? careerTitles[0];
  const nextTitle = careerTitles[currentTitleIndex + 1];
  const titleBand = nextTitle ? nextTitle.minimumXp - currentTitle.minimumXp : 1;
  const titleProgress = nextTitle ? Math.max(0, Math.min(100, ((progress.totalXp - currentTitle.minimumXp) / titleBand) * 100)) : 100;
  const nextXp = nextTitle ? Math.max(0, nextTitle.minimumXp - progress.totalXp) : 0;
  const todayMinutes = progress.dailyMinutes[localDateKey()] ?? 0;
  const dailyPercent = Math.min(100, (todayMinutes / profile.dailyGoalMinutes) * 100);
  const completedCount = progress.completedScenarioIds.length;
  const routeCategory = careerCategory[profile.careerArea];

  return (
    <AppShell>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_18%_10%,rgba(85,246,255,0.09),transparent_38%),radial-gradient(circle_at_85%_22%,rgba(199,255,74,0.055),transparent_30%)]" />

        <div className="relative mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-10">
          <motion.header
            data-tour="map-welcome"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
            className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-lime"><span className="size-1.5 animate-pulse rounded-full bg-lime" /> Campus online</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-display text-[9px] font-black text-white/45">ROUTE / {profile.level}</span>
              </div>
              <h1 className="mt-5 font-display text-3xl font-black uppercase leading-none tracking-[-0.045em] sm:text-5xl">Welcome back, <span className="text-cyan text-glow">{profile.displayName}</span>.</h1>
              <p className="mt-3 text-sm text-white/45">Your {careerLabel[profile.careerArea]} route is ready. Choose a mission or launch today’s recommended shift.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[470px] sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">Missions</p>
                <p className="mt-2 font-display text-xl font-black sm:text-2xl">{completedCount}<span className="text-sm text-white/20">/{scenarios.length}</span></p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">Streak</p>
                <p className="mt-2 flex items-center gap-1.5 font-display text-xl font-black sm:text-2xl"><Flame className="size-5 text-amber" /> {progress.streakDays}<span className="hidden text-[9px] text-white/25 sm:inline"> days</span></p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/30">Vault</p>
                <p className="mt-2 flex items-center gap-1.5 font-display text-xl font-black sm:text-2xl"><BookOpen className="size-5 text-cyan" /> {Object.keys(progress.vocabularyProgress).length}</p>
              </div>
            </div>
          </motion.header>

          <div className="mt-7 grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
            <motion.section
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 0.07 }}
              className="panel relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a1923]/90 p-5 shadow-neon sm:p-7"
            >
              <div className="absolute inset-0 bg-[url('/pipeline-pattern.svg')] opacity-[0.045]" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-cyan/25 bg-cyan/10 text-cyan"><HardHat className="size-5" /></span>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-cyan">Current in-game title</p>
                    <h2 className="mt-1 font-display text-lg font-black uppercase sm:text-xl">{currentTitle.name}</h2>
                  </div>
                </div>
                <div className="sm:min-w-64">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.13em] text-white/35"><span>{progress.totalXp.toLocaleString()} XP</span><span>{nextTitle ? `${nextXp} to ${nextTitle.name}` : "Max title"}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${titleProgress}%` }} transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-cyan to-lime shadow-[0_0_14px_rgba(199,255,74,0.35)]" /></div>
                </div>
              </div>
              <p className="relative mt-5 border-t border-white/[0.07] pt-4 text-[9px] leading-4 text-white/28">Game progression title only — it does not represent a professional qualification or workplace authority.</p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 0.12 }}
              className="rounded-3xl border border-lime/15 bg-lime/[0.035] p-5 sm:p-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative grid size-14 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#c7ff4a ${dailyPercent}%, rgba(255,255,255,.08) ${dailyPercent}% 100%)` }}>
                  <span className="grid size-[46px] place-items-center rounded-full bg-[#0b1920] font-display text-[10px] font-black text-lime">{Math.round(dailyPercent)}%</span>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-lime">Today&apos;s target</p>
                  <p className="mt-1 font-display text-lg font-black">{Math.min(todayMinutes, profile.dailyGoalMinutes)} / {profile.dailyGoalMinutes} MIN</p>
                  <p className="mt-1 text-[10px] text-white/35">{dailyPercent >= 100 ? "Daily shift cleared. Nice work." : "One mission can move the meter."}</p>
                </div>
              </div>
            </motion.section>
          </div>

          {dailyMission && (() => {
            const dailyState = missionStates.get(dailyMission.id)!;
            const DailyIcon = locationIcons[dailyMission.location];
            return (
              <motion.section
                data-tour="daily-shift"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.17 }}
                className="relative mt-5 overflow-hidden rounded-3xl border border-lime/25 bg-[linear-gradient(110deg,rgba(199,255,74,0.1),rgba(85,246,255,0.035)_55%,rgba(255,255,255,0.02))] p-5 sm:p-7"
              >
                <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full border-[34px] border-lime/[0.025]" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-lime/30 bg-lime/10 text-lime shadow-lime"><DailyIcon className="size-6" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.2em] text-lime">Daily shift</span><span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-display text-[8px] font-black text-white/45">{dailyMission.level}</span><span className="text-[9px] text-white/30">{careerRegions.find((region) => region.id === dailyMission.location)?.name}</span></div>
                      <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">{dailyMission.title}</h2>
                      <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45 sm:text-sm">{dailyMission.descriptionEn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 lg:ml-auto">
                    <div className="hidden text-right sm:block"><p className="font-display text-sm font-black text-lime">+{dailyMission.xpReward} XP</p><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/30">{dailyMission.estimatedMinutes} min · {dailyMission.steps.length} stages</p></div>
                    {dailyState.unlocked ? <Link href={`/scenario/${dailyMission.id}`} className="group inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-lime px-5 font-display text-[10px] font-black uppercase tracking-[0.13em] text-ink transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(199,255,74,0.25)] sm:flex-none">{dailyState.inProgress ? "Continue shift" : "Start shift"}<Play className="size-3.5 fill-current" /></Link> : <span className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 px-5 text-[10px] font-black uppercase text-white/30"><LockKeyhole className="size-3.5" /> Locked</span>}
                  </div>
                </div>
              </motion.section>
            );
          })()}

          <section className="mt-10" aria-labelledby="campus-map-heading">
            <div data-tour="career-map" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan">Sector overview</p>
                <h2 id="campus-map-heading" className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">Industrial campus map</h2>
              </div>
              <p className="max-w-lg text-xs leading-5 text-white/35">Every region trains communication—not equipment operation. Select an active node to inspect its missions.</p>
            </div>

            <div className="relative mt-5 hidden h-[620px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07141d] shadow-[0_35px_90px_rgba(0,0,0,0.35)] md:block">
              <div className="absolute inset-0 bg-arcade-grid bg-[size:46px_46px] opacity-[0.23]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,rgba(85,246,255,0.09),transparent_34%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.25))]" />
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/15 px-6 py-4 backdrop-blur">
                <div className="flex items-center gap-3"><MapPinned className="size-4 text-cyan" /><span className="font-display text-[9px] font-black uppercase tracking-[0.18em] text-white/55">SQ campus / navigation layer</span></div>
                <div className="flex items-center gap-5 text-[8px] font-black uppercase tracking-[0.14em] text-white/30"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-lime" /> Active</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-white/20" /> Restricted</span></div>
              </div>

              <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M18 25 L40 18 L66 24 L88 38 L68 72 L88 70" fill="none" stroke="rgba(85,246,255,.20)" strokeWidth=".35" strokeDasharray="1.5 1" />
                <path d="M18 25 L43 55 L68 72 L16 70 L43 55 L66 24" fill="none" stroke="rgba(255,255,255,.11)" strokeWidth=".28" strokeDasharray="1.2 1.5" />
                <circle cx="43" cy="55" r="19" fill="none" stroke="rgba(199,255,74,.055)" strokeWidth=".3" />
              </svg>

              {careerRegions.map((region, index) => {
                const regionMissions = scenarios.filter((scenario) => scenario.location === region.id);
                const activeMissions = regionMissions.filter((scenario) => missionStates.get(scenario.id)?.unlocked);
                const completedMissions = regionMissions.filter((scenario) => missionStates.get(scenario.id)?.completed);
                const available = regionMissions.length ? activeMissions.length > 0 || completedMissions.length > 0 : progress.totalXp >= region.requiredXp;
                const current = dailyMission?.location === region.id;
                const Icon = locationIcons[region.id];
                return (
                  <motion.a
                    key={region.id}
                    href={regionMissions.length ? `#region-${region.id}` : undefined}
                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.2 + index * 0.045 }}
                    className={`group absolute z-10 w-[148px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 backdrop-blur transition ${current ? "border-lime/55 bg-lime/[0.12] shadow-[0_0_35px_rgba(199,255,74,0.16)]" : available ? "border-white/15 bg-[#0c1c27]/90 hover:z-20 hover:-translate-y-[54%] hover:border-cyan/40" : "border-white/[0.07] bg-[#08131b]/90 text-white/35"} ${regionMissions.length ? "cursor-pointer" : "cursor-default"}`}
                    style={{ left: `${region.position.x}%`, top: `${region.position.y}%` }}
                    aria-label={`${region.name}, ${available ? "active" : "locked"}, ${regionMissions.length} missions`}
                    onClick={(event) => { if (!regionMissions.length) event.preventDefault(); }}
                  >
                    {current && <span className="absolute -inset-2 -z-10 animate-pulse rounded-[1.2rem] border border-lime/18" />}
                    <div className="flex items-start justify-between">
                      <span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5" style={{ color: available ? region.accentColor : undefined }}><Icon className="size-4" /></span>
                      {completedMissions.length > 0 && completedMissions.length === regionMissions.length ? <CheckCircle2 className="size-4 text-lime" /> : available ? <CircleDot className={`size-4 ${current ? "text-lime" : "text-cyan/50"}`} /> : <LockKeyhole className="size-4 text-white/20" />}
                    </div>
                    <p className="mt-3 font-display text-[10px] font-black uppercase tracking-[0.03em] text-white">{region.name}</p>
                    <p className={`mt-1 text-[8px] font-black uppercase tracking-[0.12em] ${current ? "text-lime" : available ? "text-white/35" : "text-white/20"}`}>{regionMissions.length ? `${completedMissions.length}/${regionMissions.length} complete` : available ? "Advanced sector" : `${region.requiredXp} XP sector`}</p>
                  </motion.a>
                );
              })}

              <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-[8px] font-bold uppercase tracking-[0.13em] text-white/25 backdrop-blur">Map nodes follow mission prerequisites and XP clearance.</div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:hidden">
              {careerRegions.map((region) => {
                const Icon = locationIcons[region.id];
                const regionMissions = scenarios.filter((scenario) => scenario.location === region.id);
                const completed = regionMissions.filter((scenario) => missionStates.get(scenario.id)?.completed).length;
                const available = regionMissions.some((scenario) => missionStates.get(scenario.id)?.unlocked) || (!regionMissions.length && progress.totalXp >= region.requiredXp);
                const body = <><span className={`grid size-9 place-items-center rounded-xl border ${available ? "border-cyan/20 bg-cyan/[0.07] text-cyan" : "border-white/10 bg-white/[0.025] text-white/25"}`}><Icon className="size-4" /></span><span className="mt-3 block font-display text-[10px] font-black uppercase leading-4 text-white">{region.name}</span><span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.12em] text-white/30">{regionMissions.length ? `${completed}/${regionMissions.length} complete` : available ? "Advanced sector" : `${region.requiredXp} XP`}</span></>;
                return regionMissions.length ? <a key={region.id} href={`#region-${region.id}`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">{body}</a> : <div key={region.id} className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">{body}</div>;
              })}
            </div>
          </section>

          <section className="mt-16 pb-10" aria-labelledby="mission-directory-heading">
            <div className="flex items-end justify-between gap-5 border-b border-white/10 pb-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-lime">Full mission directory</p>
                <h2 id="mission-directory-heading" className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.03em] sm:text-3xl">All campus assignments</h2>
              </div>
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-white/30 sm:block">{scenarios.length} missions · {scenarios.filter((scenario) => missionStates.get(scenario.id)?.unlocked).length} accessible</span>
            </div>

            <div className="mt-8 space-y-12">
              {careerRegions.map((region) => {
                const regionMissions = scenarios.filter((scenario) => scenario.location === region.id).sort((a, b) => a.sortOrder - b.sortOrder);
                if (!regionMissions.length) return null;
                const Icon = locationIcons[region.id];
                const completedInRegion = regionMissions.filter((scenario) => missionStates.get(scenario.id)?.completed).length;
                return (
                  <section key={region.id} id={`region-${region.id}`} className="scroll-mt-24" aria-labelledby={`region-title-${region.id}`}>
                    <div className="mb-4 flex items-center gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.035]" style={{ color: region.accentColor }}><Icon className="size-5" /></span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h3 id={`region-title-${region.id}`} className="font-display text-base font-black uppercase tracking-[0.02em] sm:text-lg">{region.name}</h3><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">{region.nameTr}</span></div>
                        <p className="mt-1 text-[10px] text-white/35">{region.description}</p>
                      </div>
                      <div className="ml-auto hidden items-center gap-2 sm:flex"><span className="font-display text-[9px] font-black text-lime">{completedInRegion}/{regionMissions.length}</span><div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime" style={{ width: `${(completedInRegion / regionMissions.length) * 100}%` }} /></div></div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                      {regionMissions.map((scenario, index) => (
                        <MissionCard key={scenario.id} scenario={scenario} state={missionStates.get(scenario.id)!} index={index} recommended={scenario.level === profile.level && (!routeCategory || scenario.category === routeCategory)} isDaily={dailyMission?.id === scenario.id} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl border border-amber/20 bg-amber/10 text-amber"><Trophy className="size-5" /></span><div><p className="font-display text-sm font-black uppercase">Review your shift telemetry</p><p className="mt-1 text-xs text-white/35">See strengths, response patterns and vocabulary that needs another pass.</p></div></div>
            <Link href="/dashboard" className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-[10px] font-black uppercase tracking-[0.13em] text-white/65 transition hover:border-cyan/35 hover:text-cyan">Open dashboard <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
