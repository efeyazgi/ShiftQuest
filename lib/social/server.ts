import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

import type {
  CareerLevel,
  LeaderboardEntry,
  SocialFriendView,
  SocialProfileView,
  SocialSnapshot,
} from "./contracts";

type SocialProfileRow = Database["public"]["Tables"]["social_profiles"]["Row"];

function toProfileView(row: SocialProfileRow): SocialProfileView {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    industry: row.industry,
    professionalRole: row.professional_role,
    careerLevel: row.career_level as CareerLevel,
    profileVisibility: row.profile_visibility === "friends" ? "friends" : "private",
    leaderboardOptIn: row.leaderboard_opt_in,
    achievementCountOptIn: row.achievement_count_opt_in,
    updatedAt: row.updated_at,
  };
}
const emptySnapshot = (
  status: SocialSnapshot["status"],
  message: string,
): SocialSnapshot => ({
  status,
  canMutate: false,
  message,
  profile: null,
  friends: [],
  blockedUserIds: [],
  leaderboard: [],
  activeInviteCount: 0,
});

export async function getSocialSnapshot(): Promise<SocialSnapshot> {
  if (!isSupabaseConfigured) {
    return emptySnapshot(
      "not-configured",
      "Sosyal öğrenme için Supabase bağlantısı henüz yapılandırılmamış.",
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return emptySnapshot(
      "signed-out",
      "Sosyal öğrenmeyi kullanmak için hesabınla oturum açmalısın.",
    );
  }

  const userId = authData.user.id;

  try {
    const [profileResult, friendshipResult, blockResult, inviteResult] = await Promise.all([
      supabase.from("social_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("friendships")
        .select("id,user_a,user_b,accepted_at,created_at")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`),
      supabase
        .from("social_blocks")
        .select("blocked_id")
        .eq("blocker_id", userId),
      supabase
        .from("friend_invites")
        .select("id,expires_at,used_at")
        .eq("inviter_id", userId)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString()),
    ]);

    const firstError = profileResult.error
      ?? friendshipResult.error
      ?? blockResult.error
      ?? inviteResult.error;
    if (firstError) throw firstError;

    const friendships = friendshipResult.data ?? [];
    const friendIds = friendships.map((friendship) =>
      friendship.user_a === userId ? friendship.user_b : friendship.user_a,
    );
    const visibleIds = [userId, ...friendIds];

    const [profilesResult, progressResult, achievementResult] = await Promise.all([
      supabase.from("social_profiles").select("*").in("user_id", visibleIds),
      supabase
        .from("verified_progress")
        .select("user_id,verified_xp,completed_scenarios,updated_at")
        .in("user_id", visibleIds),
      supabase
        .from("verified_achievement_counts")
        .select("user_id,verified_achievement_count,updated_at")
        .in("user_id", visibleIds),
    ]);

    const detailError = profilesResult.error ?? progressResult.error ?? achievementResult.error;
    if (detailError) throw detailError;

    const profileRows = profilesResult.data ?? [];
    const profilesById = new Map(profileRows.map((row) => [row.user_id, row]));
    const progressById = new Map((progressResult.data ?? []).map((row) => [row.user_id, row]));
    const achievementsById = new Map(
      (achievementResult.data ?? []).map((row) => [row.user_id, row]),
    );

    const friends: SocialFriendView[] = friendships.map((friendship) => {
      const friendId = friendship.user_a === userId ? friendship.user_b : friendship.user_a;
      const friendProfile = profilesById.get(friendId);
      const achievement = achievementsById.get(friendId);
      return {
        userId: friendId,
        displayName: friendProfile?.display_name ?? "Gizli profil",
        ...(friendProfile
          ? {
              industry: friendProfile.industry,
              professionalRole: friendProfile.professional_role,
              careerLevel: friendProfile.career_level as CareerLevel,
            }
          : {}),
        profileShared: Boolean(friendProfile),
        acceptedAt: friendship.accepted_at,
        ...(achievement
          ? { verifiedAchievementCount: achievement.verified_achievement_count }
          : {}),
      };
    });

    const leaderboard: LeaderboardEntry[] = visibleIds
      .flatMap((entryUserId) => {
        const progress = progressById.get(entryUserId);
        const entryProfile = profilesById.get(entryUserId);
        const isCurrentUser = entryUserId === userId;
        if (!isCurrentUser && (!progress || !entryProfile)) return [];
        const achievement = achievementsById.get(entryUserId);
        return [{
          userId: entryUserId,
          displayName: entryProfile?.display_name ?? "Sen",
          verifiedXp: progress?.verified_xp ?? 0,
          completedScenarios: progress?.completed_scenarios ?? 0,
          ...(achievement
            ? { verifiedAchievementCount: achievement.verified_achievement_count }
            : {}),
          isCurrentUser,
        }];
      })
      .sort((left, right) =>
        right.verifiedXp - left.verifiedXp
        || left.displayName.localeCompare(right.displayName, "tr"),
      );

    return {
      status: "ready",
      canMutate: isSupabaseAdminConfigured,
      ...(!isSupabaseAdminConfigured
        ? { message: "Sosyal yazma işlemleri için sunucu secret anahtarı eksik." }
        : {}),
      currentUserId: userId,
      profile: profileResult.data ? toProfileView(profileResult.data) : null,
      friends,
      blockedUserIds: (blockResult.data ?? []).map((row) => row.blocked_id),
      leaderboard,
      activeInviteCount: inviteResult.data?.length ?? 0,
    };
  } catch {
    return emptySnapshot(
      "error",
      "Sosyal veriler güvenli biçimde yüklenemedi. Migration ve RLS kurulumunu kontrol et.",
    );
  }
}
