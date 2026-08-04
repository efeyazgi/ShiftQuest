"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  socialProfileInputSchema,
  type SocialActionResult,
  type SocialProfileInput,
} from "@/lib/social/contracts";
import {
  createAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.string().uuid();
const inviteTokenSchema = z.string().trim().min(32).max(200);
type SocialActionFailure = { ok: false; message: string };

async function authenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user?.id ?? null;
  } catch {
    return null;
  }
}

function unavailable(): SocialActionFailure {
  return {
    ok: false,
    message: "Bu işlem için güvenli Supabase sunucu bağlantısı hazır değil.",
  };
}

function mutationError(): SocialActionFailure {
  return {
    ok: false,
    message: "İşlem tamamlanamadı. Bağlantını ve sosyal migration kurulumunu kontrol et.",
  };
}

export async function saveSocialProfileAction(
  input: SocialProfileInput,
): Promise<SocialActionResult> {
  const parsed = socialProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Sosyal profil alanlarını kontrol et." };
  }
  if (!isSupabaseAdminConfigured) return unavailable();
  const userId = await authenticatedUserId();
  if (!userId) return { ok: false, message: "Oturumun sona ermiş. Yeniden giriş yap." };

  const profile = parsed.data;
  const { error } = await createAdminClient().from("social_profiles").upsert({
    user_id: userId,
    display_name: profile.displayName,
    industry: profile.industry,
    professional_role: profile.professionalRole,
    career_level: profile.careerLevel,
    profile_visibility: profile.profileVisibility,
    leaderboard_opt_in: profile.leaderboardOptIn,
    achievement_count_opt_in: profile.achievementCountOptIn,
  }, { onConflict: "user_id" });

  if (error) return mutationError();
  revalidatePath("/social");
  return { ok: true, data: undefined };
}

export async function createFriendInviteAction(): Promise<
  SocialActionResult<{ token: string; expiresAt: string }>
> {
  if (!isSupabaseAdminConfigured) return unavailable();
  const userId = await authenticatedUserId();
  if (!userId) return { ok: false, message: "Oturumun sona ermiş. Yeniden giriş yap." };

  const admin = createAdminClient();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString();

  const { error: cleanupError } = await admin
    .from("friend_invites")
    .delete()
    .eq("inviter_id", userId)
    .is("used_at", null);
  if (cleanupError) return mutationError();

  const { error } = await admin.from("friend_invites").insert({
    inviter_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) return mutationError();

  revalidatePath("/social");
  return { ok: true, data: { token, expiresAt } };
}

export async function acceptFriendInviteAction(
  rawToken: string,
): Promise<SocialActionResult> {
  const parsed = inviteTokenSchema.safeParse(rawToken);
  if (!parsed.success) return { ok: false, message: "Davet bağlantısı geçersiz." };
  if (!isSupabaseAdminConfigured) return unavailable();
  const userId = await authenticatedUserId();
  if (!userId) return { ok: false, message: "Daveti kabul etmek için oturum aç." };

  const tokenHash = createHash("sha256").update(parsed.data).digest("hex");
  const { error } = await createAdminClient().rpc("accept_friend_invite", {
    accepting_user_id: userId,
    invite_token_hash: tokenHash,
  });
  if (error) {
    return {
      ok: false,
      message: "Davet kullanılmış, süresi dolmuş veya engelleme nedeniyle geçersiz.",
    };
  }

  revalidatePath("/social");
  return { ok: true, data: undefined };
}

export async function removeFriendAction(
  targetUserId: string,
): Promise<SocialActionResult> {
  const parsed = userIdSchema.safeParse(targetUserId);
  if (!parsed.success) return { ok: false, message: "Arkadaş kaydı geçersiz." };
  if (!isSupabaseAdminConfigured) return unavailable();
  const userId = await authenticatedUserId();
  if (!userId) return { ok: false, message: "Oturumun sona ermiş." };

  const userA = userId < parsed.data ? userId : parsed.data;
  const userB = userId < parsed.data ? parsed.data : userId;
  const { error } = await createAdminClient()
    .from("friendships")
    .delete()
    .eq("user_a", userA)
    .eq("user_b", userB);
  if (error) return mutationError();

  revalidatePath("/social");
  return { ok: true, data: undefined };
}

export async function blockUserAction(
  targetUserId: string,
): Promise<SocialActionResult> {
  const parsed = userIdSchema.safeParse(targetUserId);
  if (!parsed.success) return { ok: false, message: "Kullanıcı kaydı geçersiz." };
  if (!isSupabaseAdminConfigured) return unavailable();
  const userId = await authenticatedUserId();
  if (!userId || userId === parsed.data) {
    return { ok: false, message: "Bu kullanıcı engellenemiyor." };
  }

  const admin = createAdminClient();
  const { error: blockError } = await admin.from("social_blocks").upsert({
    blocker_id: userId,
    blocked_id: parsed.data,
  }, { onConflict: "blocker_id,blocked_id" });
  if (blockError) return mutationError();

  const userA = userId < parsed.data ? userId : parsed.data;
  const userB = userId < parsed.data ? parsed.data : userId;
  const { error: friendshipError } = await admin
    .from("friendships")
    .delete()
    .eq("user_a", userA)
    .eq("user_b", userB);
  if (friendshipError) return mutationError();

  revalidatePath("/social");
  return { ok: true, data: undefined };
}

export async function unblockUserAction(
  targetUserId: string,
): Promise<SocialActionResult> {
  const parsed = userIdSchema.safeParse(targetUserId);
  if (!parsed.success) return { ok: false, message: "Engel kaydı geçersiz." };
  if (!isSupabaseAdminConfigured) return unavailable();
  const userId = await authenticatedUserId();
  if (!userId) return { ok: false, message: "Oturumun sona ermiş." };

  const { error } = await createAdminClient()
    .from("social_blocks")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", parsed.data);
  if (error) return mutationError();

  revalidatePath("/social");
  return { ok: true, data: undefined };
}
