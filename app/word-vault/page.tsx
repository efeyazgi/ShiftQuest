"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Heart,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Target,
  Trophy,
  Volume2,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { vocabularyById } from "@/data/vocabulary";
import { useTTS } from "@/features/audio/use-tts";
import { useGameStore } from "@/features/game/store";
import { useProviderSettingsStore } from "@/features/providers/store";
import type { ScenarioCategory, VocabularyItem, VocabularyProgress } from "@/types";

type VaultFilter = "all" | "due" | "favorites" | "learning" | "mastered";
type SortOrder = "recent" | "mastery-asc" | "mastery-desc" | "alphabetical";
type VaultRow = { item: VocabularyItem; progress: VocabularyProgress };

const categoryLabels: Record<ScenarioCategory | "general", string> = {
  office: "Office",
  production: "Production",
  meeting: "Meetings",
  quality: "Quality",
  safety: "Safety",
  career: "Career",
  general: "General",
};

function isDue(progress: VocabularyProgress, now = Date.now()) {
  const dueAt = new Date(progress.nextReviewAt).getTime();
  return !Number.isNaN(dueAt) && dueAt <= now;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarih bekleniyor";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function masteryTone(score: number) {
  if (score >= 80) return { label: "Mastered", color: "lime" as const, text: "text-lime", bg: "border-lime/20 bg-lime/10" };
  if (score >= 45) return { label: "Building", color: "cyan" as const, text: "text-cyan", bg: "border-cyan/20 bg-cyan/10" };
  return { label: "Training", color: "coral" as const, text: "text-coral", bg: "border-coral/20 bg-coral/10" };
}

function VaultAudioButton({
  item,
  playingId,
  play,
}: {
  item: VocabularyItem;
  playingId: string | null;
  play: (item: VocabularyItem) => void;
}) {
  const active = playingId === item.id;
  return (
    <button
      type="button"
      onClick={() => play(item)}
      className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 font-display text-[9px] font-black uppercase tracking-[0.12em] transition ${active ? "border-coral/30 bg-coral/10 text-coral" : "border-cyan/25 bg-cyan/10 text-cyan hover:bg-cyan/20"}`}
      aria-label={active ? `${item.term} sesini durdur` : `${item.term} telaffuzunu dinle`}
    >
      {active ? <Square className="h-3.5 w-3.5 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}
      {active ? "Stop" : "Listen"}
    </button>
  );
}

export default function WordVaultPage() {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);
  const vocabularyProgress = useGameStore((state) => state.progress.vocabularyProgress);
  const settings = useGameStore((state) => state.settings);
  const voiceProvider = useProviderSettingsStore((state) => state.tts.provider);
  const toggleFavorite = useGameStore((state) => state.toggleVocabularyFavorite);
  const reviewVocabulary = useGameStore((state) => state.reviewVocabulary);
  const tts = useTTS();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ScenarioCategory | "general">("all");
  const [filter, setFilter] = useState<VaultFilter>("all");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioNotice, setAudioNotice] = useState("");
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [reviewResults, setReviewResults] = useState({ correct: 0, incorrect: 0 });
  const initialReviewHandled = useRef(false);

  useEffect(() => {
    if (hydrated && !profile?.onboardingComplete) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  useEffect(() => {
    if ((tts.status === "idle" || tts.status === "error") && playingId) {
      setPlayingId(null);
    }
  }, [playingId, tts.status]);

  useEffect(() => {
    if (!hydrated || initialReviewHandled.current || typeof window === "undefined") return;
    initialReviewHandled.current = true;
    const requestedId = new URLSearchParams(window.location.search).get("review");
    if (requestedId && vocabularyProgress[requestedId] && vocabularyById.has(requestedId)) {
      setReviewQueue([requestedId]);
      setReviewIndex(0);
      setAnswerVisible(false);
      setReviewComplete(false);
      setReviewResults({ correct: 0, incorrect: 0 });
    }
  }, [hydrated, vocabularyProgress]);

  const savedRows = useMemo<VaultRow[]>(() => Object.values(vocabularyProgress)
    .map((wordProgress) => {
      const item = vocabularyById.get(wordProgress.vocabularyId);
      return item ? { item, progress: wordProgress } : null;
    })
    .filter((row): row is VaultRow => Boolean(row)), [vocabularyProgress]);

  const dueRows = useMemo(() => savedRows.filter((row) => isDue(row.progress)), [savedRows]);
  const favoriteCount = savedRows.filter((row) => row.progress.favorite).length;
  const masteredCount = savedRows.filter((row) => row.progress.masteryScore >= 80).length;
  const averageMastery = savedRows.length
    ? Math.round(savedRows.reduce((sum, row) => sum + row.progress.masteryScore, 0) / savedRows.length)
    : 0;

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    const rows = savedRows.filter((row) => {
      const matchesQuery = !normalized
        || row.item.term.toLocaleLowerCase("en-US").includes(normalized)
        || row.item.meaningTr.toLocaleLowerCase("tr-TR").includes(normalized)
        || row.item.tags.some((tag) => tag.toLocaleLowerCase("en-US").includes(normalized));
      const matchesCategory = category === "all" || row.item.category === category;
      const matchesFilter = filter === "all"
        || (filter === "due" && isDue(row.progress))
        || (filter === "favorites" && row.progress.favorite)
        || (filter === "learning" && row.progress.masteryScore < 80)
        || (filter === "mastered" && row.progress.masteryScore >= 80);
      return matchesQuery && matchesCategory && matchesFilter;
    });

    return rows.sort((left, right) => {
      if (sort === "alphabetical") return left.item.term.localeCompare(right.item.term, "en-US");
      if (sort === "mastery-asc") return left.progress.masteryScore - right.progress.masteryScore;
      if (sort === "mastery-desc") return right.progress.masteryScore - left.progress.masteryScore;
      return new Date(right.progress.firstLearnedAt).getTime() - new Date(left.progress.firstLearnedAt).getTime();
    });
  }, [category, filter, query, savedRows, sort]);

  const playAudio = useCallback(async (item: VocabularyItem) => {
    if (!settings.audio.narration) {
      setAudioNotice("Seslendirme Ayarlar bölümünde kapalı. Dinlemek için narration seçeneğini aç.");
      return;
    }
    if (playingId === item.id) {
      tts.stop();
      setPlayingId(null);
      return;
    }
    tts.stop();
    setPlayingId(item.id);
    setAudioNotice("Ses kanalı hazırlanıyor…");
    const source = await tts.play(
      item.audioText ?? item.term,
      profile?.accent === "british" ? "en-GB" : "en-US",
      settings.audio.speechRate,
      settings.audio.volume,
    );
    if (source === "error") {
      setPlayingId(null);
      setAudioNotice("Ses oynatılamadı. Provider ve cihaz ses ayarlarını kontrol et.");
    } else if (source === "neural") {
      setAudioNotice("Neural ses kanalı kullanılıyor.");
    } else {
      setAudioNotice(voiceProvider !== "browser" ? "Neural servis bağlanamadı; tarayıcı sesi devraldı." : "Seçtiğin tarayıcı sesi kullanılıyor.");
    }
  }, [playingId, profile?.accent, settings.audio.narration, settings.audio.speechRate, settings.audio.volume, tts, voiceProvider]);

  const startReview = (ids: string[]) => {
    const playable = ids.filter((id) => vocabularyProgress[id] && vocabularyById.has(id)).slice(0, 20);
    if (!playable.length) return;
    tts.stop();
    setPlayingId(null);
    setReviewQueue(playable);
    setReviewIndex(0);
    setAnswerVisible(false);
    setReviewComplete(false);
    setReviewResults({ correct: 0, incorrect: 0 });
    window.scrollTo({ top: 0, behavior: settings.accessibility.reducedMotion ? "auto" : "smooth" });
  };

  const exitReview = () => {
    tts.stop();
    setPlayingId(null);
    setReviewQueue([]);
    setReviewIndex(0);
    setAnswerVisible(false);
    setReviewComplete(false);
    setReviewResults({ correct: 0, incorrect: 0 });
  };

  const recordReview = (correct: boolean) => {
    const id = reviewQueue[reviewIndex];
    if (!id) return;
    reviewVocabulary(id, correct);
    setReviewResults((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      incorrect: current.incorrect + (correct ? 0 : 1),
    }));
    if (reviewIndex >= reviewQueue.length - 1) {
      setReviewComplete(true);
      setAnswerVisible(false);
    } else {
      setReviewIndex((current) => current + 1);
      setAnswerVisible(false);
    }
  };

  const activeReviewItem = reviewQueue[reviewIndex] ? vocabularyById.get(reviewQueue[reviewIndex]!) : undefined;
  const activeReviewProgress = activeReviewItem ? vocabularyProgress[activeReviewItem.id] : undefined;

  if (!hydrated || !profile?.onboardingComplete) {
    return <LoadingScreen label={hydrated ? "Profil yönlendiriliyor" : "Word Vault açılıyor"} />;
  }

  if (reviewQueue.length) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={exitReview} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Vault&apos;a dön
            </button>
            {!reviewComplete ? (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="font-display font-black text-cyan">{String(reviewIndex + 1).padStart(2, "0")}</span>
                <span>/ {String(reviewQueue.length).padStart(2, "0")}</span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10 sm:w-40">
                  <div className="h-full rounded-full bg-cyan transition-[width]" style={{ width: `${((reviewIndex + 1) / reviewQueue.length) * 100}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          {reviewComplete ? (
            <Panel className="mt-6" accent="lime">
              <div className="relative overflow-hidden p-6 text-center sm:p-10">
                <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-lime/10 blur-3xl" />
                <div className="relative">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-lime/30 bg-lime/10 text-lime shadow-lime"><Trophy className="h-8 w-8" /></div>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-lime">Review shift complete</p>
                  <h1 className="mt-3 font-display text-3xl font-black uppercase text-white sm:text-5xl">Memory banks updated.</h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">Her cevabın Leitner kutusunu, hâkimiyet puanını ve bir sonraki tekrar tarihini güncelledi.</p>
                  <div className="mx-auto mt-7 grid max-w-xl grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="font-display text-2xl font-black text-white">{reviewQueue.length}</p><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">Reviewed</p></div>
                    <div className="rounded-xl border border-lime/20 bg-lime/[0.06] p-4"><p className="font-display text-2xl font-black text-lime">{reviewResults.correct}</p><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">Confident</p></div>
                    <div className="rounded-xl border border-coral/20 bg-coral/[0.06] p-4"><p className="font-display text-2xl font-black text-coral">{reviewResults.incorrect}</p><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-500">Again soon</p></div>
                  </div>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button onClick={exitReview}>Vault&apos;a dön</Button>
                    <Button variant="secondary" onClick={() => startReview(reviewQueue)}>Aynı seti tekrarla</Button>
                  </div>
                </div>
              </div>
            </Panel>
          ) : activeReviewItem && activeReviewProgress ? (
            <Panel className="mt-6" label="ACTIVE RECALL / LEITNER REVIEW">
              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] ${isDue(activeReviewProgress) ? "border-amber/25 bg-amber/10 text-amber" : "border-cyan/20 bg-cyan/10 text-cyan"}`}>
                    {isDue(activeReviewProgress) ? "Review due" : "Focused review"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Leitner box {activeReviewProgress.leitnerBox}/5 · Mastery {activeReviewProgress.masteryScore}%</span>
                </div>

                <div className="mt-6 min-h-[360px] rounded-2xl border border-cyan/20 bg-[radial-gradient(circle_at_top,rgba(85,246,255,.08),transparent_55%),rgba(0,0,0,.16)] p-6 text-center sm:p-10">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">What does this mean in workplace English?</p>
                  <h1 className="mt-8 font-display text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">{activeReviewItem.term}</h1>
                  <p className="mt-3 font-display text-sm text-cyan">{activeReviewItem.ipa}</p>
                  <div className="mt-5 flex justify-center">
                    <VaultAudioButton item={activeReviewItem} playingId={playingId} play={playAudio} />
                  </div>

                  {answerVisible ? (
                    <div className="mx-auto mt-8 max-w-2xl animate-[pulse-soft_0.35s_ease-out] rounded-xl border border-lime/20 bg-lime/[0.055] p-5 text-left">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-xl font-bold text-lime">{activeReviewItem.meaningTr}</p>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-slate-400">{activeReviewItem.partOfSpeech}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Yaklaşık telaffuz: <span className="text-slate-200">{activeReviewItem.pronunciationTr}</span></p>
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="text-sm leading-6 text-white">“{activeReviewItem.exampleEn}”</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{activeReviewItem.exampleTr}</p>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setAnswerVisible(true)} className="mt-10 inline-flex min-h-12 items-center gap-2 rounded-xl bg-lime px-6 font-display text-[11px] font-black uppercase tracking-[0.14em] text-ink shadow-lime transition hover:-translate-y-0.5 hover:bg-white">
                      Cevabı göster <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {answerVisible ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => recordReview(false)} className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-coral/30 bg-coral/10 px-5 font-display text-[10px] font-black uppercase tracking-[0.13em] text-coral transition hover:bg-coral/20">
                      <XCircle className="h-5 w-5" /> Tekrar çalışmalıyım
                    </button>
                    <button type="button" onClick={() => recordReview(true)} className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-lime/30 bg-lime/10 px-5 font-display text-[10px] font-black uppercase tracking-[0.13em] text-lime transition hover:bg-lime/20">
                      <CheckCircle2 className="h-5 w-5" /> Hatırladım
                    </button>
                  </div>
                ) : null}
              </div>
            </Panel>
          ) : null}
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-2xl border border-cyan/20 bg-[#0a1822]/90 p-5 shadow-neon sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan/[0.08] blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan"><span className="h-1.5 w-1.5 rounded-full bg-lime" /> Personal language inventory</div>
              <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-6xl">Word Vault</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Kaydettiğin iş İngilizcesi ifadelerini dinle, favorile ve aralıklı tekrar sistemiyle kalıcı hâle getir.</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500"><Headphones className="h-3.5 w-3.5 text-cyan" /> Ses: {profile.accent === "british" ? "British English" : "American English"} · {settings.audio.speechRate}x · {voiceProvider !== "browser" ? "neural voice + otomatik fallback" : "seçili tarayıcı sesi"}</div>
            </div>
            <Button
              size="lg"
              onClick={() => startReview((dueRows.length ? dueRows : savedRows).map((row) => row.item.id))}
              disabled={!savedRows.length}
              className="shrink-0"
            >
              <BrainCircuit className="h-5 w-5" /> {dueRows.length ? `${dueRows.length} due review` : "Review başlat"}
            </Button>
          </div>
        </section>

        {audioNotice ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-cyan/15 bg-cyan/[0.045] px-4 py-2.5 text-xs text-slate-400" role="status">
            <span>{audioNotice}</span>
            <button type="button" onClick={() => setAudioNotice("")} className="text-slate-500 hover:text-white" aria-label="Ses bildirimini kapat"><X className="h-4 w-4" /></button>
          </div>
        ) : null}

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Kelime kasası özeti">
          <div className="rounded-xl border border-white/10 bg-panel/80 p-4"><BookOpenCheck className="h-5 w-5 text-cyan" /><p className="mt-4 font-display text-2xl font-black text-white">{savedRows.length}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Saved words</p></div>
          <div className="rounded-xl border border-amber/20 bg-amber/[0.05] p-4"><Clock3 className="h-5 w-5 text-amber" /><p className="mt-4 font-display text-2xl font-black text-white">{dueRows.length}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Due now</p></div>
          <div className="rounded-xl border border-lime/20 bg-lime/[0.05] p-4"><Trophy className="h-5 w-5 text-lime" /><p className="mt-4 font-display text-2xl font-black text-white">{masteredCount}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Mastered</p></div>
          <div className="rounded-xl border border-coral/20 bg-coral/[0.05] p-4"><Target className="h-5 w-5 text-coral" /><p className="mt-4 font-display text-2xl font-black text-white">{averageMastery}%</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Avg mastery</p></div>
        </section>

        <Panel className="mt-5" label="VAULT FILTER MATRIX">
          <div className="grid gap-3 p-4 lg:grid-cols-[minmax(250px,1fr)_190px_190px]">
            <label className="relative block">
              <span className="sr-only">Kelime ara</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search term, Turkish meaning or tag…" className="min-h-11 w-full rounded-lg border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan/50" />
            </label>
            <label className="relative">
              <span className="sr-only">Kategori filtresi</span>
              <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="min-h-11 w-full appearance-none rounded-lg border border-white/10 bg-[#091722] px-3 text-xs font-bold text-slate-300 outline-none focus:border-cyan/50">
                <option value="all">All categories</option>
                {Object.entries(categoryLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </label>
            <label>
              <span className="sr-only">Sıralama</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} className="min-h-11 w-full rounded-lg border border-white/10 bg-[#091722] px-3 text-xs font-bold text-slate-300 outline-none focus:border-cyan/50">
                <option value="recent">Recently saved</option>
                <option value="mastery-asc">Mastery: low first</option>
                <option value="mastery-desc">Mastery: high first</option>
                <option value="alphabetical">A–Z</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-white/[0.08] px-4 py-3" aria-label="Kelime durum filtresi">
            {([
              ["all", `All ${savedRows.length}`],
              ["due", `Due ${dueRows.length}`],
              ["favorites", `Favorites ${favoriteCount}`],
              ["learning", "Learning"],
              ["mastered", `Mastered ${masteredCount}`],
            ] as Array<[VaultFilter, string]>).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={`min-h-9 shrink-0 rounded-lg border px-3 font-display text-[9px] font-black uppercase tracking-[0.12em] transition ${filter === id ? "border-cyan/40 bg-cyan/15 text-cyan" : "border-white/[0.08] bg-white/[0.025] text-slate-500 hover:text-white"}`}>{label}</button>
            ))}
            {filteredRows.length ? <button type="button" onClick={() => startReview(filteredRows.map((row) => row.item.id))} className="ml-auto inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-lime/25 bg-lime/10 px-3 font-display text-[9px] font-black uppercase tracking-[0.12em] text-lime"><Sparkles className="h-3.5 w-3.5" /> Bu seti tekrarla</button> : null}
          </div>
        </Panel>

        {savedRows.length === 0 ? (
          <Panel className="mt-5" accent="lime">
            <div className="grid min-h-[410px] place-items-center p-6 text-center">
              <div className="max-w-lg">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan/25 bg-cyan/10 text-cyan"><BookOpenCheck className="h-8 w-8" /></div>
                <h2 className="mt-5 font-display text-2xl font-black uppercase text-white">Your vault is ready.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">Görev diyaloglarındaki kelime ve ifadelere dokunup “Kelime kasasına ekle” dediğinde kartların burada görünür. Görev sonunda yeni hedef ifadeler de otomatik kaydedilir.</p>
                <Link href="/map" className="arcade-button mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-lime px-6 font-display text-[10px] font-black uppercase tracking-[0.14em] text-ink">İlk görevi seç <ChevronRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </Panel>
        ) : filteredRows.length === 0 ? (
          <Panel className="mt-5">
            <div className="grid min-h-[300px] place-items-center p-6 text-center">
              <div>
                <Search className="mx-auto h-8 w-8 text-slate-600" />
                <h2 className="mt-4 font-display text-lg font-black uppercase text-white">No matching cards</h2>
                <p className="mt-2 text-sm text-slate-500">Arama veya filtreleri değiştirerek kasandaki diğer ifadeleri göster.</p>
                <button type="button" onClick={() => { setQuery(""); setCategory("all"); setFilter("all"); }} className="mt-5 min-h-10 rounded-lg border border-cyan/25 bg-cyan/10 px-4 font-display text-[9px] font-black uppercase tracking-[0.12em] text-cyan">Filtreleri temizle</button>
              </div>
            </div>
          </Panel>
        ) : (
          <section className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Kaydedilen kelimeler">
            {filteredRows.map(({ item, progress: wordProgress }) => {
              const tone = masteryTone(wordProgress.masteryScore);
              const due = isDue(wordProgress);
              return (
                <article key={item.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-panel/85 p-5 shadow-[0_16px_45px_rgba(0,0,0,.18)] transition hover:border-cyan/25">
                  <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 bg-cyan/[0.035] blur-2xl transition group-hover:bg-cyan/[0.07]" />
                  <div className="relative flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-white/10 bg-white/[0.035] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">{categoryLabels[item.category]}</span>
                        <span className="rounded-md border border-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">{item.partOfSpeech}</span>
                        {due ? <span className="rounded-md border border-amber/25 bg-amber/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber">Due now</span> : null}
                      </div>
                      <h2 className="mt-4 truncate font-display text-2xl font-black text-white">{item.term}</h2>
                      <p className="mt-1 text-sm font-semibold text-cyan">{item.meaningTr}</p>
                      <p className="mt-2 text-[11px] text-slate-500">{item.ipa} · {item.pronunciationTr}</p>
                    </div>
                    <button type="button" onClick={() => toggleFavorite(item.id)} className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition ${wordProgress.favorite ? "border-coral/30 bg-coral/10 text-coral" : "border-white/10 bg-white/[0.035] text-slate-500 hover:text-coral"}`} aria-label={wordProgress.favorite ? `${item.term} favorilerden çıkar` : `${item.term} favorilere ekle`} aria-pressed={wordProgress.favorite}>
                      <Heart className={`h-4 w-4 ${wordProgress.favorite ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div className="relative mt-5 rounded-xl border border-white/[0.08] bg-black/15 p-4">
                    <MessageExample item={item} />
                  </div>

                  <div className="relative mt-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${tone.bg} ${tone.text}`}>{tone.label}</span>
                      <span className="font-display text-xs font-black text-white">{wordProgress.masteryScore}%</span>
                    </div>
                    <ProgressBar value={wordProgress.masteryScore} color={tone.color} />
                  </div>

                  <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-white/[0.08] bg-black/10 px-2 py-2"><p className="font-display text-xs font-black text-lime">{wordProgress.correctCount}</p><p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-slate-600">Correct</p></div>
                    <div className="rounded-lg border border-white/[0.08] bg-black/10 px-2 py-2"><p className="font-display text-xs font-black text-coral">{wordProgress.incorrectCount}</p><p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-slate-600">Retry</p></div>
                    <div className="rounded-lg border border-white/[0.08] bg-black/10 px-2 py-2"><p className="font-display text-xs font-black text-cyan">{wordProgress.leitnerBox}/5</p><p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-slate-600">Box</p></div>
                  </div>

                  <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
                    <VaultAudioButton item={item} playingId={playingId} play={playAudio} />
                    <button type="button" onClick={() => startReview([item.id])} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-lime/25 bg-lime/10 px-3 font-display text-[9px] font-black uppercase tracking-[0.12em] text-lime transition hover:bg-lime/20"><Zap className="h-3.5 w-3.5" /> Review</button>
                    <span className="ml-auto text-[9px] text-slate-600">Next: {formatDate(wordProgress.nextReviewAt)}</span>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="mt-5 text-center text-[10px] leading-5 text-slate-600">Tekrar cevapları XP kaybettirmez. “Tekrar çalışmalıyım” seçimi kelimeyi daha yakına, “Hatırladım” seçimi daha ileri bir tarihe planlar.</p>
      </main>
    </AppShell>
  );
}

function MessageExample({ item }: { item: VocabularyItem }) {
  return (
    <>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">Workplace example</p>
      <p className="mt-2 text-sm leading-6 text-slate-200">“{item.exampleEn}”</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{item.exampleTr}</p>
    </>
  );
}
