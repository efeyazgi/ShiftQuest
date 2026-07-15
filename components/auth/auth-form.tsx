"use client";

import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { BrandLockup } from "@/components/landing/brand-lockup";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "sign-up" | "forgot-password" | "update-password";

const copy: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  login: {
    eyebrow: "ACCOUNT TERMINAL / SIGN IN",
    title: "Vardiyana dön.",
    description: "Bulut kaydını açmak ve kaldığın yerden devam etmek için hesabına giriş yap.",
    submit: "Giriş yap",
  },
  "sign-up": {
    eyebrow: "ACCOUNT TERMINAL / NEW ENGINEER",
    title: "Hesabını oluştur.",
    description: "İlerlemen cihazlar arasında güvenli biçimde senkronize edilsin.",
    submit: "Ücretsiz hesap aç",
  },
  "forgot-password": {
    eyebrow: "ACCOUNT TERMINAL / RECOVERY",
    title: "Erişimi yenile.",
    description: "Şifre sıfırlama bağlantısını hesabının e-posta adresine göndereceğiz.",
    submit: "Sıfırlama bağlantısı gönder",
  },
  "update-password": {
    eyebrow: "ACCOUNT TERMINAL / NEW PASSWORD",
    title: "Yeni şifre belirle.",
    description: "Hesabın için en az 8 karakterlik yeni bir şifre oluştur.",
    submit: "Şifreyi güncelle",
  },
};

function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/map";
}

function messageForError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (normalized.includes("email not confirmed")) return "Önce e-posta adresini doğrulamalısın.";
  if (normalized.includes("already registered")) return "Bu e-posta ile zaten bir hesap bulunuyor.";
  if (normalized.includes("password")) return "Şifre en az 8 karakter olmalı.";
  if (normalized.includes("rate limit")) return "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.";
  return "İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.";
}

export function AuthForm({
  mode,
  next,
  reason,
}: {
  mode: AuthMode;
  next?: string;
  reason?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const current = copy[mode];
  const needsEmail = mode !== "update-password";
  const needsPassword = mode !== "forgot-password";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isSupabaseConfigured) {
      setError("Hesap sunucusu henüz yapılandırılmadı. Yönetici Supabase bağlantısını tamamlamalı.");
      return;
    }
    if (needsPassword && password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if ((mode === "sign-up" || mode === "update-password") && password !== confirmPassword) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    if (mode === "sign-up" && !accepted) {
      setError("Devam etmek için kullanım ve gizlilik koşullarını kabul etmelisin.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(safeNext(next));
        router.refresh();
      } else if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/onboarding");
          router.refresh();
        } else {
          setSuccess("Doğrulama bağlantısı gönderildi. E-postanı açıp hesabını etkinleştir.");
        }
      } else if (mode === "forgot-password") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        });
        if (authError) throw authError;
        setSuccess("Şifre sıfırlama bağlantısı gönderildi. E-posta kutunu kontrol et.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setSuccess("Şifren güncellendi. Kariyer haritasına yönlendiriliyorsun.");
        window.setTimeout(() => router.replace("/map"), 900);
      }
    } catch (caught) {
      setError(messageForError(caught instanceof Error ? caught.message : "unknown"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-arcade-grid bg-[size:48px_48px] opacity-[0.16]" />
      <div className="pointer-events-none absolute -left-56 top-1/3 size-[520px] rounded-full bg-cyan/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute -right-56 bottom-0 size-[500px] rounded-full bg-lime/[0.06] blur-[120px]" />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#091821]/95 shadow-[0_35px_100px_rgba(0,0,0,.5)] backdrop-blur">
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <Link href="/" aria-label="ShiftQuest ana sayfa"><BrandLockup compact /></Link>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan">{current.eyebrow}</p>
          <h1 className="mt-4 font-display text-3xl font-black uppercase leading-none tracking-[-0.04em]">{current.title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/45">{current.description}</p>

          {reason === "configuration" || !isSupabaseConfigured ? (
            <div className="mt-5 flex gap-3 rounded-xl border border-amber/25 bg-amber/[0.07] p-4 text-xs leading-5 text-amber">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" /> Hesap altyapısı kuruluyor. Supabase ortam değişkenleri eklendikten sonra bu terminal otomatik açılacak.
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-7 space-y-4">
            {needsEmail ? (
              <label className="block">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">E-posta</span>
                <span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 transition focus-within:border-cyan/50">
                  <Mail className="size-4 text-cyan/65" />
                  <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20" placeholder="engineer@example.com" />
                </span>
              </label>
            ) : null}

            {needsPassword ? (
              <label className="block">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">{mode === "update-password" ? "Yeni şifre" : "Şifre"}</span>
                <span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 transition focus-within:border-cyan/50">
                  <LockKeyhole className="size-4 text-cyan/65" />
                  <input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20" placeholder="En az 8 karakter" />
                </span>
              </label>
            ) : null}

            {mode === "sign-up" || mode === "update-password" ? (
              <label className="block">
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">Şifre tekrar</span>
                <span className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 transition focus-within:border-cyan/50">
                  <KeyRound className="size-4 text-cyan/65" />
                  <input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
                </span>
              </label>
            ) : null}

            {mode === "sign-up" ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-white/50">
                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 accent-cyan" />
                <span><Link href="/terms" className="text-cyan hover:underline">Kullanım koşullarını</Link> ve <Link href="/privacy" className="text-cyan hover:underline">gizlilik bildirimini</Link> kabul ediyorum.</span>
              </label>
            ) : null}

            {error ? <p role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.07] px-4 py-3 text-xs leading-5 text-coral">{error}</p> : null}
            {success ? <p role="status" className="flex gap-2 rounded-xl border border-lime/25 bg-lime/[0.07] px-4 py-3 text-xs leading-5 text-lime"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{success}</p> : null}

            <button type="submit" disabled={busy || Boolean(success)} className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 font-display text-xs font-black uppercase tracking-[0.13em] text-ink transition hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:opacity-50">
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <>{current.submit}<ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
            {mode === "login" ? <><Link href="/auth/forgot-password" className="hover:text-cyan">Şifremi unuttum</Link><Link href="/auth/sign-up" className="font-bold text-cyan hover:text-white">Hesap aç</Link></> : null}
            {mode === "sign-up" ? <span>Zaten hesabın var mı? <Link href="/auth/login" className="font-bold text-cyan hover:text-white">Giriş yap</Link></span> : null}
            {mode === "forgot-password" || mode === "update-password" ? <Link href="/auth/login" className="font-bold text-cyan hover:text-white">Giriş ekranına dön</Link> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
