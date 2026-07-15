"use client";

import { KeyRound, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useGameStore } from "@/features/game/store";
import { CloudSyncStatus, useCloudSync } from "@/features/sync/cloud-sync-provider";

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const profile = useGameStore((state) => state.profile);
  const { user, signOut } = useCloudSync();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const avatar = profile?.avatarId?.replace("avatar-", "") === "2"
    ? "🧑🏽‍🔬"
    : profile?.avatarId?.replace("avatar-", "") === "3"
      ? "👩🏻‍💼"
      : "👷‍♀️";

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="grid h-9 w-9 place-items-center rounded-lg border border-cyan/25 bg-cyan/10 text-lg transition hover:border-cyan/50 hover:bg-cyan/15" title={profile?.displayName ?? user?.email ?? "Hesap"}>{avatar}</button>
      {open ? (
        <div role="menu" className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-white/12 bg-[#0a1822] shadow-[0_24px_70px_rgba(0,0,0,.55)]">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-cyan/20 bg-cyan/10 text-cyan"><UserRound className="size-4" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{profile?.displayName ?? "Engineer"}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{user?.email ?? "Oturum hazırlanıyor"}</span></span>
            </div>
            <div className="mt-3"><CloudSyncStatus /></div>
          </div>
          <div className="p-2">
            <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"><Settings className="size-4 text-cyan" /> Hesap ve ayarlar</Link>
            <div className="flex items-start gap-3 rounded-xl px-3 py-3 text-[10px] leading-4 text-slate-500"><KeyRound className="mt-0.5 size-4 shrink-0 text-amber" /> AI anahtarların yalnız bu cihazda kalır ve çıkışta temizlenir.</div>
            <button role="menuitem" type="button" onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-coral transition hover:bg-coral/10"><LogOut className="size-4" /> Güvenli çıkış yap</button>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-lime"><ShieldCheck className="size-3.5" /> Supabase RLS korumalı</div>
        </div>
      ) : null}
    </div>
  );
}
