import { cn } from "./cn";

export function ProgressBar({ value, className, color = "lime", label }: { value: number; className?: string; color?: "lime" | "cyan" | "amber" | "coral"; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <div className="flex justify-between text-[11px] text-slate-400"><span>{label}</span><span>{Math.round(safeValue)}%</span></div> : null}
      <div className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/40" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "İlerleme"}>
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700",
            color === "lime" && "bg-lime shadow-[0_0_14px_rgba(199,255,74,.65)]",
            color === "cyan" && "bg-cyan shadow-[0_0_14px_rgba(85,246,255,.65)]",
            color === "amber" && "bg-amber shadow-[0_0_14px_rgba(255,184,77,.65)]",
            color === "coral" && "bg-coral shadow-[0_0_14px_rgba(255,107,107,.65)]",
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
