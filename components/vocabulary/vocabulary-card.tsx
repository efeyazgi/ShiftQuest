"use client";

import { BookmarkPlus, Check, Heart, Volume2, X } from "lucide-react";
import { useEffect } from "react";
import type { VocabularyItem } from "@/types";
import { useGameStore } from "@/features/game/store";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

export function VocabularyCard({ item, scenarioId, onClose }: { item: VocabularyItem; scenarioId?: string; onClose: () => void }) {
  const saved = useGameStore((state) => state.progress.vocabularyProgress[item.id]);
  const saveVocabulary = useGameStore((state) => state.saveVocabulary);
  const toggleFavorite = useGameStore((state) => state.toggleVocabularyFavorite);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="word-card-title" className="panel scanlines relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-cyan/30 bg-[#0b1c27] p-5 shadow-[0_0_70px_rgba(85,246,255,.18)] sm:rounded-2xl sm:p-7">
        <button onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white" aria-label="Kelime kartını kapat"><X className="h-4 w-4" /></button>
        <div className="mb-6 pr-12">
          <p className="mb-2 font-display text-[10px] uppercase tracking-[0.25em] text-cyan">Word scan // {item.partOfSpeech}</p>
          <h2 id="word-card-title" className="text-3xl font-black tracking-tight text-white">{item.term}</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-sm"><span className="font-mono text-cyan">{item.ipa}</span><span className="text-slate-500">·</span><span className="text-slate-300">{item.pronunciationTr}</span></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Türkçe anlam</p>
            <p className="mt-1.5 text-lg font-semibold text-lime">{item.meaningTr}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"><AudioPlayer text={item.audioText ?? item.term} compact /></div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500"><Volume2 className="h-3.5 w-3.5" /> İş hayatından örnek</div>
          <p className="font-medium leading-relaxed text-white">“{item.exampleEn}”</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.exampleTr}</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><p className="mb-2 text-xs text-slate-400">Hâkimiyet</p><ProgressBar value={saved?.masteryScore ?? 0} color="lime" /></div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"><span className="text-xs text-slate-400">Yanlış sayısı</span><strong className="font-display text-coral">{saved?.incorrectCount ?? 0}</strong></div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => saveVocabulary(item.id, scenarioId)} disabled={Boolean(saved)}>{saved ? <><Check className="h-4 w-4" /> Kasada kayıtlı</> : <><BookmarkPlus className="h-4 w-4" /> Kelime kasasına ekle</>}</Button>
          <Button variant="ghost" onClick={() => toggleFavorite(item.id)}><Heart className={`h-4 w-4 ${saved?.favorite ? "fill-coral text-coral" : ""}`} /> {saved?.favorite ? "Favoride" : "Favorile"}</Button>
        </div>
      </section>
    </div>
  );
}
