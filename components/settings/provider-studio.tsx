"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  PlugZap,
  Radio,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  Waves,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { type SpeechLanguage, useTTS } from "@/features/audio/use-tts";
import { useGameStore } from "@/features/game/store";
import {
  getRuntimeLLMConfig,
  providerSettingsAreComplete,
  type RuntimeLLMProvider,
  type RuntimeTTSProvider,
  useProviderSettingsStore,
} from "@/features/providers/store";
import {
  GOOGLE_GEMINI_NATIVE_BASE_URL,
  GOOGLE_GEMINI_TEXT_MODEL,
  GOOGLE_GEMINI_TTS_MODEL,
} from "@/lib/providers/google-gemini";

type TestState = {
  tone: "idle" | "loading" | "success" | "warning" | "error";
  message: string;
};

const idleTest: TestState = { tone: "idle", message: "Henüz bağlantı testi yapılmadı." };

const GOOGLE_AI_STUDIO_KEY_URL = "https://aistudio.google.com/apikey";

const googleVoiceOptions = [
  ["Achird", "Friendly"],
  ["Iapetus", "Clear"],
  ["Kore", "Firm"],
  ["Aoede", "Breezy"],
  ["Puck", "Upbeat"],
  ["Sulafat", "Warm"],
  ["Gacrux", "Mature"],
  ["Vindemiatrix", "Gentle"],
] as const;

function statusClasses(tone: TestState["tone"]) {
  if (tone === "success") return "border-lime/25 bg-lime/[0.06] text-lime";
  if (tone === "warning") return "border-amber/25 bg-amber/[0.06] text-amber";
  if (tone === "error") return "border-coral/25 bg-coral/[0.06] text-coral";
  if (tone === "loading") return "border-cyan/25 bg-cyan/[0.06] text-cyan";
  return "border-white/10 bg-black/10 text-slate-500";
}

function ServiceStatus({ state }: { state: TestState }) {
  return (
    <div className={`flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-2 text-[11px] leading-4 ${statusClasses(state.tone)}`} role="status">
      {state.tone === "loading" ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : state.tone === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : state.tone === "warning" || state.tone === "error" ? <CircleAlert className="h-4 w-4 shrink-0" /> : <Radio className="h-4 w-4 shrink-0" />}
      <span>{state.message}</span>
    </div>
  );
}

function ProviderMode<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; title: string; detail: string; icon: typeof Bot }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-500">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const active = option.value === value;
          const Icon = option.icon;
          return (
            <label key={option.value} className={`relative flex cursor-pointer gap-3 rounded-xl border p-3.5 transition ${active ? "border-cyan/45 bg-cyan/[0.09]" : "border-white/10 bg-black/10 hover:border-white/20"}`}>
              <input className="sr-only" type="radio" name={label} checked={active} value={option.value} onChange={() => onChange(option.value)} />
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${active ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 bg-white/[0.025] text-slate-600"}`}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block text-xs font-bold text-white">{option.title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{option.detail}</span></span>
              {active ? <span className="absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full bg-cyan text-ink"><Check className="h-2.5 w-2.5" /></span> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#091722] px-3 text-xs text-slate-300 outline-none transition focus:border-cyan/50"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  autoComplete,
  trailing,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "url" | "password";
  disabled?: boolean;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</span>
      <span className="relative mt-2 block">
        <input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-lg border border-white/10 bg-black/15 px-3 pr-11 text-xs text-white outline-none transition placeholder:text-slate-700 focus:border-cyan/50 disabled:cursor-not-allowed disabled:opacity-45"
        />
        {trailing ? <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span> : null}
      </span>
    </label>
  );
}

function SecretField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete="new-password"
      placeholder={disabled ? "AI anahtarı paylaşılacak" : "sk-… veya sağlayıcı anahtarı"}
      trailing={
        <button type="button" disabled={disabled || !value} onClick={() => setVisible((current) => !current)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-30" aria-label={visible ? `${label} değerini gizle` : `${label} değerini göster`}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}

function sourceFromResponse(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const source = Reflect.get(value, "source");
  return source === "provider" || source === "mock" ? source : undefined;
}

function errorCodeFromResponse(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const error = Reflect.get(value, "error");
  if (!error || typeof error !== "object") return undefined;
  const code = Reflect.get(error, "code");
  return typeof code === "string" ? code : undefined;
}

function providerErrorMessage(code: string | undefined): string {
  if (code === "INVALID_API_KEY") {
    return "API anahtarı Google tarafından reddedildi. AI Studio'dan yeni bir Auth key oluşturup tekrar dene.";
  }
  if (code === "PERMISSION_DENIED") {
    return "Anahtarın Gemini API izni yok veya Google tarafından bloke edilmiş. AI Studio'da anahtar durumunu kontrol et.";
  }
  if (code === "REGION_OR_BILLING_REQUIRED") {
    return "Bu hesap veya bölgede ücretsiz katman kullanılamıyor; Google AI Studio'da billing/bölge durumunu kontrol et.";
  }
  if (code === "QUOTA_EXCEEDED") {
    return "Gemini kotası dolmuş. Kota yenilendiğinde tekrar dene veya diğer modeli seç.";
  }
  if (code === "MODEL_NOT_AVAILABLE") {
    return "Seçili Gemini modeli bu anahtar için açık değil. Diğer metin modelini seçip tekrar dene.";
  }
  if (code === "INVALID_PROVIDER_REQUEST") {
    return "Google isteği reddetti. Model ayarını yenilemek için Google hızlı kurulumunu tekrar çalıştır.";
  }
  if (code === "INVALID_PROVIDER_RESPONSE") {
    return "Google'a ulaşıldı ancak model doğrulanabilir bir test yanıtı üretmedi. Tekrar dene veya diğer modeli seç.";
  }
  if (code === "PROVIDER_TIMEOUT") {
    return "Gemini zamanında yanıt vermedi. Bağlantıyı kontrol edip birkaç saniye sonra tekrar dene.";
  }
  if (code === "PROVIDER_NETWORK_ERROR" || code === "PROVIDER_UNAVAILABLE") {
    return "Gemini servisine şu anda ulaşılamıyor. İnternet bağlantısını ve Google servis durumunu kontrol et.";
  }
  if (code === "RUNTIME_CONFIG_ORIGIN_REJECTED") {
    return "Güvenlik kontrolü isteği reddetti. ShiftQuest'i aynı localhost adresinden yenileyip tekrar dene.";
  }
  return "Bağlantı doğrulanamadı. Anahtarı, seçili modeli ve Google AI Studio anahtar durumunu kontrol et.";
}

export function ProviderStudio() {
  const hydrated = useProviderSettingsStore((state) => state.hydrated);
  const revision = useProviderSettingsStore((state) => state.revision);
  const llm = useProviderSettingsStore((state) => state.llm);
  const tts = useProviderSettingsStore((state) => state.tts);
  const updateLLM = useProviderSettingsStore((state) => state.updateLLM);
  const updateTTS = useProviderSettingsStore((state) => state.updateTTS);
  const clearLLM = useProviderSettingsStore((state) => state.clearLLM);
  const clearTTS = useProviderSettingsStore((state) => state.clearTTS);
  const clearAll = useProviderSettingsStore((state) => state.clearAll);
  const audioSettings = useGameStore((state) => state.settings.audio);
  const audioTest = useTTS();

  const [aiTest, setAiTest] = useState<TestState>(idleTest);
  const [voiceTestLanguage, setVoiceTestLanguage] = useState<SpeechLanguage>("en-US");
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => setBrowserVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const sortedBrowserVoices = useMemo(() => [...browserVoices].sort((left, right) => {
    const priority = (voice: SpeechSynthesisVoice) => /^(en|tr)(-|_)/i.test(voice.lang) ? 0 : 1;
    return priority(left) - priority(right) || left.lang.localeCompare(right.lang) || left.name.localeCompare(right.name);
  }), [browserVoices]);

  const llmComplete = llm.provider === "mock" || providerSettingsAreComplete("llm");
  const ttsComplete = tts.provider === "browser" || providerSettingsAreComplete("tts");
  const canShareAIKey = llm.provider !== "mock" && llm.provider === tts.provider;
  const sharedKeyMismatch = tts.provider !== "browser" && tts.useSharedAIKey && !canShareAIKey;
  const sharedKeyMissing = tts.provider !== "browser" && tts.useSharedAIKey && canShareAIKey && !llm.apiKey.trim();

  const startGoogleQuickSetup = () => {
    audioTest.stop();
    updateLLM({
      provider: "google-gemini",
      baseUrl: GOOGLE_GEMINI_NATIVE_BASE_URL,
      model: GOOGLE_GEMINI_TEXT_MODEL,
    });
    updateTTS({
      provider: "google-gemini",
      baseUrl: GOOGLE_GEMINI_NATIVE_BASE_URL,
      model: GOOGLE_GEMINI_TTS_MODEL,
      englishVoice: "Achird",
      turkishVoice: "Iapetus",
      useSharedAIKey: true,
    });
    setAiTest(idleTest);
    window.setTimeout(() => document.getElementById("llm-api-key")?.focus(), 0);
  };

  const changeLLMProvider = (provider: RuntimeLLMProvider) => {
    const preset = provider === "google-gemini"
      ? { provider, baseUrl: GOOGLE_GEMINI_NATIVE_BASE_URL, model: GOOGLE_GEMINI_TEXT_MODEL }
      : provider === "openai-compatible"
        ? { provider, baseUrl: "https://api.openai.com/v1", model: "" }
        : { provider };
    updateLLM(preset);
    if (tts.provider !== provider && tts.provider !== "browser") updateTTS({ useSharedAIKey: false });
    setAiTest(idleTest);
  };

  const changeTTSProvider = (provider: RuntimeTTSProvider) => {
    audioTest.stop();
    const preset = provider === "google-gemini"
      ? {
          provider,
          baseUrl: GOOGLE_GEMINI_NATIVE_BASE_URL,
          model: GOOGLE_GEMINI_TTS_MODEL,
          englishVoice: "Achird",
          turkishVoice: "Iapetus",
          useSharedAIKey: llm.provider === "google-gemini",
        }
      : provider === "openai-compatible"
        ? {
            provider,
            baseUrl: "https://api.openai.com/v1",
            model: "",
            englishVoice: "alloy",
            turkishVoice: "alloy",
            useSharedAIKey: llm.provider === "openai-compatible",
          }
        : { provider };
    updateTTS(preset);
  };

  const testAIConnection = async () => {
    if (llm.provider === "mock") {
      setAiTest({ tone: "success", message: "Yerleşik mock AI hazır; öğrenci metni harici servise gönderilmiyor." });
      return;
    }
    if (!llmComplete) {
      setAiTest({ tone: "error", message: "Önce API key, base URL ve model alanlarını tamamla." });
      return;
    }
    setAiTest({ tone: "loading", message: "Güvenli sunucu rotası üzerinden bağlantı deneniyor…" });
    try {
      const providerConfig = getRuntimeLLMConfig();
      if (!providerConfig) {
        setAiTest({ tone: "error", message: "Provider ayarları doğrulanamadı. Google hızlı kurulumunu tekrar çalıştır." });
        return;
      }
      const response = await fetch("/api/provider-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "llm",
          providerConfig,
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setAiTest({ tone: "error", message: providerErrorMessage(errorCodeFromResponse(result)) });
        return;
      }
      const source = sourceFromResponse(result);
      if (source === "provider") {
        setAiTest({ tone: "success", message: "Gemini görev motoru doğrulandı; roleplay ve geribildirim şeması başarıyla üretildi." });
      } else {
        setAiTest({ tone: "error", message: "Bağlantı testi beklenmeyen bir yanıt verdi; görevler güvenli mock modunda kalacak." });
      }
    } catch {
      setAiTest({ tone: "error", message: "ShiftQuest API rotasına ulaşılamadı. Yerel sunucuyu yenileyip tekrar dene." });
    }
  };

  const playVoiceTest = (language: SpeechLanguage) => {
    if (!ttsComplete) return;
    setVoiceTestLanguage(language);
    const text = language === "tr-TR"
      ? "ShiftQuest ses bağlantısı hazır. Bu bir Türkçe ses testidir."
      : "ShiftQuest voice link ready. I will keep you updated after the review.";
    void audioTest.play(text, language, audioSettings.speechRate, audioSettings.volume);
  };

  const forgetAll = () => {
    const confirmed = window.confirm("Yerel AI ve TTS anahtarlarıyla tüm provider alanları bu tarayıcıdan silinsin mi?");
    if (!confirmed) return;
    audioTest.stop();
    clearAll();
    setAiTest(idleTest);
  };

  const voiceStatus: TestState = audioTest.status === "loading"
    ? { tone: "loading", message: "Ses hazırlanıyor…" }
    : audioTest.status === "error"
      ? { tone: "error", message: "Ses oynatılamadı. Provider alanlarını veya cihaz seslerini kontrol et." }
      : audioTest.status === "playing" || audioTest.status === "paused"
        ? audioTest.isFallback
          ? { tone: "warning", message: `${voiceTestLanguage === "tr-TR" ? "Türkçe" : "İngilizce"} test tarayıcı fallback sesiyle oynuyor.` }
          : audioTest.source === "neural"
            ? { tone: "success", message: `${voiceTestLanguage === "tr-TR" ? "Türkçe" : "İngilizce"} neural ses sağlayıcıdan oynuyor.` }
            : { tone: "success", message: `${voiceTestLanguage === "tr-TR" ? "Türkçe" : "İngilizce"} seçili tarayıcı sesiyle oynuyor.` }
        : audioTest.isFallback
          ? { tone: "warning", message: "Son neural testte servis yanıt vermedi; tarayıcı sesi otomatik devraldı." }
          : audioTest.source === "neural"
            ? { tone: "success", message: "Son ses testi neural sağlayıcıdan başarıyla tamamlandı." }
            : audioTest.source === "browser"
              ? { tone: "success", message: "Son ses testi seçili tarayıcı sesiyle tamamlandı." }
              : { tone: "idle", message: tts.provider === "browser" ? "Tarayıcı sesi hazır; kalite cihazdaki kurulu seslere bağlıdır." : "Neural ses bağlantısını test et." };

  return (
    <Panel id="ai-voice-services" className="mt-5 scroll-mt-24" label="AI + VOICE PROVIDER STUDIO" accent="cyan">
      <div className="border-b border-white/10 bg-cyan/[0.025] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan/30 bg-cyan/10 text-cyan"><PlugZap className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-lg font-black uppercase text-white">Çalışma zamanı servisleri</h2>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">Anahtarsız devam edebilir veya Google Gemini&apos;yi tek anahtarla kurabilirsin. Harici servis bilgileri yalnız bu tarayıcıdaki ayrı provider kasasında tutulur.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-lg border px-3 py-2 font-display text-[9px] font-black uppercase tracking-[0.13em] ${hydrated ? "border-lime/20 bg-lime/[0.06] text-lime" : "border-amber/20 bg-amber/[0.06] text-amber"}`}>{hydrated ? `Auto-save · r${revision}` : "Provider kasası yükleniyor"}</span>
            <Button variant="danger" size="sm" onClick={forgetAll}><Trash2 className="h-3.5 w-3.5" /> Tüm bağlantıları unut</Button>
          </div>
        </div>
      </div>

      <section className="border-b border-white/[0.08] bg-[linear-gradient(110deg,rgba(85,246,255,.07),rgba(199,255,74,.035))] px-5 py-5 sm:px-6" aria-labelledby="google-quick-setup-title">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-lime/25 bg-lime/10 text-lime"><Sparkles className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="google-quick-setup-title" className="font-display text-sm font-black uppercase text-white">Google ile hızlı kurulum</h3>
                <span className="rounded-full border border-lime/20 bg-lime/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-lime">Önerilen · ücretsiz katman</span>
              </div>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">Google AI Studio&apos;dan bir Gemini anahtarı al, buraya yapıştır ve test et. ShiftQuest AI modeli, neural ses modeli, endpoint ve iki ses profilini senin için hazırlar.</p>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Ücretsiz katman limitsiz değildir; model kotası ve bölge uygunluğu Google hesabına göre değişebilir. Kota biterse oyun mock AI ve tarayıcı sesiyle açık kalır.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a href={GOOGLE_AI_STUDIO_KEY_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-[10px] font-bold text-slate-200 transition hover:border-cyan/35 hover:text-white">1. Ücretsiz anahtar al <ExternalLink className="h-3.5 w-3.5" /></a>
            <Button size="sm" onClick={startGoogleQuickSetup}><Sparkles className="h-3.5 w-3.5" /> 2. Google&apos;ı otomatik ayarla</Button>
          </div>
        </div>
      </section>

      <ol className="grid gap-2 border-b border-white/[0.08] bg-black/[0.08] px-5 py-4 text-[10px] leading-4 text-slate-400 sm:px-6 md:grid-cols-3" aria-label="Provider kurulum adımları">
        {[
          ["01", "Anahtarı al", "Google AI Studio bağlantısından ücretsiz katman anahtarını oluştur."],
          ["02", "Bir kez yapıştır", "Hızlı kurulumdan sonra Gemini anahtarını AI alanına ekle."],
          ["03", "İki kanalı test et", "Önce AI bağlantısını, sonra İngilizce ve Türkçe sesi dinle."],
        ].map(([number, title, detail]) => (
          <li key={number} className="flex gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <span className="font-display text-xs font-black text-cyan">{number}</span>
            <span><strong className="block text-[11px] text-slate-200">{title}</strong><span className="mt-0.5 block">{detail}</span></span>
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-5 p-5 sm:p-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.12] bg-black/10 p-4 sm:p-5" aria-labelledby="ai-provider-title">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-300"><BrainCircuit className="h-5 w-5" /></div>
              <div><h3 id="ai-provider-title" className="font-display text-base font-black uppercase text-white">AI görev motoru</h3><p className="mt-1 text-[10px] text-slate-500">Senaryo, roleplay ve yazılı geribildirim</p></div>
            </div>
            <span className={`rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${llmComplete ? "border-lime/20 bg-lime/10 text-lime" : "border-coral/20 bg-coral/10 text-coral"}`}>{llm.provider === "mock" ? "Mock ready" : llmComplete ? "Configured" : "Incomplete"}</span>
          </div>

          <div className="mt-5">
            <ProviderMode<RuntimeLLMProvider>
              label="AI çalışma modu"
              value={llm.provider}
              onChange={changeLLMProvider}
              options={[
                { value: "mock", title: "Yerleşik Mock", detail: "Anahtarsız, deterministik ve çevrimdışı dayanıklı.", icon: Bot },
                { value: "google-gemini", title: "Google Gemini", detail: "Ücretsiz katman için hazır model ve endpoint; önerilen başlangıç.", icon: Sparkles },
                { value: "openai-compatible", title: "OpenAI-compatible", detail: "İleri seviye: kendi modelini ve izinli endpoint'ini bağla.", icon: PlugZap },
              ]}
            />
          </div>

          {llm.provider === "google-gemini" ? (
            <div className="mt-5 space-y-4 rounded-xl border border-lime/20 bg-lime/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-xs font-bold text-white">Gemini hazır ayarı</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Endpoint otomatik ve kilitli; yalnız anahtarını eklemen yeterli.</p></div>
                <a href={GOOGLE_AI_STUDIO_KEY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan hover:text-white">Anahtar sayfasını aç <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
              <SecretField id="llm-api-key" label="Gemini API key" value={llm.apiKey} onChange={(apiKey) => { updateLLM({ apiKey }); setAiTest(idleTest); }} />
              <SelectField
                id="llm-google-model"
                label="Gemini modeli"
                value={llm.model}
                onChange={(model) => { updateLLM({ model }); setAiTest(idleTest); }}
                options={[
                  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite · düşük kota tüketimi" },
                  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash · daha güçlü" },
                ]}
              />
              <p className="flex gap-2 text-[10px] leading-4 text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" /> Görev motoru TTS ile aynı native Gemini kimlik doğrulamasını kullanır. Anahtar yalnız test veya görev isteği sırasında aynı-origin sunucu rotasına gönderilir.</p>
            </div>
          ) : llm.provider === "openai-compatible" ? (
            <div className="mt-5 space-y-4 rounded-xl border border-violet-400/15 bg-violet-400/[0.035] p-4">
              <SecretField id="llm-api-key" label="AI API key" value={llm.apiKey} onChange={(apiKey) => { updateLLM({ apiKey }); setAiTest(idleTest); }} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="llm-model" label="Model" value={llm.model} onChange={(model) => { updateLLM({ model }); setAiTest(idleTest); }} placeholder="Örn. sağlayıcının model kimliği" />
                <TextField id="llm-base-url" label="Base URL" type="url" value={llm.baseUrl} onChange={(baseUrl) => { updateLLM({ baseUrl }); setAiTest(idleTest); }} placeholder="https://…/v1" />
              </div>
              <p className="flex gap-2 text-[10px] leading-4 text-slate-500"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" /> Base URL yalnız HTTPS olmalı. Özel ağ adresleri ve sunucuda izin verilmeyen origin&apos;ler reddedilir.</p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-cyan/15 bg-cyan/[0.04] p-4 text-xs leading-5 text-slate-400">Görevler mevcut seed içerik ve güvenli mock geribildirimle çalışır. Harici servise öğrenci metni gönderilmez.</div>
          )}

          <div className="mt-4 space-y-3">
            <ServiceStatus state={aiTest} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => void testAIConnection()} disabled={aiTest.tone === "loading" || !llmComplete}><PlugZap className="h-3.5 w-3.5" /> AI bağlantısını test et</Button>
              {llm.provider !== "mock" ? <Button size="sm" variant="ghost" onClick={() => { clearLLM(); setAiTest(idleTest); }}><Trash2 className="h-3.5 w-3.5" /> AI bağlantısını unut</Button> : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.12] bg-black/10 p-4 sm:p-5" aria-labelledby="tts-provider-title">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/25 bg-cyan/10 text-cyan"><Waves className="h-5 w-5" /></div>
              <div><h3 id="tts-provider-title" className="font-display text-base font-black uppercase text-white">Ses sağlayıcısı</h3><p className="mt-1 text-[10px] text-slate-500">İngilizce/Türkçe neural TTS + browser fallback</p></div>
            </div>
            <span className={`rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${ttsComplete ? "border-lime/20 bg-lime/10 text-lime" : "border-coral/20 bg-coral/10 text-coral"}`}>{tts.provider === "browser" ? "Browser ready" : ttsComplete ? "Configured" : "Incomplete"}</span>
          </div>

          <div className="mt-5">
            <ProviderMode<RuntimeTTSProvider>
              label="Ses çalışma modu"
              value={tts.provider}
              onChange={changeTTSProvider}
              options={[
                { value: "browser", title: "Tarayıcı sesi", detail: "Anahtarsız; kalite cihazdaki ses paketine bağlı.", icon: Headphones },
                { value: "google-gemini", title: "Google Gemini Voice", detail: "Doğal İngilizce/Türkçe neural ses; ücretsiz katman mevcut.", icon: Sparkles },
                { value: "openai-compatible", title: "OpenAI-compatible", detail: "İleri seviye neural TTS bağlantısı.", icon: Waves },
              ]}
            />
          </div>

          {tts.provider !== "browser" ? (
            <div className="mt-5 space-y-4 rounded-xl border border-cyan/15 bg-cyan/[0.035] p-4">
              <label className={`flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 p-3 ${canShareAIKey ? "cursor-pointer" : "opacity-60"}`}>
                <input type="checkbox" checked={tts.useSharedAIKey && canShareAIKey} disabled={!canShareAIKey} onChange={(event) => updateTTS({ useSharedAIKey: event.target.checked })} className="h-4 w-4 accent-cyan" />
                <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-white">AI API anahtarını paylaş</span><span className="mt-1 block text-[10px] text-slate-500">Aynı sağlayıcı hesabı kullanılıyorsa ikinci anahtar saklama.</span></span>
                <KeyRound className="h-4 w-4 text-cyan" />
              </label>
              <SecretField id="tts-api-key" label={tts.provider === "google-gemini" ? "Gemini TTS API key" : "TTS API key"} value={tts.apiKey} onChange={(apiKey) => updateTTS({ apiKey })} disabled={tts.useSharedAIKey && canShareAIKey} />
              {sharedKeyMismatch ? <p className="flex gap-2 text-[10px] leading-4 text-amber"><CircleAlert className="h-3.5 w-3.5 shrink-0" /> AI ve ses sağlayıcıları farklı olduğu için ayrı bir TTS anahtarı gir.</p> : null}
              {sharedKeyMissing ? <p className="flex gap-2 text-[10px] leading-4 text-coral"><CircleAlert className="h-3.5 w-3.5 shrink-0" /> Paylaşılan anahtar seçili ancak AI API key alanı boş.</p> : null}
              {tts.provider === "google-gemini" ? (
                <>
                  <SelectField
                    id="tts-google-model"
                    label="Gemini ses modeli"
                    value={tts.model}
                    onChange={(model) => updateTTS({ model })}
                    options={[
                      { value: "gemini-3.1-flash-tts-preview", label: "Gemini 3.1 Flash TTS · önerilen" },
                      { value: "gemini-2.5-flash-preview-tts", label: "Gemini 2.5 Flash TTS · uyumlu" },
                    ]}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField id="tts-english-voice" label="English voice" value={tts.englishVoice} onChange={(englishVoice) => updateTTS({ englishVoice })} options={googleVoiceOptions.map(([value, style]) => ({ value, label: `${value} · ${style}` }))} />
                    <SelectField id="tts-turkish-voice" label="Türkçe voice" value={tts.turkishVoice} onChange={(turkishVoice) => updateTTS({ turkishVoice })} options={googleVoiceOptions.map(([value, style]) => ({ value, label: `${value} · ${style}` }))} />
                  </div>
                  <p className="flex gap-2 text-[10px] leading-4 text-slate-500"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" /> Gemini dili metinden otomatik algılar. Ses modelini AI Studio&apos;da deneyebilir, ardından aşağıdaki iki test düğmesiyle doğrulayabilirsin.</p>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id="tts-model" label="TTS model" value={tts.model} onChange={(model) => updateTTS({ model })} placeholder="Sağlayıcının TTS model kimliği" />
                  <TextField id="tts-base-url" label="TTS base URL" type="url" value={tts.baseUrl} onChange={(baseUrl) => updateTTS({ baseUrl })} placeholder="https://…/v1" />
                  <TextField id="tts-english-voice" label="English voice" value={tts.englishVoice} onChange={(englishVoice) => updateTTS({ englishVoice })} placeholder="English voice ID" />
                  <TextField id="tts-turkish-voice" label="Türkçe voice" value={tts.turkishVoice} onChange={(turkishVoice) => updateTTS({ turkishVoice })} placeholder="Turkish voice ID" />
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-5 rounded-xl border border-amber/15 bg-amber/[0.035] p-4">
            <label htmlFor="browser-voice" className="text-[9px] font-black uppercase tracking-[0.15em] text-amber">Browser fallback voice</label>
            <select id="browser-voice" value={tts.browserVoice} onChange={(event) => updateTTS({ browserVoice: event.target.value })} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#091722] px-3 text-xs text-slate-300 outline-none focus:border-amber/50">
              <option value="">Dil için otomatik seçim</option>
              {sortedBrowserVoices.map((voice) => <option key={voice.voiceURI} value={voice.name}>{voice.name} · {voice.lang}{voice.default ? " · default" : ""}</option>)}
            </select>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">{sortedBrowserVoices.length ? `${sortedBrowserVoices.length} kurulu cihaz sesi bulundu.` : "Tarayıcı henüz kurulu ses listesini paylaşmadı."}</p>
          </div>

          <div className="mt-4 space-y-3">
            <ServiceStatus state={voiceStatus} />
            <div className="flex flex-wrap gap-2">
              {audioTest.status === "playing" || audioTest.status === "paused" ? (
                <Button size="sm" variant="ghost" onClick={audioTest.stop}><Square className="h-3.5 w-3.5" /> Testi durdur</Button>
              ) : (
                <>
                  <Button size="sm" variant="secondary" onClick={() => playVoiceTest("en-US")} disabled={!ttsComplete}><Volume2 className="h-3.5 w-3.5" /> English test</Button>
                  <Button size="sm" variant="ghost" onClick={() => playVoiceTest("tr-TR")} disabled={!ttsComplete}><Volume2 className="h-3.5 w-3.5" /> Türkçe test</Button>
                </>
              )}
              {tts.provider !== "browser" ? <Button size="sm" variant="ghost" onClick={() => { audioTest.stop(); clearTTS(); }}><Trash2 className="h-3.5 w-3.5" /> TTS bağlantısını unut</Button> : null}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-3 border-t border-white/10 bg-black/10 px-5 py-4 text-[10px] leading-5 text-slate-500 sm:px-6 lg:grid-cols-2">
        <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> API anahtarları oyun store&apos;una, ShiftQuest JSON export&apos;una veya import dosyasına eklenmez. Yalnız ayrı <code className="text-slate-300">shiftquest-runtime-providers-v1</code> kaydında tutulur.</p>
        <p className="flex gap-2"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber" /> Bu yerel kasa şifreli bir sunucu kasası değildir. Paylaşılan cihazda işin bittiğinde “bağlantıları unut” kullan; hiçbir anahtar istemci loglarına yazılmaz.</p>
      </div>
    </Panel>
  );
}
