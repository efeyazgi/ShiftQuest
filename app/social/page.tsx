import { AppShell } from "@/components/layout/app-shell";
import { SocialHub } from "@/components/social/social-hub";
import { getSocialSnapshot } from "@/lib/social/server";

type SocialPageProps = {
  searchParams: Promise<{ invite?: string | string[] }>;
};

export default async function SocialPage({ searchParams }: SocialPageProps) {
  const [snapshot, query] = await Promise.all([
    getSocialSnapshot(),
    searchParams,
  ]);
  const inviteValue = Array.isArray(query.invite) ? query.invite[0] : query.invite;
  const inviteToken = inviteValue?.trim().slice(0, 200) ?? "";

  return (
    <AppShell>
      <SocialHub
        key={`${snapshot.profile?.updatedAt ?? "new"}:${snapshot.friends.length}:${snapshot.blockedUserIds.length}`}
        snapshot={snapshot}
        inviteToken={inviteToken}
      />
    </AppShell>
  );
}
