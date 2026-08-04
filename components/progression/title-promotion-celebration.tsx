"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Crown,
  Factory,
  GitBranch,
  GraduationCap,
  HardHat,
  Sparkles,
  Trophy,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { careerRegions, GAME_TITLE_DISCLAIMER_TR, getCareerTitleForXp } from "@/data/career";
import { useGameStore } from "@/features/game/store";
import type { CareerTitle } from "@/types";

type Promotion = {
  from: CareerTitle;
  to: CareerTitle;
};

const celebrationKey = (profileId: string) => `shiftquest-title-celebration-v1:${profileId}`;

const titleIcons: Record<string, LucideIcon> = {
  "hard-hat": HardHat,
  "graduation-cap": GraduationCap,
  "git-branch": GitBranch,
  "clock-3": Clock3,
  factory: Factory,
  "badge-check": BadgeCheck,
  "users-round": UsersRound,
  crown: Crown,
};

const particles = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  x: ((index * 37) % 94) + 3,
  delay: (index % 7) * 0.07,
  duration: 1.35 + (index % 5) * 0.16,
  drift: ((index % 3) - 1) * (24 + (index % 4) * 7),
  rotate: index % 2 === 0 ? 240 : -220,
  color: ["#c7ff4a", "#55f6ff", "#facc15", "#c084fc", "#fb7185"][index % 5],
}));

export function TitlePromotionCelebration() {
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);
  const progress = useGameStore((state) => state.progress);
  const lastResult = useGameStore((state) => state.lastResult);
  const accessibility = useGameStore((state) => state.settings.accessibility);
  const prefersReducedMotion = useReducedMotion();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const motionDisabled = Boolean(prefersReducedMotion) || accessibility.reducedMotion || !accessibility.animations;

  const detectedPromotion = useMemo<Promotion | null>(() => {
    if (!lastResult) return null;
    const previousXp = Math.max(0, progress.totalXp - lastResult.xpEarned);
    const from = getCareerTitleForXp(previousXp);
    const to = getCareerTitleForXp(progress.totalXp);
    return to.rank > from.rank ? { from, to } : null;
  }, [lastResult, progress.totalXp]);

  useEffect(() => {
    if (!hydrated || !profile || !detectedPromotion) return;
    if (window.localStorage.getItem(celebrationKey(profile.id)) === detectedPromotion.to.id) return;
    setPromotion(detectedPromotion);
  }, [detectedPromotion, hydrated, profile]);

  const dismiss = useCallback(() => {
    if (profile && promotion) {
      window.localStorage.setItem(celebrationKey(profile.id), promotion.to.id);
    }
    setPromotion(null);
  }, [profile, promotion]);

  useEffect(() => {
    if (!promotion) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [dismiss, promotion]);

  const unlockedLabels = promotion
    ? promotion.to.unlocks
      .filter((unlock) => !promotion.from.unlocks.includes(unlock))
      .map((unlock) => careerRegions.find((region) => region.id === unlock)?.name ?? unlock.replaceAll("-", " "))
    : [];
  const PromotionIcon = promotion ? titleIcons[promotion.to.icon] ?? Trophy : Trophy;

  return (
    <AnimatePresence>
      {promotion ? (
        <motion.div
          className="fixed inset-0 z-[130] grid overflow-y-auto bg-[#02080d]/90 p-4 backdrop-blur-md sm:p-6"
          initial={motionDisabled ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={motionDisabled ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.2 } }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="title-promotion-heading"
          aria-describedby="title-promotion-description"
        >
          {!motionDisabled ? (
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
              {particles.map((particle) => (
                <motion.span
                  key={particle.id}
                  className="absolute top-[-8%] h-3 w-1.5 rounded-sm"
                  style={{ left: `${particle.x}%`, backgroundColor: particle.color }}
                  initial={{ y: "-8vh", x: 0, rotate: 0, opacity: 0 }}
                  animate={{ y: "112vh", x: particle.drift, rotate: particle.rotate, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: particle.duration, delay: 0.18 + particle.delay, ease: "easeIn" }}
                />
              ))}
            </div>
          ) : null}

          <motion.section
            ref={dialogRef}
            className="scanlines relative m-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border bg-[#0a1923] p-6 text-center shadow-2xl sm:p-9"
            style={{
              borderColor: `${promotion.to.color}66`,
              boxShadow: `0 0 100px ${promotion.to.color}24, 0 35px 90px rgba(0,0,0,.6)`,
            }}
            initial={motionDisabled ? false : { opacity: 0, scale: 0.84, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={motionDisabled ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            transition={motionDisabled ? { duration: 0 } : { type: "spring", stiffness: 230, damping: 21 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[url('/pipeline-pattern.svg')] bg-cover opacity-[0.08]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-80 -translate-x-1/2 -translate-y-1/3 rounded-full blur-[70px]" style={{ backgroundColor: `${promotion.to.color}2c` }} />

            <button ref={closeButtonRef} type="button" onClick={dismiss} className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/25 text-white/45 transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan" aria-label="Unvan kutlamasını kapat">
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <motion.div
                className="relative mx-auto grid h-28 w-28 place-items-center rounded-[2rem] border-2 bg-black/25"
                style={{ borderColor: promotion.to.color, color: promotion.to.color, boxShadow: `0 0 55px ${promotion.to.color}3d` }}
                animate={motionDisabled ? undefined : { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }}
                transition={{ delay: 0.35, duration: 0.7 }}
                aria-hidden="true"
              >
                <motion.span className="absolute inset-[-12px] rounded-[2.5rem] border" style={{ borderColor: `${promotion.to.color}35` }} animate={motionDisabled ? undefined : { scale: [0.88, 1.16], opacity: [0.75, 0] }} transition={{ duration: 1.35, repeat: 1, ease: "easeOut" }} />
                <PromotionIcon className="h-12 w-12" strokeWidth={1.8} />
                <span className="absolute -bottom-3 rounded-full border border-white/15 bg-[#071019] px-3 py-1 font-display text-[9px] font-black uppercase tracking-[0.16em] text-white">Rank {promotion.to.rank.toString().padStart(2, "0")}</span>
              </motion.div>

              <p className="mt-8 flex items-center justify-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: promotion.to.color }}><Sparkles className="h-3.5 w-3.5" /> Title upgrade <Sparkles className="h-3.5 w-3.5" /></p>
              <h2 id="title-promotion-heading" className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-0.04em] text-white sm:text-5xl">{promotion.to.name}</h2>
              <p className="mt-3 text-base font-bold" style={{ color: promotion.to.color }}>{promotion.to.nameTr}</p>
              <p id="title-promotion-description" className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">{promotion.to.description}</p>

              <div className="mx-auto mt-6 grid max-w-lg grid-cols-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left sm:grid-cols-[1fr_auto_1fr]">
                <div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/30">Önceki</p><p className="mt-1 break-words text-xs font-bold text-slate-400 sm:text-sm">{promotion.from.name}</p></div>
                <ArrowRight className="mx-auto h-4 w-4 rotate-90 sm:rotate-0" style={{ color: promotion.to.color }} />
                <div className="min-w-0 text-left sm:text-right"><p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/30">Yeni unvan</p><p className="mt-1 break-words text-xs font-black text-white sm:text-sm">{promotion.to.name}</p></div>
              </div>

              {unlockedLabels.length ? (
                <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-lime/20 bg-lime/[0.06] px-4 py-3 text-left">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-lime">Yeni erişim</p>
                  <p className="mt-1.5 text-sm font-bold text-white">{unlockedLabels.join(" · ")}</p>
                </div>
              ) : null}

              <button type="button" onClick={dismiss} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime px-6 font-display text-xs font-black uppercase tracking-[0.13em] text-ink shadow-[0_8px_0_rgba(92,120,19,.55)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime active:translate-y-1 active:shadow-none">
                Yeni unvanla devam et <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mx-auto mt-6 max-w-lg text-[9px] leading-4 text-white/25">{GAME_TITLE_DISCLAIMER_TR}</p>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
