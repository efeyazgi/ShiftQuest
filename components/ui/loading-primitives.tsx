import { Cpu, Radio, Sparkles } from "lucide-react";

import { cn } from "@/components/ui/cn";

export type RouteLoadingVariant =
  | "dashboard"
  | "map"
  | "results"
  | "scenario"
  | "settings"
  | "vault";

const routeCopy: Record<RouteLoadingVariant, string> = {
  dashboard: "Performans sinyalleri toplanıyor",
  map: "Kampüs haritası yükleniyor",
  results: "Vardiya raporu derleniyor",
  scenario: "Görev terminali bağlanıyor",
  settings: "Kontrol paneli hazırlanıyor",
  vault: "Kelime kasası açılıyor",
};

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-lg border border-white/[0.06] bg-white/[0.045]",
        className,
      )}
    />
  );
}

export function ArcadeLoader({
  label = "Vardiya hazırlanıyor",
  detail,
}: {
  label?: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center" role="status" aria-live="polite" aria-busy="true">
      <div className="relative grid h-[76px] w-[76px] place-items-center" aria-hidden="true">
        <span className="absolute inset-0 rounded-2xl border border-cyan/25 bg-cyan/[0.035] shadow-[0_0_40px_rgba(85,246,255,.12)]" />
        <span className="absolute inset-2 animate-[spin_2.2s_linear_infinite] rounded-xl border border-dashed border-cyan/45" />
        <span className="absolute inset-[19px] animate-pulse rounded-lg border border-lime/35 bg-lime/10" />
        <Cpu className="relative h-5 w-5 text-lime" />
        <span className="absolute -right-1 top-3 h-2 w-2 animate-ping rounded-full bg-cyan" />
      </div>
      <p className="mt-5 font-display text-[11px] font-black uppercase tracking-[0.2em] text-cyan">{label}</p>
      {detail ? <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">{detail}</p> : null}
      <span className="mt-4 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1.5 w-7 rounded-full bg-white/10",
              step === 0 && "animate-pulse bg-cyan/80",
              step === 1 && "animate-pulse bg-cyan/40 [animation-delay:180ms]",
            )}
          />
        ))}
      </span>
    </div>
  );
}

function LoadingBanner({ label }: { label: string }) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl border border-cyan/15 bg-cyan/[0.035] px-4 py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-[shimmer_1.7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan/10 to-transparent" aria-hidden="true" />
      <div className="relative flex items-center gap-3">
        <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan">
          <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-lime" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-cyan">{label}</p>
          <p className="mt-1 text-[10px] text-slate-600">Kayıtlı ilerlemen korunuyor</p>
        </div>
        <span className="hidden font-display text-[8px] font-black uppercase tracking-[0.16em] text-slate-600 sm:block">Loading module</span>
      </div>
    </div>
  );
}

function HeroSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("panel relative overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/75 p-5 sm:p-7", compact ? "min-h-36" : "min-h-44")}>
      <SkeletonBlock className="h-2.5 w-36" />
      <SkeletonBlock className="mt-5 h-8 w-[min(72%,34rem)] sm:h-11" />
      <SkeletonBlock className="mt-4 h-3 w-[min(88%,42rem)]" />
      <SkeletonBlock className="mt-2 h-3 w-[min(66%,31rem)]" />
    </div>
  );
}

function PanelSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("panel relative overflow-hidden rounded-xl border border-white/[0.08] bg-panel/70 p-5", className)}>
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <SkeletonBlock
            key={index}
            className={cn("h-11", index === lines - 1 && "w-4/5")}
          />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => <SkeletonBlock key={index} className="h-32 rounded-xl" />)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <PanelSkeleton className="min-h-[340px]" lines={2} />
        <PanelSkeleton className="min-h-[340px]" lines={4} />
      </div>
    </>
  );
}

function MapSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel relative grid min-h-[480px] gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/65 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <SkeletonBlock key={index} className="min-h-32 rounded-xl" />)}
        </div>
        <div className="space-y-4"><PanelSkeleton lines={4} /><PanelSkeleton lines={2} /></div>
      </div>
    </>
  );
}

function VaultSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="h-28 rounded-xl" />)}
      </div>
      <SkeletonBlock className="mt-5 h-28 rounded-xl" />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => <PanelSkeleton key={index} className="min-h-64" lines={3} />)}
      </div>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <>
      <HeroSkeleton compact />
      <PanelSkeleton className="mt-5 min-h-[390px]" lines={5} />
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5"><PanelSkeleton lines={5} /><PanelSkeleton lines={2} /></div>
        <div className="space-y-5"><PanelSkeleton lines={5} /><PanelSkeleton lines={4} /></div>
      </div>
    </>
  );
}

function ScenarioSkeleton() {
  return (
    <>
      <div className="panel relative overflow-hidden rounded-xl border border-white/[0.08] bg-panel/70 p-4">
        <div className="flex items-center justify-between gap-4"><SkeletonBlock className="h-9 w-40" /><SkeletonBlock className="h-3 w-1/3" /><SkeletonBlock className="h-9 w-24" /></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <PanelSkeleton className="min-h-[430px]" lines={5} />
        <div className="panel relative overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/70 p-5 sm:p-7">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="mt-5 h-8 w-3/5" />
          <SkeletonBlock className="mt-6 h-24 w-full rounded-xl" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="h-16 rounded-xl" />)}</div>
        </div>
      </div>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="panel relative grid min-h-64 place-items-center overflow-hidden rounded-3xl border border-lime/15 bg-lime/[0.035] p-7 text-center">
        <div className="w-full max-w-xl"><SkeletonBlock className="mx-auto h-16 w-16 rounded-2xl" /><SkeletonBlock className="mx-auto mt-5 h-3 w-36" /><SkeletonBlock className="mx-auto mt-4 h-10 w-4/5" /></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="h-32 rounded-xl" />)}</div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><PanelSkeleton className="min-h-64" lines={4} /><PanelSkeleton className="min-h-64" lines={4} /></div>
    </>
  );
}

export function RouteLoading({ variant }: { variant: RouteLoadingVariant }) {
  return (
    <div className="app-frame py-6 sm:py-8" role="status" aria-live="polite" aria-busy="true">
      <LoadingBanner label={routeCopy[variant]} />
      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "map" ? <MapSkeleton /> : null}
      {variant === "vault" ? <VaultSkeleton /> : null}
      {variant === "settings" ? <SettingsSkeleton /> : null}
      {variant === "scenario" ? <ScenarioSkeleton /> : null}
      {variant === "results" ? <ResultsSkeleton /> : null}
      <span className="sr-only">{routeCopy[variant]}. Lütfen bekleyin.</span>
    </div>
  );
}

export function FullPageLoading() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-arcade-grid bg-[size:54px_54px] opacity-[0.12]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/[0.07] blur-3xl" aria-hidden="true" />
      <div className="relative">
        <ArcadeLoader label="Vardiya hazırlanıyor" detail="Kampüs modülleri güvenli şekilde bağlanıyor." />
        <div className="mt-7 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600" aria-hidden="true"><Sparkles className="h-3.5 w-3.5 text-lime/60" /> ShiftQuest system link</div>
      </div>
    </main>
  );
}
