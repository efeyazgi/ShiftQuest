"use client";

import type { ChangeEvent, ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accessibility,
  AlertTriangle,
  Check,
  ChevronRight,
  CircleHelp,
  Contrast,
  Download,
  Gauge,
  Headphones,
  Languages,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ProviderStudio } from "@/components/settings/provider-studio";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Panel } from "@/components/ui/panel";
import { GAME_TITLE_DISCLAIMER } from "@/data/career";
import { exportGameData, useGameStore } from "@/features/game/store";
import { useCloudSync } from "@/features/sync/cloud-sync-provider";
import type { AccentPreference, CEFRLevel } from "@/types";

type DailyGoal = 5 | 10 | 15 | 20;
type ToggleIcon = ComponentType<{ className?: string }>;

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  accent = "cyan",
}: {
  icon: ToggleIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accent?: "cyan" | "lime" | "amber" | "coral";
}) {
  const colors = {
    cyan: "border-cyan/25 bg-cyan/10 text-cyan",
    lime: "border-lime/25 bg-lime/10 text-lime",
    amber: "border-amber/25 bg-amber/10 text-amber",
    coral: "border-coral/25 bg-coral/10 text-coral",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.12] bg-black/10 p-3.5 sm:p-4">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${checked ? colors[accent] : "border-white/10 bg-white/[0.025] text-slate-600"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition ${checked ? "border-cyan/50 bg-cyan/25" : "border-white/15 bg-black/25"}`}
      >
        <span className={`absolute left-0 top-1 h-5 w-5 rounded-full transition-transform ${checked ? "translate-x-6 bg-cyan shadow-[0_0_12px_rgba(85,246,255,.6)]" : "translate-x-1 bg-slate-600"}`} />
      </button>
    </div>
  );
}

function SegmentedChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; detail?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-500">{label}</legend>
      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <label key={option.value} className={`relative cursor-pointer rounded-xl border p-3 text-center transition ${active ? "border-cyan/45 bg-cyan/[0.09]" : "border-white/10 bg-black/10 hover:border-white/20"}`}>
              <input type="radio" className="sr-only" checked={active} onChange={() => onChange(option.value)} name={label} value={option.value} />
              <span className={`block font-display text-xs font-black uppercase ${active ? "text-cyan" : "text-slate-300"}`}>{option.label}</span>
              {option.detail ? <span className="mt-1 block text-[9px] text-slate-600">{option.detail}</span> : null}
              {active ? <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-cyan text-ink"><Check className="h-2.5 w-2.5" /></span> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function SettingsPage() {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);
  const settings = useGameStore((state) => state.settings);
  const updateProfile = useGameStore((state) => state.updateProfile);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const updateAudioSettings = useGameStore((state) => state.updateAudioSettings);
  const updateAccessibility = useGameStore((state) => state.updateAccessibility);
  const importData = useGameStore((state) => state.importData);
  const resetAll = useGameStore((state) => state.resetAll);
  const { status: cloudStatus } = useCloudSync();
  const cloudLoading = cloudStatus === "loading" || cloudStatus === "idle";

  const [displayName, setDisplayName] = useState("");
  const [level, setLevel] = useState<CEFRLevel>("B1");
  const [accent, setAccent] = useState<AccentPreference>("american");
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(10);
  const [profileNotice, setProfileNotice] = useState("");
  const [dataNotice, setDataNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated && !cloudLoading && !profile?.onboardingComplete) router.replace("/onboarding");
  }, [cloudLoading, hydrated, profile, router]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setLevel(profile.level);
    setAccent(profile.accent);
    setDailyGoal(profile.dailyGoalMinutes);
  }, [profile]);

  const saveProfile = () => {
    const cleanName = displayName.trim();
    if (cleanName.length < 2) {
      setProfileNotice("Görünen ad en az 2 karakter olmalı.");
      return;
    }
    updateProfile({ displayName: cleanName, level, accent, dailyGoalMinutes: dailyGoal });
    setProfileNotice("Profil kaydedildi; bulut senkronizasyonuna alındı.");
  };

  const exportProgress = () => {
    const payload = exportGameData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `shiftquest-save-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDataNotice({ tone: "success", text: "İlerleme verisi JSON olarak dışa aktarıldı." });
  };

  const importProgress = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5_000_000) {
      setDataNotice({ tone: "error", text: "Dosya çok büyük. ShiftQuest kayıtları 5 MB altında olmalı." });
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const valid = isRecord(parsed)
        && (parsed.profile === null || isRecord(parsed.profile))
        && isRecord(parsed.settings)
        && isRecord(parsed.progress)
        && Array.isArray(parsed.attempts)
        && Array.isArray(parsed.activities)
        && isRecord(parsed.settings.audio)
        && isRecord(parsed.settings.accessibility)
        && isRecord(parsed.progress.vocabularyProgress)
        && isRecord(parsed.progress.scenarioProgress)
        && isRecord(parsed.progress.dailyMinutes);
      if (!valid) throw new Error("invalid-shape");
      const imported = importData(parsed as Parameters<typeof importData>[0]);
      if (!imported) throw new Error("rejected");
      setDataNotice({ tone: "success", text: "Kayıt içe aktarıldı. Dashboard ve Word Vault güncellendi." });
    } catch {
      setDataNotice({ tone: "error", text: "Bu dosya geçerli bir ShiftQuest JSON kaydı değil." });
    }
  };

  const resetProgress = () => {
    const confirmed = window.confirm("Tüm profil, XP, kelime ve görev geçmişi kalıcı olarak silinsin mi? Bu işlem geri alınamaz.");
    if (!confirmed) return;
    resetAll();
    router.replace("/onboarding");
  };

  if (!hydrated || cloudLoading || !profile?.onboardingComplete) {
    return <LoadingScreen label={hydrated && !cloudLoading ? "Profil yönlendiriliyor" : "Bulut ilerlemesi yükleniyor"} />;
  }

  return (
    <AppShell>
      <div className="app-frame max-w-[1500px] py-7 sm:py-10">
        <section className="relative overflow-hidden rounded-2xl border border-cyan/20 bg-[#0a1822]/90 p-5 shadow-neon sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan/[0.08] blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan"><span className="h-1.5 w-1.5 rounded-full bg-lime" /> Player control room</div>
              <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-6xl">Settings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Öğrenme rotanı, ses kanalını, erişilebilirliği ve bulut kayıtlarını tek terminalden yönet.</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan"><UserRound className="h-5 w-5" /></div>
              <div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Cloud player</p><p className="mt-1 text-sm font-bold text-white">{profile.displayName}</p></div>
              <span className="ml-2 h-2 w-2 rounded-full bg-lime shadow-[0_0_10px_rgba(199,255,74,.7)]" title="Bulut senkronizasyonu etkin" />
            </div>
          </div>
        </section>

        <Panel className="mt-5" label="QUICK START / GUIDED TOUR" accent="lime">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime"><CircleHelp className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-base font-black uppercase text-white">ShiftQuest nasıl çalışır?</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">Kariyer haritası, görev başlatma, XP ve coin sistemi, Performans, Word Vault, AI ve ses ayarlarını kısa turla yeniden keşfet.</p>
              </div>
            </div>
            <Button onClick={() => router.push("/map?tour=1")} className="shrink-0">Rehberi yeniden aç <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </Panel>

        <ProviderStudio />

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
          <div className="space-y-5">
            <Panel label="PLAYER PROFILE" accent="lime">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime"><Gauge className="h-5 w-5" /></div>
                <div><h2 className="font-display text-lg font-black uppercase text-white">Learning route</h2><p className="text-xs text-slate-500">Değişiklikler sonraki görevlere uygulanır.</p></div>
              </div>

              <div className="mt-6">
                <label htmlFor="display-name" className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-500">Display name</label>
                <input id="display-name" value={displayName} maxLength={24} onChange={(event) => { setDisplayName(event.target.value); setProfileNotice(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm font-bold text-white outline-none transition focus:border-cyan/50" />
              </div>

              <div className="mt-5">
                <SegmentedChoice label="English level" value={level} onChange={setLevel} options={[{ value: "B1", label: "B1", detail: "More support" }, { value: "B2", label: "B2", detail: "More nuance" }]} />
              </div>
              <div className="mt-5">
                <SegmentedChoice label="Preferred accent" value={accent} onChange={setAccent} options={[{ value: "american", label: "American", detail: "en-US voice" }, { value: "british", label: "British", detail: "en-GB voice" }]} />
              </div>
              <div className="mt-5">
                <SegmentedChoice label="Daily goal" value={String(dailyGoal) as "5" | "10" | "15" | "20"} onChange={(value) => setDailyGoal(Number(value) as DailyGoal)} options={([5, 10, 15, 20] as const).map((minutes) => ({ value: String(minutes) as "5" | "10" | "15" | "20", label: `${minutes} min` }))} />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={`text-xs ${profileNotice.includes("saved") ? "text-lime" : "text-coral"}`} role="status">{profileNotice}</p>
                <Button onClick={saveProfile} className="sm:ml-auto"><Save className="h-4 w-4" /> Profili kaydet</Button>
              </div>
            </div>
            </Panel>

            <Panel label="THEME CHANNEL" accent="cyan">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/25 bg-cyan/10 text-cyan"><Palette className="h-5 w-5" /></div>
                <div><h2 className="font-display text-lg font-black uppercase text-white">Interface theme</h2><p className="text-xs text-slate-500">Otomatik kaydedilir ve tüm sayfalara uygulanır.</p></div>
              </div>
              <fieldset className="mt-6 grid gap-3 sm:grid-cols-3">
                <legend className="sr-only">Tema seçimi</legend>
                {([
                  { value: "dark", label: "Dark", detail: "Arcade default", icon: Moon },
                  { value: "light", label: "Light", detail: "Bright controls", icon: Sun },
                  { value: "system", label: "System", detail: "Follow device", icon: Monitor },
                ] as const).map((option) => {
                  const Icon = option.icon;
                  const active = settings.theme === option.value;
                  return (
                    <label key={option.value} className={`relative cursor-pointer rounded-xl border p-4 transition ${active ? "border-cyan/45 bg-cyan/[0.09]" : "border-white/10 bg-black/10 hover:border-white/20"}`}>
                      <input type="radio" className="sr-only" name="theme" value={option.value} checked={active} onChange={() => updateSettings({ theme: option.value })} />
                      <Icon className={`h-5 w-5 ${active ? "text-cyan" : "text-slate-500"}`} />
                      <p className="mt-4 font-display text-xs font-black uppercase text-white">{option.label}</p>
                      <p className="mt-1 text-[10px] text-slate-600">{option.detail}</p>
                      {active ? <Check className="absolute right-3 top-3 h-4 w-4 text-cyan" /> : null}
                    </label>
                  );
                })}
              </fieldset>
              <div className="mt-5 rounded-xl border border-white/[0.12] bg-black/10 p-4 text-xs leading-5 text-slate-500">
                <span className="font-bold text-slate-300">Theme signal:</span> {settings.theme === "system" ? "ShiftQuest follows the operating system preference." : `${settings.theme[0]!.toUpperCase()}${settings.theme.slice(1)} mode is selected.`}
              </div>
            </div>
            </Panel>
          </div>

          <div className="space-y-5">
            <Panel label="AUDIO MIXER" accent="amber">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber/25 bg-amber/10 text-amber"><SlidersHorizontal className="h-5 w-5" /></div>
                <div><h2 className="font-display text-lg font-black uppercase text-white">Sound channels</h2><p className="text-xs text-slate-500">Her kanal bağımsızdır ve otomatik kaydedilir.</p></div>
              </div>
              <div className="mt-6 space-y-2.5">
                <ToggleRow icon={Zap} label="Sound effects" description="Correct, retry, XP and mission cues." checked={settings.audio.soundEffects} onChange={(soundEffects) => updateAudioSettings({ soundEffects })} accent="lime" />
                <ToggleRow icon={Headphones} label="Narration" description="Dialogue and Word Vault pronunciation." checked={settings.audio.narration} onChange={(narration) => updateAudioSettings({ narration })} />
              </div>

              <div className="mt-5 rounded-xl border border-white/[0.12] bg-black/10 p-4">
                <label htmlFor="volume" className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500"><span className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-cyan" /> Master volume</span><span className="text-cyan">{Math.round(settings.audio.volume * 100)}%</span></label>
                <input id="volume" type="range" min="0" max="1" step="0.05" value={settings.audio.volume} onChange={(event) => updateAudioSettings({ volume: Number(event.target.value) })} className="mt-3 w-full accent-cyan" />
              </div>

              <fieldset className="mt-5">
                <legend className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Narration speed</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([0.75, 1, 1.25] as const).map((rate) => (
                    <label key={rate} className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center font-display text-[10px] font-black transition ${settings.audio.speechRate === rate ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-white/10 bg-black/10 text-slate-500"}`}>
                      <input type="radio" className="sr-only" name="speech-rate" checked={settings.audio.speechRate === rate} onChange={() => updateAudioSettings({ speechRate: rate })} />{rate}x
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            </Panel>

            <Panel label="ACCESSIBILITY" accent="lime">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime"><Accessibility className="h-5 w-5" /></div>
                <div><h2 className="font-display text-lg font-black uppercase text-white">Motion & contrast</h2><p className="text-xs text-slate-500">Tercihler bağımsızdır ve otomatik kaydedilir.</p></div>
              </div>
              <div className="mt-6 space-y-2.5">
                <ToggleRow icon={Sparkles} label="Arcade animations" description="Card entrances, progress movement and reward effects." checked={settings.accessibility.animations} onChange={(animations) => updateAccessibility({ animations })} accent="lime" />
                <ToggleRow icon={VolumeX} label="Reduced motion" description="Asks animated surfaces to use calmer transitions." checked={settings.accessibility.reducedMotion} onChange={(reducedMotion) => updateAccessibility({ reducedMotion })} accent="amber" />
                <ToggleRow icon={Contrast} label="High contrast" description="Strengthens control borders and status separation." checked={settings.accessibility.highContrast} onChange={(highContrast) => updateAccessibility({ highContrast })} />
              </div>
              <div className="mt-5 flex gap-3 rounded-xl border border-cyan/15 bg-cyan/[0.045] p-4 text-xs leading-5 text-slate-400">
                <Accessibility className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /> İşletim sistemindeki <code className="text-slate-300">prefers-reduced-motion</code> tercihi her zaman ayrıca desteklenir.
              </div>
            </div>
            </Panel>
          </div>
        </div>

        <Panel className="mt-5" label="SAVE DATA / PRIVACY" accent="cyan">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.75fr)]">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/25 bg-cyan/10 text-cyan"><ShieldCheck className="h-5 w-5" /></div>
                <div><h2 className="font-display text-lg font-black uppercase text-white">Cloud save control</h2><p className="text-xs text-slate-500">Profil ve öğrenme verileri hesabına senkronize edilir; bu tarayıcı çevrimdışı önbellek tutar.</p></div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={exportProgress} className="group flex min-h-20 items-center gap-4 rounded-xl border border-lime/20 bg-lime/[0.045] p-4 text-left transition hover:bg-lime/[0.08]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-lime/25 bg-lime/10 text-lime"><Download className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">Export JSON</span><span className="mt-1 block text-[10px] text-slate-500">Provider anahtarları hariç ilerleme yedeği</span></span>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-lime" />
                </button>
                <button type="button" onClick={() => importInputRef.current?.click()} className="group flex min-h-20 items-center gap-4 rounded-xl border border-cyan/20 bg-cyan/[0.045] p-4 text-left transition hover:bg-cyan/[0.08]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan"><Upload className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">Import JSON</span><span className="mt-1 block text-[10px] text-slate-500">Replace with a valid backup</span></span>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan" />
                </button>
                <input ref={importInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={importProgress} aria-label="ShiftQuest JSON kaydı içe aktar" />
              </div>
              {dataNotice ? <div className={`mt-4 rounded-lg border px-4 py-3 text-xs ${dataNotice.tone === "success" ? "border-lime/20 bg-lime/[0.05] text-lime" : "border-coral/25 bg-coral/[0.06] text-coral"}`} role="status">{dataNotice.text}</div> : null}
            </div>

            <div className="rounded-xl border border-coral/20 bg-coral/[0.04] p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
                <div><h3 className="font-display text-sm font-black uppercase text-white">Reset game data</h3><p className="mt-2 text-xs leading-5 text-slate-500">Profil, XP, coins, cevap geçmişi, görevler ve Word Vault silinir. Provider bağlantıları ayrı kasadadır; onları yukarıdaki Studio&apos;dan unutabilirsin.</p></div>
              </div>
              <Button variant="danger" className="mt-5 w-full" onClick={resetProgress}><RotateCcw className="h-4 w-4" /> Tüm ilerlemeyi sıfırla</Button>
            </div>
          </div>
        </Panel>

        <footer className="mt-5 flex flex-col gap-3 rounded-xl border border-white/[0.12] bg-black/10 p-4 text-[10px] leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2"><Languages className="h-4 w-4 shrink-0 text-cyan/60" /> ShiftQuest teaches professional English communication, not equipment operation.</span>
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0 text-amber/60" /> {GAME_TITLE_DISCLAIMER}</span>
        </footer>
      </div>
    </AppShell>
  );
}
