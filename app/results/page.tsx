"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, BookOpenCheck, CheckCircle2, Coins, Gauge, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { getScenarioById, scenarios } from "@/data/scenarios";
import { getVocabularyById } from "@/data/vocabulary";
import { useGameStore } from "@/features/game/store";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Panel } from "@/components/ui/panel";

export default function MissionResultsPage() {
  const hydrated = useGameStore((state) => state.hydrated);
  const result = useGameStore((state) => state.lastResult);
  const scenario = result ? getScenarioById(result.scenarioId) : undefined;
  const nextScenario = scenario ? scenarios.filter((item) => item.level === scenario.level && item.sortOrder > scenario.sortOrder).sort((a, b) => a.sortOrder - b.sortOrder)[0] : undefined;

  if (!hydrated) return <AppShell><LoadingScreen label="Performans raporu derleniyor" /></AppShell>;
  if (!result || !scenario) return <AppShell><div className="mx-auto max-w-xl px-5 py-24"><Panel className="p-8 text-center"><Target className="mx-auto h-10 w-10 text-cyan" /><h1 className="mt-4 text-2xl font-black">Henüz bir görev raporu yok</h1><p className="mt-2 text-sm text-slate-400">Bir görevi tamamladığında performans ayrıntıların burada görünecek.</p><Link href="/map" className="mt-6 inline-flex"><Button>Görev seç</Button></Link></Panel></div></AppShell>;

  const reviewWords = result.reviewVocabularyIds.map(getVocabularyById).filter(Boolean);
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-3xl border border-lime/25 bg-gradient-to-br from-lime/10 via-panel to-cyan/[0.08] p-6 text-center shadow-[0_0_80px_rgba(199,255,74,.1)] sm:p-10">
          <div className="absolute left-1/2 top-0 h-44 w-96 -translate-x-1/2 rounded-full bg-lime/10 blur-3xl" />
          <motion.div initial={{ y: -18, rotate: -8 }} animate={{ y: 0, rotate: 0 }} transition={{ type: "spring", delay: 0.2 }} className="relative mx-auto grid h-20 w-20 place-items-center rounded-2xl border border-lime/30 bg-lime/10 text-lime shadow-lime"><Trophy className="h-10 w-10" /></motion.div>
          <p className="relative mt-6 font-display text-xs uppercase tracking-[0.3em] text-lime">Shift complete</p>
          <h1 className="relative mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{scenario.title}</h1>
          <p className="relative mt-2 text-sm text-slate-400">{scenario.evaluation.successMessageTr}</p>
        </motion.div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="p-5"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime"><Zap className="h-5 w-5" /></span><Sparkles className="h-4 w-4 text-slate-700" /></div><p className="mt-5 font-display text-2xl font-black text-white">+{result.xpEarned}</p><p className="mt-1 text-xs text-slate-500">Kazanılan XP</p></Panel>
          <Panel className="p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber/10 text-amber"><Coins className="h-5 w-5" /></span><p className="mt-5 font-display text-2xl font-black text-white">+{result.coinsEarned}</p><p className="mt-1 text-xs text-slate-500">Shift coins</p></Panel>
          <Panel className="p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/10 text-cyan"><Gauge className="h-5 w-5" /></span><p className="mt-5 font-display text-2xl font-black text-white">{result.accuracy}%</p><p className="mt-1 text-xs text-slate-500">Doğruluk</p></Panel>
          <Panel className="p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-coral/10 text-coral"><BookOpenCheck className="h-5 w-5" /></span><p className="mt-5 font-display text-2xl font-black text-white">{result.correctAnswers}/{result.totalSteps}</p><p className="mt-1 text-xs text-slate-500">Doğru yanıt</p></Panel>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <Panel label="Communication debrief" className="p-5 pt-4 sm:p-6">
            <div className="flex items-center gap-4"><div className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-2" style={{ background: `conic-gradient(#c7ff4a ${result.accuracy}%, rgba(255,255,255,.08) 0)` }}><div className="grid h-full w-full place-items-center rounded-full bg-panel font-display text-xl font-black text-white">{result.accuracy}%</div></div><div><h2 className="text-lg font-black text-white">{result.accuracy >= 90 ? "Outstanding shift" : result.accuracy >= 70 ? "Solid communication" : "Good progress — review ready"}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{result.accuracy >= 75 ? scenario.evaluation.successMessageTr : scenario.evaluation.reviewMessageTr}</p></div></div>
            <div className="mt-6 grid gap-2">{scenario.evaluation.naturalExpressions.map((expression) => <div key={expression} className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-sm text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /><span>{expression}</span></div>)}</div>
          </Panel>

          <Panel label="Review queue" className="p-5 pt-4 sm:p-6">
            {reviewWords.length ? <><p className="mb-4 text-sm text-slate-400">Bu ifadeler kişisel tekrar kuyruğuna alındı.</p><div className="space-y-2">{reviewWords.slice(0, 6).map((word) => <div key={word!.id} className="flex items-center justify-between rounded-xl border border-coral/15 bg-coral/5 p-3"><div><p className="text-sm font-semibold text-white">{word!.term}</p><p className="mt-0.5 text-xs text-slate-500">{word!.meaningTr}</p></div><span className="rounded-md bg-coral/10 px-2 py-1 font-display text-[9px] text-coral">REVIEW</span></div>)}</div></> : <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-lime" /><p className="mt-3 font-bold text-white">Temiz vardiya!</p><p className="mt-1 text-xs text-slate-500">Bu görevden zorlanan kelime çıkmadı.</p></div>}
          </Panel>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between"><div className="flex gap-2"><Link href={`/scenario/${scenario.id}`}><Button variant="ghost"><RotateCcw className="h-4 w-4" /> Tekrar oyna</Button></Link><Link href="/dashboard"><Button variant="secondary"><BarChart3 className="h-4 w-4" /> Analizi aç</Button></Link></div>{nextScenario ? <Link href={`/scenario/${nextScenario.id}`}><Button>Sonraki görev <ArrowRight className="h-4 w-4" /></Button></Link> : <Link href="/map"><Button>Haritaya dön <ArrowRight className="h-4 w-4" /></Button></Link>}</div>
      </main>
    </AppShell>
  );
}
