"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  AudioLines,
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronRight,
  Clock3,
  Gamepad2,
  Gauge,
  Languages,
  MessageSquareText,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { brand } from "@/config/brand";

import { BrandLockup } from "./brand-lockup";
import { CareerMapPreview } from "./career-map-preview";

const capabilities = [
  {
    number: "01",
    icon: MessageSquareText,
    title: "Play real conversations",
    copy: "Handle meetings, shift handovers and quality updates through short, branching workplace missions.",
    accent: "cyan",
    tag: "SCENARIO ARCADE",
  },
  {
    number: "02",
    icon: AudioLines,
    title: "Train your listening",
    copy: "Hear American or British English, control playback speed and learn the phrases people actually use at work.",
    accent: "lime",
    tag: "VOICE TRAINING",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "See what improves",
    copy: "Turn every answer into useful feedback, targeted reviews and a clear path to your next in-game title.",
    accent: "amber",
    tag: "SKILL TELEMETRY",
  },
] as const;

const missionFeed = [
  "SHIFT HANDOVER",
  "POLITE REQUESTS",
  "QUALITY UPDATE",
  "MEETING TACTICS",
  "SAFETY REPORT",
];

const b1Items = ["Shorter workplace dialogue", "Turkish hints when needed", "Guided professional phrases"];
const b2Items = ["Natural, nuanced dialogue", "Tone and formality choices", "Advanced roleplay missions"];

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  const reveal = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: reduceMotion ? 0 : 0.55 },
  };

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-white selection:bg-cyan selection:text-ink">
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] mix-blend-screen [background-image:url('/noise.svg')]" />

      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label={`${brand.name} home`}>
            <BrandLockup />
          </Link>
          <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 md:flex" aria-label="Main navigation">
            <a className="transition hover:text-cyan" href="#field-training">Field training</a>
            <a className="transition hover:text-cyan" href="#career-map">Career map</a>
            <a className="transition hover:text-cyan" href="#levels">B1 / B2</a>
          </nav>
          <Link
            href="/onboarding"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition hover:border-cyan/40 hover:bg-cyan/10 hover:text-cyan sm:px-5"
          >
            Enter arcade
            <ArrowDownRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="relative isolate min-h-[820px] overflow-hidden border-b border-white/10 pt-32 lg:min-h-[900px] lg:pt-40">
        <div className="absolute inset-0 -z-20 bg-arcade-grid bg-[size:52px_52px] opacity-20" />
        <div className="absolute -left-52 top-16 -z-10 size-[560px] rounded-full bg-cyan/[0.09] blur-[120px]" />
        <div className="absolute -right-40 bottom-0 -z-10 size-[500px] rounded-full bg-lime/[0.07] blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-[#09151d] to-transparent" />

        <div className="mx-auto grid max-w-7xl gap-16 px-5 pb-24 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6 }}
            className="relative z-10 max-w-2xl"
          >
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan/20 bg-cyan/[0.07] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-cyan" />
              </span>
              Training sector online
            </div>

            <h1 className="font-display text-[clamp(3.2rem,8.6vw,7.4rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
              Clock in.
              <span className="mt-3 block text-cyan [text-shadow:0_0_45px_rgba(85,246,255,0.23)]">Speak up.</span>
              <span className="mt-3 block">Level up.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
              Turn workplace English into your next career adventure. Train with realistic engineering conversations, quick arcade missions and feedback that remembers where you need practice.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboarding"
                className="group relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-xl bg-lime px-7 font-display text-xs font-black uppercase tracking-[0.14em] text-ink shadow-[0_0_35px_rgba(199,255,74,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_0_45px_rgba(199,255,74,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
              >
                <span className="absolute inset-y-0 -left-16 w-12 -skew-x-12 bg-white/35 blur transition-all duration-500 group-hover:left-[110%]" />
                Start your shift
                <Play className="size-4 fill-current" aria-hidden="true" />
              </Link>
              <a
                href="#career-map"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-xs font-bold text-white/75 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
              >
                Explore the campus
                <ArrowDownRight className="size-4" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              <span className="flex items-center gap-2"><Clock3 className="size-3.5 text-cyan" /> 5–10 min missions</span>
              <span className="flex items-center gap-2"><Languages className="size-3.5 text-cyan" /> Built for B1 + B2</span>
              <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-cyan" /> No penalty learning</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reduceMotion ? 0 : 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.15 }}
            className="relative mx-auto w-full max-w-[620px] lg:ml-auto"
          >
            <div className="absolute -inset-12 -z-10 rounded-full bg-cyan/[0.08] blur-3xl" />
            <div className="relative rotate-[1.2deg] overflow-hidden rounded-[2rem] border border-white/15 bg-[#0b1923]/95 p-2 shadow-[0_45px_120px_rgba(0,0,0,0.6)] backdrop-blur">
              <div className="rounded-[1.55rem] border border-white/10 bg-[#07131c]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-coral" />
                    <span className="size-2 rounded-full bg-amber" />
                    <span className="size-2 rounded-full bg-lime" />
                  </div>
                  <span className="font-display text-[9px] font-black uppercase tracking-[0.18em] text-white/35">SQ / Mission terminal</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-lime"><Radio className="size-3" /> Live</span>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-[0.35fr_0.65fr] sm:p-5">
                  <div className="relative min-h-64 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_25%,rgba(85,246,255,0.22),transparent_30%),linear-gradient(155deg,#0c2230,#071019)] sm:min-h-[380px]">
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-[8px] font-black uppercase tracking-[0.18em] text-cyan/60">
                      <span>NPC 04</span><span>CONNECTED</span>
                    </div>
                    <div className="absolute left-1/2 top-[28%] size-28 -translate-x-1/2 rounded-[42%_42%_38%_38%] border border-cyan/25 bg-cyan/10 shadow-[0_0_45px_rgba(85,246,255,0.15)]">
                      <div className="absolute left-7 top-8 size-2 rounded-full bg-cyan shadow-[58px_0_0_0_#55f6ff]" />
                      <div className="absolute bottom-7 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-cyan/35" />
                    </div>
                    <div className="absolute bottom-0 left-1/2 h-[45%] w-[78%] -translate-x-1/2 rounded-t-[45%] border-x border-t border-cyan/20 bg-gradient-to-b from-cyan/15 to-cyan/[0.03]">
                      <div className="mx-auto mt-10 h-20 w-px bg-cyan/20" />
                    </div>
                    <div className="absolute inset-x-3 bottom-3 rounded-xl border border-cyan/20 bg-ink/80 px-3 py-2.5 backdrop-blur">
                      <p className="font-display text-[10px] font-black uppercase text-white">Lena Park</p>
                      <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-cyan/60">Shift supervisor</p>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber">Mission 03</p>
                        <h2 className="mt-1.5 font-display text-sm font-black uppercase tracking-[0.04em]">The morning handover</h2>
                      </div>
                      <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 font-display text-[9px] font-black text-white/55">+100 XP</span>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[42%] rounded-full bg-gradient-to-r from-cyan to-lime" /></div>
                    <div className="mt-6 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-white/80">
                      “The morning shift was completed without any major issues. Do you have any questions before we begin?”
                      <button type="button" aria-label="Preview mission audio" className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan transition hover:text-white">
                        <Volume2 className="size-3.5" /> Play dialogue
                      </button>
                    </div>
                    <p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Choose a professional reply</p>
                    <div className="mt-2.5 space-y-2">
                      <div className="rounded-xl border border-cyan/35 bg-cyan/10 p-3 text-xs leading-5 text-white shadow-[0_0_20px_rgba(85,246,255,0.08)]"><span className="mr-2 font-display text-[9px] text-cyan">A</span> Could you confirm the equipment status?</div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-white/45"><span className="mr-2 font-display text-[9px]">B</span> Equipment status now.</div>
                    </div>
                    <div className="mt-auto pt-5">
                      <div className="flex items-center justify-between rounded-xl bg-lime px-4 py-3 font-display text-[10px] font-black uppercase tracking-[0.12em] text-ink">
                        Lock answer <ChevronRight className="size-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-3 rounded-2xl border border-lime/30 bg-[#0d1c21] px-4 py-3 shadow-2xl sm:-left-10"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-lime/10 text-lime"><Zap className="size-4 fill-current" /></span>
                <span><span className="block font-display text-[10px] font-black uppercase">Combo x4</span><span className="mt-0.5 block text-[9px] font-bold uppercase tracking-widest text-lime">Fluent streak</span></span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-12 items-center overflow-hidden border-t border-white/10 bg-[#0a171f] text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
          <motion.div
            className="flex min-w-max items-center"
            animate={reduceMotion ? undefined : { x: [0, -520] }}
            transition={{ duration: 18, ease: "linear", repeat: Infinity }}
          >
            {[...missionFeed, ...missionFeed, ...missionFeed].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-5 px-7"><Sparkles className="size-3 text-cyan/50" /> {item}</span>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="field-training" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan">SYS / Field training system</p>
            <h2 className="mt-5 max-w-xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.045em] sm:text-6xl">Built for the language between the manuals.</h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/50 lg:ml-auto">The difficult part of a first engineering role is often not the terminology—it is asking clearly, sounding professional and responding under pressure. ShiftQuest trains that layer.</p>
        </motion.div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {capabilities.map((feature, index) => {
            const Icon = feature.icon;
            const color = feature.accent === "cyan" ? "text-cyan border-cyan/25 bg-cyan/10" : feature.accent === "lime" ? "text-lime border-lime/25 bg-lime/10" : "text-amber border-amber/25 bg-amber/10";
            return (
              <motion.article
                key={feature.title}
                {...reveal}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : index * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.045] sm:p-8"
              >
                <span className="absolute right-5 top-3 font-display text-7xl font-black tracking-[-0.08em] text-white/[0.025]">{feature.number}</span>
                <span className={`grid size-12 place-items-center rounded-2xl border ${color}`}><Icon className="size-5" /></span>
                <p className={`mt-8 text-[9px] font-black uppercase tracking-[0.2em] ${feature.accent === "cyan" ? "text-cyan" : feature.accent === "lime" ? "text-lime" : "text-amber"}`}>{feature.tag}</p>
                <h3 className="mt-3 font-display text-xl font-black uppercase tracking-[-0.02em]">{feature.title}</h3>
                <p className="mt-4 text-sm leading-6 text-white/50">{feature.copy}</p>
                <ArrowDownRight className="mt-8 size-5 text-white/20 transition group-hover:translate-x-1 group-hover:translate-y-1 group-hover:text-white/60" />
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="career-map" className="relative border-y border-white/10 bg-[#091720] py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('/pipeline-pattern.svg')] opacity-[0.055]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div {...reveal} className="mb-12 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime">MAP / Your career is the campaign</p>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.045em] sm:text-6xl">One campus. A new challenge in every zone.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/50">Earn XP, open regions and rise from Engineering Intern to Operations Manager—strictly as an in-game progression path.</p>
          </motion.div>
          <motion.div {...reveal}><CareerMapPreview /></motion.div>
        </div>
      </section>

      <section id="levels" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <motion.div {...reveal}>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber">LVL / Calibrated difficulty</p>
            <h2 className="mt-5 font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.045em] sm:text-6xl">Your level changes the mission.</h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/50">B1 is supported and direct. B2 adds ambiguity, natural phrasing and sharper tone choices. Neither path turns workplace English into a textbook.</p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/50"><Gauge className="size-4 text-amber" /> Difficulty adapts to performance</div>
          </motion.div>

          <motion.div {...reveal} className="grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-cyan/25 bg-cyan/[0.055] p-6 sm:p-8">
              <span className="absolute -right-4 -top-9 font-display text-[9rem] font-black text-cyan/[0.04]">1</span>
              <div className="flex items-center justify-between"><span className="font-display text-3xl font-black text-cyan">B1</span><span className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-cyan">Guided route</span></div>
              <p className="mt-4 text-sm leading-6 text-white/50">Build confidence in everyday workplace situations.</p>
              <ul className="mt-7 space-y-4">{b1Items.map((item) => <li key={item} className="flex items-center gap-3 text-sm text-white/75"><span className="grid size-5 place-items-center rounded-full bg-cyan/10 text-cyan"><Check className="size-3" /></span>{item}</li>)}</ul>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-lime/25 bg-lime/[0.05] p-6 sm:p-8 sm:translate-y-8">
              <span className="absolute -right-4 -top-9 font-display text-[9rem] font-black text-lime/[0.035]">2</span>
              <div className="flex items-center justify-between"><span className="font-display text-3xl font-black text-lime">B2</span><span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-lime">Challenge route</span></div>
              <p className="mt-4 text-sm leading-6 text-white/50">Sound natural when conversations become less predictable.</p>
              <ul className="mt-7 space-y-4">{b2Items.map((item) => <li key={item} className="flex items-center gap-3 text-sm text-white/75"><span className="grid size-5 place-items-center rounded-full bg-lime/10 text-lime"><Check className="size-3" /></span>{item}</li>)}</ul>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
          {[
            ["12", "Playable missions"],
            ["100+", "Workplace phrases"],
            ["8", "Campus regions"],
            ["0", "XP lost on mistakes"],
          ].map(([value, label]) => (
            <div key={label} className="border-b border-white/10 px-3 py-9 text-center last:border-b-0 lg:border-b-0">
              <p className="font-display text-3xl font-black text-white sm:text-4xl">{value}</p>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
        <div className="absolute left-1/2 top-1/2 -z-10 h-72 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/[0.08] blur-[100px]" />
        <motion.div {...reveal} className="mx-auto max-w-4xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-lime/30 bg-lime/10 text-lime shadow-lime"><Gamepad2 className="size-6" /></span>
          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.24em] text-lime">Your next shift starts here</p>
          <h2 className="mt-5 font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] sm:text-7xl">Ready to make English part of the job?</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/50">Set your level, choose your career route and launch your first mission. No account or API key required.</p>
          <Link href="/onboarding" className="group mt-9 inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-lime px-8 font-display text-xs font-black uppercase tracking-[0.14em] text-ink shadow-[0_0_35px_rgba(199,255,74,0.2)] transition hover:-translate-y-1 hover:shadow-[0_0_45px_rgba(199,255,74,0.32)]">
            Start your shift <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <BrandLockup />
          <div className="flex items-center gap-5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
            <span className="flex items-center gap-2"><BookOpenCheck className="size-3.5" /> Learn by doing</span>
            <span className="flex items-center gap-2"><Sparkles className="size-3.5" /> Built for engineers</span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/25">© {new Date().getFullYear()} {brand.name}</p>
        </div>
      </footer>
    </main>
  );
}
