"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ProgressDashboard } from "@/components/dashboard/progress-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useGameStore } from "@/features/game/store";
import { useCloudSync } from "@/features/sync/cloud-sync-provider";

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);
  const { status: cloudStatus } = useCloudSync();
  const cloudLoading = cloudStatus === "loading" || cloudStatus === "idle";

  useEffect(() => {
    if (hydrated && !cloudLoading && !profile?.onboardingComplete) router.replace("/onboarding");
  }, [cloudLoading, hydrated, profile, router]);

  if (!hydrated || cloudLoading || !profile?.onboardingComplete) {
    return <LoadingScreen label={hydrated && !cloudLoading ? "Profil yönlendiriliyor" : "Bulut ilerlemesi yükleniyor"} />;
  }

  return (
    <AppShell>
      <ProgressDashboard />
    </AppShell>
  );
}
