import { AppShell } from "@/components/layout/app-shell";
import { RouteLoading } from "@/components/ui/loading-primitives";

export default function Loading() {
  return <AppShell><RouteLoading variant="vault" /></AppShell>;
}
