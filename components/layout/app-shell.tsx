"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CircleHelp, Coins, Map, Settings, ShieldCheck, Vault, Zap } from "lucide-react";
import { brand } from "@/config/brand";
import { useGameStore } from "@/features/game/store";
import { cn } from "@/components/ui/cn";
import { LinkPendingFeedback } from "@/components/layout/link-pending-feedback";
import { FirstRunTutorial, requestFirstRunTutorial } from "@/components/tutorial/first-run-tutorial";

const links = [
  { href: "/map", label: "Kariyer Haritası", short: "Harita", icon: Map },
  { href: "/dashboard", label: "Performans", short: "Analiz", icon: BarChart3 },
  { href: "/word-vault", label: "Word Vault", short: "Vault", icon: Vault },
  { href: "/settings", label: "Ayarlar", short: "Ayarlar", icon: Settings },
];

const titleLabels: Record<string, string> = {
  "engineering-intern": "Engineering Intern",
  "graduate-engineer": "Graduate Engineer",
  "junior-process-engineer": "Junior Process Engineer",
  "shift-engineer": "Shift Engineer",
  "production-engineer": "Production Engineer",
  "senior-engineer": "Senior Engineer",
  "team-leader": "Team Leader",
  "operations-manager": "Operations Manager",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useGameStore((state) => state.profile);
  const progress = useGameStore((state) => state.progress);

  const openTutorial = () => {
    if (pathname === "/map") requestFirstRunTutorial();
    else router.push("/map?tour=1");
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
        <div className="app-frame flex h-16 items-center gap-5 xl:h-[72px]">
          <Link href="/map" className="flex min-w-0 items-center gap-3" aria-label={`${brand.name} ana sayfa`}>
            <LinkPendingFeedback label="Kariyer haritası">
              <Image src="/shiftquest-mark.svg" alt="" width={36} height={36} className="h-9 w-9" priority />
              <div className="hidden sm:block">
                <p className="font-display text-sm font-black uppercase tracking-[0.12em] text-white">{brand.name}</p>
                <p className="text-[9px] uppercase tracking-[0.23em] text-cyan">{brand.subtitle}</p>
              </div>
            </LinkPendingFeedback>
          </Link>

          <nav data-tour="app-navigation" className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Ana menü">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} aria-label={label} data-tour={href === "/settings" ? "settings-link" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition", active ? "bg-cyan/12 text-cyan" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                  <LinkPendingFeedback label={label}><Icon className="h-4 w-4" />{label}</LinkPendingFeedback>
                </Link>
              );
            })}
          </nav>

          <div data-tour="hud-rewards" className="ml-auto flex items-center gap-2 sm:gap-3">
            <button type="button" data-tour="tutorial-help" onClick={openTutorial} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-cyan/30 hover:bg-cyan/10 hover:text-cyan" aria-label="Hızlı başlangıç turunu aç" title="Hızlı başlangıç rehberi">
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 md:flex">
              <ShieldCheck className="h-4 w-4 text-cyan" />
              <span className="max-w-36 truncate text-[11px] font-semibold text-slate-300">{titleLabels[progress.currentTitleId] ?? "Engineering Intern"}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-lime/20 bg-lime/10 px-2.5 py-2 font-display text-[11px] font-bold text-lime"><Zap className="h-3.5 w-3.5" />{progress.totalXp.toLocaleString("tr-TR")}</div>
            <div className="flex items-center gap-1.5 rounded-lg border border-amber/20 bg-amber/10 px-2.5 py-2 font-display text-[11px] font-bold text-amber"><Coins className="h-3.5 w-3.5" />{progress.coins}</div>
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-cyan/25 bg-cyan/10 text-lg" title={profile?.displayName}>{profile?.avatarId?.replace("avatar-", "") === "2" ? "🧑🏽‍🔬" : profile?.avatarId?.replace("avatar-", "") === "3" ? "👩🏻‍💼" : "👷‍♀️"}</div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <nav data-tour="app-navigation" className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-2xl border border-white/10 bg-[#0a1822]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Mobil menü">
        {links.map(({ href, label, short, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-label={label} data-tour={href === "/settings" ? "settings-link" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition", active ? "bg-cyan/12 text-cyan" : "text-slate-500")}>
              <LinkPendingFeedback label={label}><Icon className="h-4 w-4" />{short}</LinkPendingFeedback>
            </Link>
          );
        })}
      </nav>
      <FirstRunTutorial />
    </div>
  );
}
