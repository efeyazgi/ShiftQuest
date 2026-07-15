"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ProgressDashboard } from "@/components/dashboard/progress-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useGameStore } from "@/features/game/store";

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useGameStore((state) => state.hydrated);
  const profile = useGameStore((state) => state.profile);

  useEffect(() => {
    if (hydrated && !profile?.onboardingComplete) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile?.onboardingComplete) {
    return <LoadingScreen label={hydrated ? "Profil yönlendiriliyor" : "Performans verileri yükleniyor"} />;
  }

  return (
    <AppShell>
      <ProgressDashboard />
    </AppShell>
  );
}
