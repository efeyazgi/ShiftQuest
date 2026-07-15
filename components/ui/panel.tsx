import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  accent?: "cyan" | "lime" | "amber" | "coral";
  children: ReactNode;
};

export function Panel({ label, accent = "cyan", className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "panel relative overflow-hidden rounded-xl border bg-panel/90 shadow-[0_18px_55px_rgba(0,0,0,.26)] backdrop-blur-xl",
        accent === "cyan" && "border-cyan/20",
        accent === "lime" && "border-lime/20",
        accent === "amber" && "border-amber/25",
        accent === "coral" && "border-coral/25",
        className,
      )}
      {...props}
    >
      <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-current opacity-60" />
      <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-current opacity-60" />
      {label ? (
        <div className="border-b border-white/[0.06] bg-black/[0.06] px-4 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] text-slate-500">
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}
