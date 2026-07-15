import { ArcadeLoader } from "@/components/ui/loading-primitives";

export function LoadingScreen({ label = "Sistem başlatılıyor" }: { label?: string }) {
  return (
    <div className="grid min-h-[55vh] place-items-center px-6">
      <ArcadeLoader label={label} />
    </div>
  );
}
