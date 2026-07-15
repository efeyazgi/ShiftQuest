"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ChartNoAxesColumnIncreasing,
  CircleHelp,
  MapPinned,
  Play,
  Sparkles,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useGameStore } from "@/features/game/store";

export const TUTORIAL_OPEN_EVENT = "shiftquest:open-tutorial";

export function requestFirstRunTutorial() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TUTORIAL_OPEN_EVENT));
}

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  tip: string;
  target: string | null;
  icon: LucideIcon;
  accent: "cyan" | "lime" | "amber";
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
};

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Kampüse hoş geldin",
    description: "Burası ana üssün. Seviyene ve kariyer rotana göre görevleri buradan seçip sanal mühendislik kariyerinde ilerleyeceksin.",
    tip: "Bu hızlı tur bir dakikadan kısa sürer.",
    target: '[data-tour="map-welcome"]',
    icon: Sparkles,
    accent: "cyan",
  },
  {
    id: "map",
    title: "Haritayı takip et",
    description: "Her bölge farklı bir iş İngilizcesi bağlamını temsil eder. Açık düğümler oynanabilir; kilitli görevler gereken XP veya ön koşulu gösterir.",
    tip: "Office, üretim, kalite, toplantı ve güvenlik görevleri aynı kampüste buluşur.",
    target: '[data-tour="career-map"]',
    icon: MapPinned,
    accent: "cyan",
  },
  {
    id: "daily-shift",
    title: "İlk vardiyanı başlat",
    description: "Daily Shift, seviyene ve rotana uygun en iyi sıradaki görevi önerir. Karttaki süreyi, aşama sayısını ve ödülü görüp tek tıkla başlayabilirsin.",
    tip: "Bir görev ortalama 5–10 dakika sürer.",
    target: '[data-tour="daily-shift"]',
    icon: Play,
    accent: "lime",
  },
  {
    id: "rewards",
    title: "XP kazan, unvan aç",
    description: "Doğru yanıtlar ve tamamlanan görevler XP ile coin kazandırır. XP yeni oyun içi unvanları ve bölgeleri açar; hatalar XP kaybettirmez.",
    tip: "Coin ve unvanlar yalnızca oyun içi ilerleme ödülleridir.",
    target: '[data-tour="hud-rewards"]',
    icon: Trophy,
    accent: "amber",
  },
  {
    id: "tools",
    title: "Gelişimini görünür kıl",
    description: "Performans ekranı güçlü ve zayıf alanlarını analiz eder. Word Vault ise görevlerde kaydettiğin ifadeleri tekrar etmen için kişisel kelime kasandır.",
    tip: "Harita, Performans, Word Vault ve Ayarlar arasında ana menüden geçebilirsin.",
    target: '[data-tour="app-navigation"]',
    icon: ChartNoAxesColumnIncreasing,
    accent: "cyan",
  },
  {
    id: "settings",
    title: "AI ve sesi sana göre ayarla",
    description: "Ayarlar bölümünde aksanı, anlatım hızını, ses kanallarını ve AI sağlayıcısını yönetebilirsin. Harici anahtar olmasa da statik görevler ve ses yedeği çalışır.",
    tip: "AI ve neural voice seçenekleri isteğe bağlıdır; temel oyun çevrimdışı içeriğe geri döner.",
    target: '[data-tour="settings-link"]',
    icon: Bot,
    accent: "lime",
  },
  {
    id: "reopen",
    title: "Kaybolursan turu yeniden aç",
    description: "Bu yardım düğmesi hızlı turu istediğin zaman baştan başlatır. Aynı seçenek Ayarlar ekranında da kalıcı olarak bulunur.",
    tip: "Hazırsın — şimdi ilk vardiyanı seçebilirsin.",
    target: '[data-tour="tutorial-help"]',
    icon: CircleHelp,
    accent: "lime",
  },
];

const accentStyles = {
  cyan: {
    icon: "border-cyan/30 bg-cyan/10 text-cyan",
    eyebrow: "text-cyan",
    progress: "bg-cyan",
  },
  lime: {
    icon: "border-lime/30 bg-lime/10 text-lime",
    eyebrow: "text-lime",
    progress: "bg-lime",
  },
  amber: {
    icon: "border-amber/30 bg-amber/10 text-amber",
    eyebrow: "text-amber",
    progress: "bg-amber",
  },
} as const;

function storageKey(profileId: string) {
  return `shiftquest-guided-tour-v1:${profileId}`;
}

function findVisibleTarget(selector: string | null) {
  if (!selector) return null;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return candidates.find((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }) ?? null;
}

export function FirstRunTutorial() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [dialogHeight, setDialogHeight] = useState(320);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const step = tutorialSteps[stepIndex];
  const isLastStep = stepIndex === tutorialSteps.length - 1;

  const beginTour = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !profile?.onboardingComplete || pathname !== "/map") return;

    const url = new URL(window.location.href);
    const forced = url.searchParams.get("tour") === "1";
    if (forced) {
      url.searchParams.delete("tour");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }

    let hasSeenTour = false;
    try {
      hasSeenTour = Boolean(window.localStorage.getItem(storageKey(profile.id)));
    } catch {
      hasSeenTour = false;
    }
    if (forced || !hasSeenTour) beginTour();
  }, [beginTour, hydrated, pathname, profile?.id, profile?.onboardingComplete]);

  useEffect(() => {
    const handleOpenRequest = () => {
      if (pathname === "/map") beginTour();
    };
    window.addEventListener(TUTORIAL_OPEN_EVENT, handleOpenRequest);
    return () => window.removeEventListener(TUTORIAL_OPEN_EVENT, handleOpenRequest);
  }, [beginTour, pathname]);

  const measureTarget = useCallback(() => {
    if (!open) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    setViewport({ width, height });
    if (dialogRef.current) setDialogHeight(dialogRef.current.getBoundingClientRect().height);

    const element = findVisibleTarget(tutorialSteps[stepIndex].target);
    if (!element) {
      setTargetRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    const padding = width < 640 ? 6 : 9;
    const left = Math.max(6, rect.left - padding);
    const top = Math.max(6, rect.top - padding);
    const paddedWidth = Math.min(width - left - 6, rect.width + padding * 2);
    const paddedHeight = Math.min(height - top - 6, rect.height + padding * 2);
    setTargetRect({ top, left, width: paddedWidth, height: paddedHeight, bottom: top + paddedHeight });
  }, [open, stepIndex]);

  useEffect(() => {
    if (!open) return;
    const target = findVisibleTarget(step.target);
    if (target) target.scrollIntoView({ block: "center", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });

    const frame = window.requestAnimationFrame(measureTarget);
    const settleTimer = window.setTimeout(measureTarget, reduceMotion ? 40 : 380);
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget);
    };
  }, [measureTarget, open, reduceMotion, step.target]);

  const closeTour = useCallback((status: "finished" | "skipped") => {
    if (profile?.id) {
      try {
        window.localStorage.setItem(storageKey(profile.id), JSON.stringify({ version: 1, status, updatedAt: new Date().toISOString() }));
      } catch {
        // The tour still remains dismissible when storage is unavailable.
      }
    }
    setOpen(false);
  }, [profile?.id]);

  const nextStep = useCallback(() => {
    if (isLastStep) {
      closeTour("finished");
      return;
    }
    setStepIndex((current) => Math.min(tutorialSteps.length - 1, current + 1));
  }, [closeTour, isLastStep]);

  const previousStep = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeTour("skipped");
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextStep();
      return;
    }
    if (event.key === "ArrowLeft" && stepIndex > 0) {
      event.preventDefault();
      previousStep();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const dialogStyle = useMemo<CSSProperties>(() => {
    const edge = viewport.width < 640 ? 12 : 16;
    if (!targetRect || !viewport.width) {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: `min(430px, calc(100vw - ${edge * 2}px))` };
    }
    if (viewport.width < 720) {
      return targetRect.top > viewport.height * 0.55
        ? { left: edge, right: edge, top: edge }
        : { left: edge, right: edge, bottom: edge };
    }

    const panelWidth = Math.min(430, viewport.width - edge * 2);
    const left = Math.max(edge, Math.min(viewport.width - panelWidth - edge, targetRect.left + targetRect.width / 2 - panelWidth / 2));
    const below = targetRect.bottom + 16;
    const hasRoomBelow = viewport.height - below >= dialogHeight + edge;
    const top = hasRoomBelow ? below : Math.max(edge, targetRect.top - dialogHeight - 16);
    return { left, top, width: panelWidth };
  }, [dialogHeight, targetRect, viewport]);

  const Icon = step.icon;
  const colors = accentStyles[step.accent];

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="tutorial-backdrop"
            aria-hidden="true"
            className={`fixed inset-0 z-[80] touch-none ${targetRect ? "bg-transparent" : "bg-[#02080c]/80"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          />

          {targetRect ? (
            <motion.div
              key="tutorial-spotlight"
              aria-hidden="true"
              className="pointer-events-none fixed z-[81] rounded-2xl border-2 border-cyan/70 shadow-[0_0_0_9999px_rgba(2,8,12,.82),0_0_0_5px_rgba(85,246,255,.10),0_0_34px_rgba(85,246,255,.3)]"
              initial={{ opacity: 0, top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }}
              animate={{ opacity: 1, top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
            />
          ) : null}

          <motion.section
            key="tutorial-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-description"
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
            style={dialogStyle}
            className="fixed z-[90] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border border-cyan/25 bg-[#091923]/[0.98] p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,.62),0_0_35px_rgba(85,246,255,.10)] outline-none sm:p-6"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 14, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/[0.35]">
                <span className="size-1.5 rounded-full bg-lime shadow-[0_0_10px_rgba(199,255,74,.55)]" />
                Quick start / {String(stepIndex + 1).padStart(2, "0")}
              </div>
              <button type="button" onClick={() => closeTour("skipped")} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/[0.35] transition hover:bg-white/5 hover:text-white" aria-label="Hızlı turu geç">
                Turu geç <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 flex items-start gap-4" aria-live="polite">
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl border ${colors.icon}`}><Icon className="size-5" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${colors.eyebrow}`}>ShiftQuest rehberi</p>
                <h2 id="tutorial-title" className="mt-1.5 font-display text-xl font-black uppercase leading-tight tracking-[-0.025em] sm:text-2xl">{step.title}</h2>
              </div>
            </div>

            <p id="tutorial-description" className="mt-5 text-sm leading-6 text-white/[0.65]">{step.description}</p>
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 text-xs leading-5 text-white/[0.42]">{step.tip}</div>

            <div className="mt-5 flex gap-1.5" role="progressbar" aria-label="Hızlı tur ilerlemesi" aria-valuemin={1} aria-valuemax={tutorialSteps.length} aria-valuenow={stepIndex + 1} aria-valuetext={`${stepIndex + 1} / ${tutorialSteps.length}`}>
              {tutorialSteps.map((item, index) => (
                <span key={item.id} aria-hidden="true" className={`h-1.5 flex-1 overflow-hidden rounded-full ${index <= stepIndex ? "bg-white/[0.12]" : "bg-white/[0.06]"}`}>
                  {index <= stepIndex ? <span className={`block size-full ${index === stepIndex ? colors.progress : "bg-cyan/[0.45]"}`} /> : null}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" onClick={previousStep} disabled={stepIndex === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-[10px] font-black uppercase tracking-[0.13em] text-white/[0.55] transition hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-25"><ArrowLeft className="size-4" /> Geri</button>
              <span className="hidden text-[9px] font-bold text-white/[0.22] sm:block">← → tuşlarıyla ilerle</span>
              <button type="button" onClick={nextStep} className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-lime px-5 font-display text-[10px] font-black uppercase tracking-[0.13em] text-ink shadow-[0_0_24px_rgba(199,255,74,.16)] transition hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(199,255,74,.28)]">
                {isLastStep ? "Turu bitir" : "Devam"}
                {isLastStep ? <Sparkles className="size-4" /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
