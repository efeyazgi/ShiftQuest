import {
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  Quote,
  Sparkles,
  Target,
} from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import type { RoleplayEvaluation } from "@/types";

type RoleplayFeedbackProps = {
  evaluation: RoleplayEvaluation;
  source: "mock" | "provider";
};

export function RoleplayFeedback({ evaluation, source }: RoleplayFeedbackProps) {
  const scoreColor = evaluation.overallScore >= 70 ? "lime" : evaluation.overallScore >= 50 ? "amber" : "coral";
  return (
    <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
      <section aria-labelledby="roleplay-score-heading" className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p id="roleplay-score-heading" className="font-display text-[10px] uppercase tracking-[0.18em] text-cyan">Communication debrief</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{evaluation.summaryTr}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-black text-white">{evaluation.overallScore}<span className="text-xs text-slate-500">/100</span></p>
            <span className="mt-1 inline-flex rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {source === "provider" ? "Harici AI" : "Temel değerlendirme"}
            </span>
          </div>
        </div>
        <ProgressBar className="mt-4" value={evaluation.overallScore} color={scoreColor} />
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <StatusPill ok={evaluation.goalAchieved} label="Görev hedefi" />
          <StatusPill ok={evaluation.lengthStatus !== "too-short"} label={`${evaluation.wordCount} kelime`} />
          <StatusPill ok={evaluation.usedTargetVocabulary.some((item) => item.usedCorrectly)} label="Hedef ifade" />
        </div>
      </section>

      <section aria-labelledby="criteria-heading" className="rounded-xl border border-white/10 bg-black/15 p-4">
        <h4 id="criteria-heading" className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.17em] text-slate-400"><Target className="h-3.5 w-3.5 text-cyan" /> Ölçütler</h4>
        <div className="mt-3 space-y-3">
          {evaluation.criteria.map((criterion) => (
            <div key={criterion.criterionId} className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
              <div className="flex items-center justify-between gap-3 text-xs"><span className="font-bold text-white">{criterion.label} <span className="font-normal text-slate-600">· %{criterion.weight}</span></span><span className={criterion.met ? "text-lime" : "text-amber"}>{criterion.score}/100</span></div>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">{criterion.feedbackTr}</p>
              {criterion.evidenceQuote ? <p className="mt-2 flex items-start gap-2 text-xs italic leading-5 text-slate-300"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" /> “{criterion.evidenceQuote}”</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="vocabulary-evidence-heading" className="rounded-xl border border-cyan/15 bg-cyan/[0.035] p-4">
        <h4 id="vocabulary-evidence-heading" className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.17em] text-cyan"><BookOpenCheck className="h-3.5 w-3.5" /> Gerçek kelime kullanımı</h4>
        {evaluation.usedTargetVocabulary.length ? (
          <div className="mt-3 space-y-2">
            {evaluation.usedTargetVocabulary.map((item) => (
              <div key={item.vocabularyId} className="rounded-lg border border-white/[0.08] bg-black/15 p-3 text-xs">
                <div className="flex items-center gap-2"><span className="font-bold text-white">{item.term}</span>{item.usedCorrectly ? <CheckCircle2 className="h-4 w-4 text-lime" /> : <CircleAlert className="h-4 w-4 text-amber" />}</div>
                <p className="mt-1 text-slate-400">{item.feedbackTr}</p>
                <p className="mt-1.5 italic text-slate-300">“{item.evidenceQuote}”</p>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs leading-5 text-amber">Yanıtında hedef ifadelerden hiçbiri bulunamadı. Kullanmadığın bir ifade güçlü yön olarak gösterilmez.</p>}
      </section>

      {evaluation.strengths.length ? (
        <section aria-labelledby="strengths-heading" className="rounded-xl border border-lime/15 bg-lime/[0.035] p-4">
          <h4 id="strengths-heading" className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.17em] text-lime"><CheckCircle2 className="h-3.5 w-3.5" /> Kanıtlı güçlü yönler</h4>
          <ul className="mt-3 space-y-2">{evaluation.strengths.map((item) => <li key={`${item.labelTr}-${item.evidenceQuote}`} className="text-xs leading-5 text-slate-300"><span className="font-semibold text-white">{item.labelTr}</span> — “{item.evidenceQuote}”</li>)}</ul>
        </section>
      ) : null}

      {evaluation.improvements.length ? (
        <section aria-labelledby="improvements-heading" className="rounded-xl border border-amber/20 bg-amber/[0.045] p-4">
          <h4 id="improvements-heading" className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.17em] text-amber"><Sparkles className="h-3.5 w-3.5" /> Geliştirilebilecek noktalar</h4>
          <div className="mt-3 space-y-3">{evaluation.improvements.map((item) => <div key={`${item.issueTr}-${item.suggestionEn}`}><p className="text-xs font-semibold text-white">{item.issueTr}</p><p className="mt-1 text-xs leading-5 text-slate-400">{item.reasonTr}</p>{item.suggestionEn ? <p className="mt-1.5 rounded-md bg-black/20 px-2.5 py-2 text-xs text-cyan">{item.suggestionEn}</p> : null}</div>)}</div>
        </section>
      ) : null}

      <section aria-labelledby="polished-heading" className="rounded-xl border border-violet-300/15 bg-violet-300/[0.035] p-4">
        <h4 id="polished-heading" className="font-display text-[10px] uppercase tracking-[0.17em] text-violet-300">Daha güçlü bir sürüm</h4>
        <p className="mt-2 text-sm leading-6 text-white">{evaluation.polishedAnswer}</p>
      </section>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-semibold ${ok ? "border-lime/20 bg-lime/5 text-lime" : "border-amber/20 bg-amber/5 text-amber"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}{label}
    </div>
  );
}
