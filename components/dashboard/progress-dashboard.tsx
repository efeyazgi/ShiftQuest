"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Clock3,
  Flame,
  Gauge,
  History,
  Lightbulb,
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  TriangleAlert,
  Trophy,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { GAME_TITLE_DISCLAIMER, getCareerTitleForXp, getNextCareerTitle } from "@/data/career";
import { scenarios, scenarioById } from "@/data/scenarios";
import { vocabularyById } from "@/data/vocabulary";
import { useGameStore } from "@/features/game/store";
import type {
  AnswerAttempt,
  LearningActivity,
  LearningErrorType,
  ScenarioCategory,
  ScenarioStepType,
  VocabularyProgress,
} from "@/types";

const categories: Array<{ id: ScenarioCategory; label: string; short: string }> = [
  { id: "office", label: "Office communication", short: "Office" },
  { id: "production", label: "Production floor", short: "Production" },
  { id: "meeting", label: "Meetings", short: "Meetings" },
  { id: "quality", label: "Quality & documentation", short: "Quality" },
  { id: "safety", label: "Safety communication", short: "Safety" },
  { id: "career", label: "Career & social", short: "Career" },
];

const skillGroups: Record<"listening" | "grammar" | "communication", ScenarioStepType[]> = {
  listening: ["listening"],
  grammar: ["sentence-builder", "fill-blank", "word-puzzle", "matching"],
  communication: ["dialogue-choice", "tone-check", "quick-response", "roleplay", "boss-battle"],
};

const errorLabels: Record<LearningErrorType, string> = {
  grammar: "grammar patterns",
  vocabulary: "word choice",
  listening: "listening details",
  tone: "professional tone",
  "word-order": "word order",
  comprehension: "context comprehension",
  timeout: "quick responses",
};

const chartTooltipStyle = {
  background: "#08141d",
  border: "1px solid rgba(85,246,255,.24)",
  borderRadius: 12,
  color: "#eef8fb",
  fontSize: 12,
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function accuracyOf(items: readonly AnswerAttempt[]) {
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.correct).length / items.length) * 100);
}

function scoreForTypes(attempts: readonly AnswerAttempt[], types: readonly ScenarioStepType[]) {
  return accuracyOf(attempts.filter((attempt) => types.includes(attempt.questionType)));
}

function relativeTime(value: string) {
  const date = validDate(value);
  if (!date) return "Tarih bilinmiyor";
  const delta = date.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });
  const minutes = Math.round(delta / 60_000);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(delta / 3_600_000);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(delta / 86_400_000), "day");
}

function buildTimeline(
  days: 7 | 30,
  activities: readonly LearningActivity[],
  dailyMinutes: Record<string, number>,
) {
  const activityXp = activities.reduce<Record<string, number>>((totals, activity) => {
    const date = validDate(activity.occurredAt);
    if (!date) return totals;
    const key = localDateKey(date);
    totals[key] = (totals[key] ?? 0) + Math.max(0, activity.xpEarned);
    return totals;
  }, {});

  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    const key = localDateKey(date);
    return {
      key,
      label: new Intl.DateTimeFormat("tr-TR", days === 7 ? { weekday: "short" } : { day: "numeric", month: "short" }).format(date),
      xp: activityXp[key] ?? 0,
      minutes: Math.round(dailyMinutes[key] ?? 0),
    };
  });
}

function averageMastery(items: readonly VocabularyProgress[]) {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.masteryScore, 0) / items.length);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = "cyan",
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  detail: string;
  accent?: "cyan" | "lime" | "amber" | "coral";
}) {
  const colors = {
    cyan: "border-cyan/25 bg-cyan/10 text-cyan",
    lime: "border-lime/25 bg-lime/10 text-lime",
    amber: "border-amber/25 bg-amber/10 text-amber",
    coral: "border-coral/25 bg-coral/10 text-coral",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-4">
      <div className={`grid h-9 w-9 place-items-center rounded-lg border ${colors[accent]}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center p-6 text-center">
      <div className="max-w-xs rounded-xl border border-dashed border-white/15 bg-[#08141d]/90 px-5 py-4 text-xs leading-5 text-slate-400">
        <BarChart3 className="mx-auto mb-2 h-5 w-5 text-cyan/65" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export function ProgressDashboard() {
  const [range, setRange] = useState<7 | 30>(7);
  const profile = useGameStore((state) => state.profile);
  const progress = useGameStore((state) => state.progress);
  const attempts = useGameStore((state) => state.attempts);
  const activities = useGameStore((state) => state.activities);

  const vocabularyProgress = useMemo(() => Object.values(progress.vocabularyProgress), [progress.vocabularyProgress]);
  const timeline = useMemo(
    () => buildTimeline(range, activities, progress.dailyMinutes),
    [activities, progress.dailyMinutes, range],
  );
  const todayKey = localDateKey(new Date());
  const todayMinutes = Math.round(progress.dailyMinutes[todayKey] ?? 0);
  const goalMinutes = profile?.dailyGoalMinutes ?? 10;
  const dailyGoalPercentage = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));
  const overallAccuracy = accuracyOf(attempts);
  const averageResponseMs = attempts.length
    ? attempts.reduce((sum, attempt) => sum + Math.max(0, attempt.responseTimeMs), 0) / attempts.length
    : 0;
  const hintCount = attempts.filter((attempt) => attempt.hintUsed).length;

  const currentTitle = getCareerTitleForXp(progress.totalXp);
  const nextTitle = getNextCareerTitle(progress.totalXp) ?? null;
  const titleStartXp = currentTitle.minimumXp;
  const titleSpan = nextTitle ? nextTitle.minimumXp - titleStartXp : 1;
  const titlePercentage = nextTitle
    ? Math.max(0, Math.min(100, Math.round(((progress.totalXp - titleStartXp) / titleSpan) * 100)))
    : 100;

  const categoryPerformance = useMemo(
    () => categories.map((category) => {
      const categoryAttempts = attempts.filter((attempt) => attempt.category === category.id);
      const scenarioRecords = scenarios
        .filter((scenario) => scenario.category === category.id)
        .map((scenario) => progress.scenarioProgress[scenario.id])
        .filter(Boolean);
      const fallbackAccuracy = scenarioRecords.length
        ? Math.round(scenarioRecords.reduce((sum, record) => sum + record.bestAccuracy, 0) / scenarioRecords.length)
        : 0;
      return {
        ...category,
        accuracy: categoryAttempts.length ? accuracyOf(categoryAttempts) : fallbackAccuracy,
        attempts: categoryAttempts.length,
        evidence: categoryAttempts.length || scenarioRecords.length,
        averageResponseTimeMs: categoryAttempts.length
          ? categoryAttempts.reduce((sum, attempt) => sum + attempt.responseTimeMs, 0) / categoryAttempts.length
          : 0,
      };
    }),
    [attempts, progress.scenarioProgress],
  );

  const evidencedCategories = categoryPerformance.filter((category) => category.evidence > 0);
  const strongestCategory = [...evidencedCategories].sort((a, b) => b.accuracy - a.accuracy)[0];
  const weakestCategory = [...evidencedCategories].sort((a, b) => a.accuracy - b.accuracy)[0];

  const skillData = useMemo(
    () => [
      { skill: "Vocabulary", score: averageMastery(vocabularyProgress), fullMark: 100 },
      { skill: "Listening", score: scoreForTypes(attempts, skillGroups.listening), fullMark: 100 },
      { skill: "Grammar", score: scoreForTypes(attempts, skillGroups.grammar), fullMark: 100 },
      { skill: "Communication", score: scoreForTypes(attempts, skillGroups.communication), fullMark: 100 },
    ],
    [attempts, vocabularyProgress],
  );
  const hasSkillData = skillData.some((skill) => skill.score > 0);

  const sortedAttempts = useMemo(
    () => [...attempts].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
    [attempts],
  );
  const recentAttempts = sortedAttempts.slice(-10);
  const previousAttempts = sortedAttempts.slice(-20, -10);
  const recentAccuracy = accuracyOf(recentAttempts);
  const previousAccuracy = accuracyOf(previousAttempts);
  const improvement = previousAttempts.length ? recentAccuracy - previousAccuracy : 0;

  const mostFrequentError = useMemo(() => {
    const counts = attempts.reduce<Partial<Record<LearningErrorType, number>>>((result, attempt) => {
      if (attempt.errorType) result[attempt.errorType] = (result[attempt.errorType] ?? 0) + 1;
      return result;
    }, {});
    return (Object.entries(counts) as Array<[LearningErrorType, number]>).sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [attempts]);

  const strugglingWords = useMemo(
    () => vocabularyProgress
      .filter((item) => item.incorrectCount > 0)
      .sort((left, right) => right.incorrectCount - left.incorrectCount || left.masteryScore - right.masteryScore)
      .slice(0, 5)
      .map((item) => {
        const seen = attempts
          .filter((attempt) => attempt.vocabularyIds.includes(item.vocabularyId))
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
        return { progress: item, word: vocabularyById.get(item.vocabularyId), lastSeen: seen?.createdAt ?? item.lastReviewedAt ?? item.firstLearnedAt };
      }),
    [attempts, vocabularyProgress],
  );

  const recentActivity = useMemo(() => {
    const reviewActivity: LearningActivity[] = vocabularyProgress
      .filter((item) => item.lastReviewedAt)
      .map((item) => ({
        id: `review-${item.vocabularyId}-${item.lastReviewedAt}`,
        type: "vocabulary-review",
        occurredAt: item.lastReviewedAt!,
        durationSeconds: 0,
        xpEarned: 0,
        vocabularyId: item.vocabularyId,
      }));
    return [...activities, ...reviewActivity]
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 6);
  }, [activities, vocabularyProgress]);

  const levelProgress = (["B1", "B2"] as const).map((level) => {
    const levelAttempts = attempts.filter((attempt) => attempt.level === level);
    const coveredMissions = new Set(levelAttempts.map((attempt) => attempt.scenarioId)).size;
    const availableMissions = Math.max(1, scenarios.filter((scenario) => scenario.level === level).length);
    const evidence = Math.min(1, levelAttempts.length / 20);
    const score = levelAttempts.length
      ? Math.round(accuracyOf(levelAttempts) * 0.75 * evidence + (coveredMissions / availableMissions) * 25)
      : 0;
    return { level, attempts: levelAttempts.length, score: Math.min(100, score) };
  });

  const hasTimelineData = timeline.some((item) => item.xp > 0 || item.minutes > 0);
  const totalRangeXp = timeline.reduce((sum, item) => sum + item.xp, 0);
  const totalRangeMinutes = timeline.reduce((sum, item) => sum + item.minutes, 0);

  const insights = attempts.length === 0
    ? [
        "Complete a mission to activate your communication diagnostics.",
        "Saved words already contribute to the vocabulary skill signal.",
      ]
    : [
        strongestCategory ? `You perform best in ${strongestCategory.label.toLowerCase()} (${strongestCategory.accuracy}% accuracy).` : "More mission data will reveal your strongest area.",
        weakestCategory && weakestCategory.id !== strongestCategory?.id
          ? `Your next best upgrade is ${weakestCategory.label.toLowerCase()} practice.`
          : "Your category scores are currently closely matched.",
        mostFrequentError
          ? `Your most frequent friction point is ${errorLabels[mostFrequentError]}; use hints as a learning tool.`
          : "No repeated error pattern has emerged yet—keep building evidence.",
      ];

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-2xl border border-cyan/20 bg-[#0a1822]/90 p-5 shadow-neon sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-72 bg-lime/[0.04] blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" /> Performance terminal online
            </div>
            <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
              {profile?.displayName ?? "Engineer"}, your shift data is live.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Every answer updates this control panel. Follow the signal, repair weak spots, and keep your communication streak moving.
            </p>
          </div>
          <div className="min-w-0 rounded-xl border border-lime/20 bg-lime/[0.06] p-4 xl:w-[410px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-lime">Current game title</p>
                <p className="mt-1 font-display text-lg font-black uppercase text-white">{currentTitle.name}</p>
              </div>
              <Medal className="h-6 w-6 shrink-0 text-lime" aria-hidden="true" />
            </div>
            <ProgressBar className="mt-4" value={titlePercentage} label={nextTitle ? `${nextTitle.name} rotası` : "Final title"} />
            <p className="mt-2 text-[10px] text-slate-500">
              {nextTitle ? `${Math.max(0, nextTitle.minimumXp - progress.totalXp).toLocaleString("tr-TR")} XP kaldı` : "Arcade career track complete"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6" aria-label="Genel ilerleme özeti">
        <MetricCard icon={Zap} label="Toplam XP" value={progress.totalXp.toLocaleString("tr-TR")} detail="Kariyer puanı" accent="lime" />
        <MetricCard icon={Flame} label="Günlük seri" value={`${progress.streakDays} gün`} detail={progress.streakDays ? "Ritmi koru" : "Bugün başlat"} accent="amber" />
        <MetricCard icon={Trophy} label="Senaryolar" value={`${progress.completedScenarioIds.length}/${scenarios.length}`} detail="Tamamlanan görev" />
        <MetricCard icon={BookOpenCheck} label="Kelime kasası" value={String(vocabularyProgress.length)} detail="Kaydedilen ifade" accent="coral" />
        <MetricCard icon={Target} label="Bugünkü hedef" value={`${todayMinutes}/${goalMinutes} dk`} detail={`${dailyGoalPercentage}% tamamlandı`} accent="lime" />
        <MetricCard icon={Gauge} label="Doğruluk" value={attempts.length ? `%${overallAccuracy}` : "—"} detail={`${attempts.length} kayıtlı cevap`} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]">
        <Panel className="min-w-0" label="XP + ÇALIŞMA TELEMETRİSİ">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-black uppercase text-white">Shift momentum</h2>
              <p className="mt-1 text-xs text-slate-500">{totalRangeXp} XP · {totalRangeMinutes} dakika / son {range} gün</p>
            </div>
            <div className="inline-flex w-fit rounded-lg border border-white/10 bg-black/20 p-1" aria-label="Grafik zaman aralığı">
              {([7, 30] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRange(days)}
                  aria-pressed={range === days}
                  className={`min-h-9 rounded-md px-4 font-display text-[10px] font-black uppercase tracking-[0.14em] transition ${range === days ? "bg-cyan text-ink" : "text-slate-400 hover:text-white"}`}
                >
                  {days} gün
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-[310px] p-3 sm:p-5" role="img" aria-label={`Son ${range} günün XP ve çalışma süresi grafiği`}>
            {!hasTimelineData ? <EmptyChart>İlk görevin veya çalışma kaydın burada XP ve dakika sinyali oluşturacak.</EmptyChart> : null}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c7ff4a" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#c7ff4a" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="minuteFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#55f6ff" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#55f6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={range === 30 ? 24 : 4} />
                <YAxis yAxisId="xp" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis yAxisId="minutes" orientation="right" hide allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "#94a3b8" }} />
                <Area yAxisId="xp" type="monotone" dataKey="xp" name="XP" stroke="#c7ff4a" fill="url(#xpFill)" strokeWidth={2.5} activeDot={{ r: 4, fill: "#c7ff4a" }} />
                <Area yAxisId="minutes" type="monotone" dataKey="minutes" name="Dakika" stroke="#55f6ff" fill="url(#minuteFill)" strokeWidth={2} strokeDasharray="5 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-white/[0.08] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-lime" /> XP</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed border-cyan" /> Çalışma dakikası</span>
            <span className="ml-auto">Yerel kayıt · gerçek aktivite</span>
          </div>
        </Panel>

        <Panel label="BECERİ RADARI" accent="lime">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-black uppercase text-white">Core skills</h2>
                <p className="mt-1 text-xs text-slate-500">Son kayıtlı cevaplar + kelime hâkimiyeti</p>
              </div>
              <BrainCircuit className="h-5 w-5 text-lime" aria-hidden="true" />
            </div>
            <div className="relative mt-2 h-[260px]" role="img" aria-label="Kelime, dinleme, dilbilgisi ve iletişim beceri radar grafiği">
              {!hasSkillData ? <EmptyChart>Görev türleri tamamlandıkça dört beceri ekseni etkinleşir.</EmptyChart> : null}
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData} outerRadius="68%">
                  <PolarGrid stroke="rgba(255,255,255,.12)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <PolarRadiusAxis angle={28} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" name="Skill score" stroke="#c7ff4a" fill="#c7ff4a" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {skillData.map((skill) => (
                <div key={skill.skill} className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{skill.skill}</p>
                  <p className="mt-1 font-display text-sm font-black text-lime">{skill.score || "—"}{skill.score ? "%" : ""}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
        <Panel label="KATEGORİ PERFORMANSI">
          <div className="grid min-w-0 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_210px]">
            <div className="relative h-[300px]" role="img" aria-label="Senaryo kategorilerine göre doğruluk grafiği">
              {evidencedCategories.length === 0 ? <EmptyChart>Kategori karşılaştırması ilk senaryo cevaplarından sonra açılır.</EmptyChart> : null}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance} layout="vertical" margin={{ top: 4, right: 18, bottom: 0, left: 12 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.06)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                  <YAxis type="category" dataKey="short" width={76} tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${Number(value)}%`, "Doğruluk"]} />
                  <Bar dataKey="accuracy" name="Doğruluk" fill="#55f6ff" radius={[0, 5, 5, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {categoryPerformance.map((category) => (
                <div key={category.id} className="rounded-lg border border-white/[0.08] bg-black/10 p-3">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate font-bold text-slate-300">{category.short}</span>
                    <span className={category.evidence ? "font-display font-black text-cyan" : "text-slate-600"}>{category.evidence ? `${category.accuracy}%` : "—"}</span>
                  </div>
                  <p className="mt-1 text-[9px] text-slate-600">{category.attempts ? `${category.attempts} cevap` : category.evidence ? "Görev sonucu" : "Veri bekleniyor"}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel label="CANLI ÖLÇÜMLER" accent="amber">
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
                <Gauge className="mx-auto h-4 w-4 text-cyan" />
                <p className="mt-2 font-display text-xl font-black text-white">{attempts.length ? `${overallAccuracy}%` : "—"}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">Accuracy</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
                <Clock3 className="mx-auto h-4 w-4 text-amber" />
                <p className="mt-2 font-display text-xl font-black text-white">{attempts.length ? `${(averageResponseMs / 1000).toFixed(1)}s` : "—"}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">Response</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
                <Lightbulb className="mx-auto h-4 w-4 text-lime" />
                <p className="mt-2 font-display text-xl font-black text-white">{hintCount}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">Hints</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">Recent accuracy / 10</p>
                  <p className="mt-1 font-display text-2xl font-black text-white">{recentAttempts.length ? `${recentAccuracy}%` : "No signal"}</p>
                </div>
                {previousAttempts.length ? (
                  <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${improvement >= 0 ? "bg-lime/10 text-lime" : "bg-coral/10 text-coral"}`}>
                    {improvement >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {improvement > 0 ? "+" : ""}{improvement} pt
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-600">20 cevapta trend açılır</span>
                )}
              </div>
              <ProgressBar className="mt-4" value={recentAccuracy} color={recentAccuracy >= 75 ? "lime" : recentAccuracy >= 50 ? "amber" : "coral"} />
            </div>

            <div className="mt-4 space-y-3">
              {levelProgress.map((level) => (
                <div key={level.level}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-300">{level.level} proficiency signal {profile?.level === level.level ? <span className="text-cyan">· selected</span> : null}</span>
                    <span className="text-slate-500">{level.attempts ? `${level.score}%` : "waiting"}</span>
                  </div>
                  <ProgressBar value={level.score} color={level.level === "B1" ? "cyan" : "lime"} />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,.8fr)]">
        <Panel label="GÜÇLÜ / ZAYIF SİNYALLER" accent="lime">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime"><Sparkles className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-base font-black uppercase text-white">Engineer insights</h2>
                <p className="text-xs text-slate-500">Raw data, translated into next actions</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {insights.map((insight, index) => (
                <div key={insight} className="flex gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3.5">
                  {index === 0 ? <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> : index === 1 ? <Target className="mt-0.5 h-4 w-4 shrink-0 text-amber" /> : <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />}
                  <p className="text-xs leading-5 text-slate-300">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel label="ZORLANILAN KELİMELER" accent="coral">
          <div className="p-5">
            {strugglingWords.length ? (
              <div className="space-y-2">
                {strugglingWords.map(({ progress: wordProgress, word, lastSeen }) => (
                  <div key={wordProgress.vocabularyId} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-coral/20 bg-coral/10 font-display text-xs font-black text-coral">{wordProgress.incorrectCount}×</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-bold text-white">{word?.term ?? wordProgress.vocabularyId}</p>
                        <span className="text-[10px] font-bold text-slate-500">{wordProgress.masteryScore}%</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">{word?.meaningTr ?? "Saved vocabulary"} · {relativeTime(lastSeen)}</p>
                    </div>
                    <Link href={`/word-vault?review=${encodeURIComponent(wordProgress.vocabularyId)}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10 text-cyan transition hover:bg-cyan/20" aria-label={`${word?.term ?? "Kelime"} tekrarını aç`}>
                      <RefreshCw className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <BookOpenCheck className="mx-auto h-8 w-8 text-lime/70" />
                  <p className="mt-3 text-sm font-bold text-white">No struggling words yet</p>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500">Yanlış yaptığın hedef ifadeler burada otomatik olarak öncelik kazanır.</p>
                  <Link href="/word-vault" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-cyan/25 bg-cyan/10 px-4 font-display text-[10px] font-black uppercase tracking-[0.12em] text-cyan">Word Vault&apos;u aç</Link>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel label="SON AKTİVİTELER" accent="amber" className="lg:col-span-2 xl:col-span-1">
          <div className="p-5">
            {recentActivity.length ? (
              <ol className="space-y-1">
                {recentActivity.map((item, index) => {
                  const scenario = item.scenarioId ? scenarioById.get(item.scenarioId) : undefined;
                  const word = item.vocabularyId ? vocabularyById.get(item.vocabularyId) : undefined;
                  const isReview = item.type === "vocabulary-review";
                  return (
                    <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {index < recentActivity.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-white/10" /> : null}
                      <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${isReview ? "border-cyan/20 bg-cyan/10 text-cyan" : "border-lime/20 bg-lime/10 text-lime"}`}>
                        {isReview ? <BookOpenCheck className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="truncate text-xs font-bold text-slate-200">{isReview ? `${word?.term ?? "Vocabulary"} reviewed` : scenario?.title ?? "Mission completed"}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{relativeTime(item.occurredAt)}{item.xpEarned ? ` · +${item.xpEarned} XP` : ""}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <History className="mx-auto h-8 w-8 text-slate-600" />
                  <p className="mt-3 text-sm font-bold text-white">Shift log is clear</p>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500">İlk senaryo tamamlandığında görev geçmişin burada görünür.</p>
                  <Link href="/map" className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-lime px-4 font-display text-[10px] font-black uppercase tracking-[0.12em] text-ink">Görev seç</Link>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </section>

      <footer className="mt-5 flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-4 py-3 text-[10px] leading-4 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-cyan/60" /> Dashboard values are calculated from this device&apos;s persisted game data.</span>
        <span className="flex items-center gap-2"><TriangleAlert className="h-3.5 w-3.5 text-amber/60" /> {GAME_TITLE_DISCLAIMER}</span>
      </footer>
    </div>
  );
}
