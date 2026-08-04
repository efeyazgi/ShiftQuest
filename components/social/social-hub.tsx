"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Ban,
  BookOpenCheck,
  Check,
  Copy,
  Crown,
  Link2,
  LockKeyhole,
  Medal,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserMinus,
  UserRoundCheck,
  UsersRound,
  Zap,
} from "lucide-react";

import {
  acceptFriendInviteAction,
  blockUserAction,
  createFriendInviteAction,
  removeFriendAction,
  saveSocialProfileAction,
  unblockUserAction,
} from "@/app/social/actions";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { GAME_TITLE_DISCLAIMER } from "@/data/career";
import { achievements } from "@/data/achievements";
import { useGameStore } from "@/features/game/store";
import { buildAchievementFacts } from "@/lib/achievements/from-game";
import { evaluateAchievements } from "@/lib/achievements/evaluator";
import {
  careerLevels,
  type CareerLevel,
  type SocialActionResult,
  type SocialProfileInput,
  type SocialSnapshot,
} from "@/lib/social/contracts";

const careerLevelLabels: Record<CareerLevel, string> = {
  student: "Öğrenci / stajyer",
  entry: "Kariyer başlangıcı",
  mid: "Orta seviye",
  senior: "Kıdemli uzman",
  lead: "Takım lideri",
  manager: "Yönetici",
  executive: "Üst düzey yönetici",
};

const emptyProfile: SocialProfileInput = {
  displayName: "",
  industry: "",
  professionalRole: "",
  careerLevel: "entry",
  profileVisibility: "private",
  leaderboardOptIn: false,
  achievementCountOptIn: false,
};

type Notice = { tone: "success" | "error"; text: string } | null;

function PrivacyToggle({
  checked,
  disabled,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-4 rounded-xl border p-4 ${disabled ? "border-white/5 opacity-45" : "border-white/10 bg-black/10"}`}>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white">{label}</span>
        <span className="mt-1 block text-[11px] leading-5 text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-cyan"
      />
    </label>
  );
}

function profileFromSnapshot(snapshot: SocialSnapshot): SocialProfileInput {
  return snapshot.profile
    ? {
        displayName: snapshot.profile.displayName,
        industry: snapshot.profile.industry,
        professionalRole: snapshot.profile.professionalRole,
        careerLevel: snapshot.profile.careerLevel,
        profileVisibility: snapshot.profile.profileVisibility,
        leaderboardOptIn: snapshot.profile.leaderboardOptIn,
        achievementCountOptIn: snapshot.profile.achievementCountOptIn,
      }
    : emptyProfile;
}

export function SocialHub({
  snapshot,
  inviteToken,
}: {
  snapshot: SocialSnapshot;
  inviteToken: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const localProfile = useGameStore((state) => state.profile);
  const progress = useGameStore((state) => state.progress);
  const attempts = useGameStore((state) => state.attempts);
  const activities = useGameStore((state) => state.activities);
  const [form, setForm] = useState<SocialProfileInput>(() => profileFromSnapshot(snapshot));
  const [notice, setNotice] = useState<Notice>(null);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (!snapshot.profile && localProfile?.displayName) {
      setForm((current) => ({
        ...current,
        displayName: current.displayName || localProfile.displayName,
      }));
    }
  }, [localProfile?.displayName, snapshot.profile]);

  const achievementEvaluations = useMemo(
    () => evaluateAchievements(
      buildAchievementFacts(progress, attempts, activities),
      achievements,
    ),
    [activities, attempts, progress],
  );

  const finishAction = (
    action: () => Promise<SocialActionResult>,
    successMessage: string,
    options: { clearInvite?: boolean } = {},
  ) => {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setNotice({ tone: "error", text: result.message });
        return;
      }
      setNotice({ tone: "success", text: successMessage });
      if (options.clearInvite) router.replace("/social");
      router.refresh();
    });
  };

  const saveProfile = () => finishAction(
    () => saveSocialProfileAction(form),
    "Sosyal profil ve gizlilik tercihleri kaydedildi.",
  );

  const createInvite = () => {
    setNotice(null);
    startTransition(async () => {
      const result = await createFriendInviteAction();
      if (!result.ok) {
        setNotice({ tone: "error", text: result.message });
        return;
      }
      const link = `${window.location.origin}/social?invite=${encodeURIComponent(result.data.token)}`;
      setInviteLink(link);
      setNotice({ tone: "success", text: "24 saatlik tek kullanımlık davet oluşturuldu." });
      router.refresh();
    });
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotice({ tone: "success", text: "Davet bağlantısı panoya kopyalandı." });
    } catch {
      setNotice({ tone: "error", text: "Bağlantı kopyalanamadı; metni elle seçebilirsin." });
    }
  };

  if (snapshot.status !== "ready") {
    return (
      <div className="app-frame py-10">
        <Panel className="mx-auto max-w-2xl p-7 text-center" accent="amber">
          <LockKeyhole className="mx-auto size-10 text-amber" />
          <h1 className="mt-5 font-display text-3xl font-black uppercase text-white">Sosyal merkez kapalı</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">{snapshot.message}</p>
          {snapshot.status === "signed-out" ? (
            <Link href="/auth/login" className="mt-6 inline-flex"><Button>Oturum aç</Button></Link>
          ) : null}
        </Panel>
      </div>
    );
  }

  return (
    <div className="app-frame py-7 sm:py-10">
      <section className="relative overflow-hidden rounded-2xl border border-cyan/20 bg-[#0a1822]/90 p-6 shadow-neon sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-cyan/[0.08] blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan"><ShieldCheck className="size-4" /> Private by default</p>
            <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Sosyal Öğrenme</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">Yalnız kabul edilmiş arkadaşlarınla ilerleme paylaş. Açık kullanıcı dizini yok; keşif sadece süreli ve tek kullanımlık davetlerle çalışır.</p>
          </div>
          <div className="rounded-xl border border-lime/20 bg-lime/[0.06] px-4 py-3 text-xs text-lime">
            <span className="font-display font-black uppercase">Güvenli varsayılan:</span> {form.profileVisibility === "private" ? "Profil gizli" : "Yalnız arkadaşlar"}
          </div>
        </div>
      </section>

      {snapshot.message ? (
        <div className="mt-4 rounded-xl border border-amber/25 bg-amber/[0.06] px-4 py-3 text-xs leading-5 text-amber">{snapshot.message}</div>
      ) : null}
      {notice ? (
        <div role="status" className={`mt-4 rounded-xl border px-4 py-3 text-xs ${notice.tone === "success" ? "border-lime/25 bg-lime/[0.06] text-lime" : "border-coral/25 bg-coral/[0.06] text-coral"}`}>{notice.text}</div>
      ) : null}

      {inviteToken ? (
        <Panel className="mt-5 p-5 sm:p-6" label="INCOMING INVITE" accent="lime">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-display text-lg font-black uppercase text-white">Arkadaş daveti bulundu</h2><p className="mt-2 text-xs leading-5 text-slate-500">Kabul edildiğinde iki hesap arkadaş olur. Davet tekrar kullanılamaz.</p></div>
            <Button disabled={pending || !snapshot.canMutate} onClick={() => finishAction(() => acceptFriendInviteAction(inviteToken), "Davet kabul edildi.", { clearInvite: true })}><UserRoundCheck className="size-4" /> Daveti kabul et</Button>
          </div>
        </Panel>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.75fr)]">
        <Panel label="SOCIAL PROFILE" accent="cyan">
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-300">Görünen ad<input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} maxLength={60} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Sektör<input value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} maxLength={80} placeholder="Örn. ilaç, üretim, yazılım" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Profesyonel rol<input value={form.professionalRole} onChange={(event) => setForm((current) => ({ ...current, professionalRole: event.target.value }))} maxLength={80} placeholder="Örn. proses mühendisi" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" /></label>
              <label className="text-xs font-bold text-slate-300">Gerçek kariyer seviyesi<select value={form.careerLevel} onChange={(event) => setForm((current) => ({ ...current, careerLevel: event.target.value as CareerLevel }))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#08151e] px-4 py-3 text-sm text-white">{careerLevels.map((level) => <option key={level} value={level}>{careerLevelLabels[level]}</option>)}</select></label>
            </div>

            <div className="rounded-xl border border-amber/20 bg-amber/[0.045] p-4 text-xs leading-5 text-slate-400">
              <span className="font-bold text-amber">Ayrı kavramlar:</span> Ayarlardaki kariyer alanı öğrenme rotandır. Oyun unvanı XP ilerlemesidir ve sosyal kariyer seviyesi olarak kullanılmaz. {GAME_TITLE_DISCLAIMER}
            </div>

            <div className="space-y-2.5">
              <PrivacyToggle checked={form.profileVisibility === "friends"} label="Profili arkadaşlarla paylaş" description="Kapalıyken arkadaşların adını, sektörünü, rolünü veya kariyer seviyeni göremez." onChange={(checked) => setForm((current) => ({ ...current, profileVisibility: checked ? "friends" : "private", ...(!checked ? { leaderboardOptIn: false, achievementCountOptIn: false } : {}) }))} />
              <PrivacyToggle checked={form.leaderboardOptIn} disabled={form.profileVisibility !== "friends"} label="Arkadaş liderlik tablosuna katıl" description="Yalnız kabul edilmiş ve engellenmemiş arkadaşların doğrulanmış XP toplamını görebilir." onChange={(leaderboardOptIn) => setForm((current) => ({ ...current, leaderboardOptIn }))} />
              <PrivacyToggle checked={form.achievementCountOptIn} disabled={form.profileVisibility !== "friends"} label="Doğrulanmış başarım sayısını paylaş" description="Başarım adları veya öğrenme ayrıntıları değil, yalnız doğrulanmış toplam görünür." onChange={(achievementCountOptIn) => setForm((current) => ({ ...current, achievementCountOptIn }))} />
            </div>

            <Button disabled={pending || !snapshot.canMutate} onClick={saveProfile}><Check className="size-4" /> Profil ve gizliliği kaydet</Button>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel label="ONE-TIME INVITE" accent="lime">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3"><Link2 className="mt-0.5 size-5 shrink-0 text-lime" /><div><h2 className="font-display text-base font-black uppercase text-white">Arkadaşını güvenle davet et</h2><p className="mt-2 text-xs leading-5 text-slate-500">Yeni davet önceki kullanılmamış daveti iptal eder. Bağlantı 24 saatte sona erer ve bir kez kabul edilebilir.</p></div></div>
              <Button className="mt-5 w-full" variant="secondary" disabled={pending || !snapshot.canMutate || !snapshot.profile} onClick={createInvite}><Link2 className="size-4" /> Davet oluştur</Button>
              {!snapshot.profile ? <p className="mt-2 text-[10px] text-amber">Önce sosyal profilini kaydet.</p> : null}
              {inviteLink ? <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3"><p className="break-all text-[10px] leading-5 text-slate-400">{inviteLink}</p><button type="button" onClick={() => void copyInvite()} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cyan"><Copy className="size-3.5" /> Bağlantıyı kopyala</button></div> : null}
              <p className="mt-3 text-[10px] text-slate-600">Aktif davet: {snapshot.activeInviteCount}</p>
            </div>
          </Panel>

          <Panel label="VERIFIED LEADERBOARD" accent="amber">
            <div className="space-y-2 p-4">
              {snapshot.leaderboard.map((entry, index) => (
                <div key={entry.userId} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 ${entry.isCurrentUser ? "border-cyan/25 bg-cyan/[0.06]" : "border-white/10 bg-black/10"}`}>
                  <span className="grid size-8 place-items-center rounded-lg bg-white/5 font-display text-xs font-black text-amber">{index + 1}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{entry.displayName}{entry.isCurrentUser ? " · Sen" : ""}</span><span className="mt-1 block text-[9px] text-slate-600">{entry.completedScenarios} doğrulanmış görev{entry.verifiedAchievementCount === undefined ? "" : ` · ${entry.verifiedAchievementCount} başarım`}</span></span>
                  <span className="flex items-center gap-1 font-display text-xs font-black text-lime"><Zap className="size-3.5" /> {entry.verifiedXp}</span>
                </div>
              ))}
              <p className="px-2 pt-2 text-[10px] leading-4 text-slate-600">Sıralama yerel kayıt veya game_saves XP’sini kullanmaz. Yalnız sunucunun kanonik cevaplardan yeniden hesapladığı puan dahildir.</p>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel label="FRIENDS" accent="cyan">
          <div className="space-y-3 p-5">
            {snapshot.friends.length ? snapshot.friends.map((friend) => (
              <div key={friend.userId} className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-start gap-3"><UsersRound className="mt-0.5 size-5 shrink-0 text-cyan" /><div className="min-w-0 flex-1"><p className="font-bold text-white">{friend.displayName}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{friend.profileShared ? `${friend.professionalRole} · ${friend.industry} · ${careerLevelLabels[friend.careerLevel!]}` : "Profil paylaşımı kapalı"}{friend.verifiedAchievementCount === undefined ? "" : ` · ${friend.verifiedAchievementCount} doğrulanmış başarım`}</p></div></div>
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={pending || !snapshot.canMutate} onClick={() => { if (window.confirm("Bu kişiyi arkadaşlıktan çıkarmak istiyor musun?")) finishAction(() => removeFriendAction(friend.userId), "Arkadaşlık kaldırıldı."); }} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-white"><UserMinus className="size-3.5" /> Arkadaşlıktan çıkar</button><button type="button" disabled={pending || !snapshot.canMutate} onClick={() => { if (window.confirm("Bu kişiyi engellemek ve arkadaşlığı kaldırmak istiyor musun?")) finishAction(() => blockUserAction(friend.userId), "Kullanıcı engellendi ve arkadaşlık kaldırıldı."); }} className="inline-flex items-center gap-2 rounded-lg border border-coral/20 px-3 py-2 text-[10px] font-bold text-coral"><Ban className="size-3.5" /> Engelle</button></div>
              </div>
            )) : <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-600">Henüz kabul edilmiş arkadaş yok.</p>}
          </div>
        </Panel>

        <Panel label="BLOCKED" accent="coral">
          <div className="space-y-3 p-5">
            {snapshot.blockedUserIds.length ? snapshot.blockedUserIds.map((userId) => (
              <div key={userId} className="flex items-center gap-3 rounded-xl border border-coral/15 bg-coral/[0.035] p-4"><Ban className="size-4 text-coral" /><span className="min-w-0 flex-1 text-xs text-slate-400">Engellenmiş hesap · …{userId.slice(-8)}</span><button type="button" disabled={pending || !snapshot.canMutate} onClick={() => finishAction(() => unblockUserAction(userId), "Engel kaldırıldı.")} className="inline-flex items-center gap-2 text-[10px] font-bold text-cyan"><RefreshCw className="size-3.5" /> Engeli kaldır</button></div>
            )) : <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-600">Engellenmiş hesap yok.</p>}
          </div>
        </Panel>
      </div>

      <Panel className="mt-5" label="LOCAL ACHIEVEMENT EVALUATORS" accent="lime">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-display text-lg font-black uppercase text-white">Başarım kontrolleri</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">Bu kartlar cihazındaki öğrenme kaydını değerlendirir. Rozet tanınması XP veya coin talebi oluşturmaz; sosyal toplam yalnız sunucuda doğrulanabilen alt kümeyi sayar.</p></div><span className="inline-flex items-center gap-2 self-start rounded-lg border border-lime/20 bg-lime/[0.06] px-3 py-2 text-[10px] font-black uppercase text-lime"><BookOpenCheck className="size-4" /> {achievementEvaluations.filter((item) => item.unlocked).length}/{achievementEvaluations.length}</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {achievementEvaluations.map((evaluation) => (
              <div key={evaluation.achievement.id} className={`rounded-xl border p-4 ${!evaluation.active ? "border-amber/20 bg-amber/[0.035]" : evaluation.unlocked ? "border-lime/20 bg-lime/[0.045]" : "border-white/10 bg-black/10"}`}>
                <div className="flex items-start gap-3">{evaluation.unlocked ? <Medal className="size-5 shrink-0 text-lime" /> : evaluation.active ? <Trophy className="size-5 shrink-0 text-slate-600" /> : <LockKeyhole className="size-5 shrink-0 text-amber" />}<div><p className="text-sm font-bold text-white">{evaluation.achievement.nameTr}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{evaluation.active ? evaluation.achievement.descriptionTr : evaluation.inactiveReason}</p></div></div>
                {evaluation.active ? <div className="mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.1em]"><span className={evaluation.unlocked ? "text-lime" : "text-slate-600"}>{evaluation.unlocked ? "Tanındı" : "Devam ediyor"}</span><span className="text-slate-500">{evaluation.currentValue}/{evaluation.targetValue}</span></div> : null}
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <footer className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-4 text-[10px] leading-5 text-slate-600"><Crown className="size-4 shrink-0 text-amber" /> E-posta adresleri sosyal profil, arkadaş listesi ve liderlik tablosu yanıtlarına hiçbir zaman dahil edilmez.</footer>
    </div>
  );
}
