"use client";

import { useMemo, useState } from "react";
import { getVocabularyById } from "@/data/vocabulary";
import type { VocabularyItem } from "@/types";
import { VocabularyCard } from "./vocabulary-card";
import { cn } from "@/components/ui/cn";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function InteractiveText({ text, vocabularyIds, scenarioId, className }: { text: string; vocabularyIds: string[]; scenarioId?: string; className?: string }) {
  const [selected, setSelected] = useState<VocabularyItem | null>(null);
  const items = useMemo(() => vocabularyIds.map(getVocabularyById).filter((item): item is VocabularyItem => Boolean(item)).sort((a, b) => b.term.length - a.term.length), [vocabularyIds]);
  const pieces = useMemo(() => {
    if (!items.length) return [text];
    const expression = new RegExp(`(${items.map((item) => escapeRegExp(item.term)).join("|")})`, "gi");
    return text.split(expression).filter(Boolean);
  }, [items, text]);

  return (
    <>
      <span className={className}>
        {pieces.map((piece, index) => {
          const item = items.find((candidate) => candidate.term.toLocaleLowerCase("en") === piece.toLocaleLowerCase("en"));
          return item ? (
            <button key={`${piece}-${index}`} type="button" onClick={() => setSelected(item)} className={cn("inline rounded-sm border-b border-dashed border-cyan/70 bg-cyan/[0.08] px-0.5 text-left text-cyan transition hover:bg-cyan/20 hover:text-white", className?.includes("text-") && "font-inherit")} title={`${item.meaningTr} — kartı aç`}>
              {piece}
            </button>
          ) : <span key={`${piece}-${index}`}>{piece}</span>;
        })}
      </span>
      {selected ? <VocabularyCard item={selected} scenarioId={scenarioId} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
