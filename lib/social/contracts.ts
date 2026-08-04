import { z } from "zod";

export const careerLevels = [
  "student",
  "entry",
  "mid",
  "senior",
  "lead",
  "manager",
  "executive",
] as const;

export type CareerLevel = (typeof careerLevels)[number];
export type ProfileVisibility = "private" | "friends";

export const socialProfileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  industry: z.string().trim().min(2).max(80),
  professionalRole: z.string().trim().min(2).max(80),
  careerLevel: z.enum(careerLevels),
  profileVisibility: z.enum(["private", "friends"]),
  leaderboardOptIn: z.boolean(),
  achievementCountOptIn: z.boolean(),
});

export type SocialProfileInput = z.infer<typeof socialProfileInputSchema>;

export type SocialProfileView = SocialProfileInput & {
  userId: string;
  updatedAt: string;
};

export type SocialFriendView = {
  userId: string;
  displayName: string;
  industry?: string;
  professionalRole?: string;
  careerLevel?: CareerLevel;
  profileShared: boolean;
  acceptedAt: string;
  verifiedAchievementCount?: number;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  verifiedXp: number;
  completedScenarios: number;
  verifiedAchievementCount?: number;
  isCurrentUser: boolean;
};

export type SocialSnapshot = {
  status: "ready" | "not-configured" | "signed-out" | "error";
  canMutate: boolean;
  message?: string;
  currentUserId?: string;
  profile: SocialProfileView | null;
  friends: SocialFriendView[];
  blockedUserIds: string[];
  leaderboard: LeaderboardEntry[];
  activeInviteCount: number;
};

export type SocialActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };
