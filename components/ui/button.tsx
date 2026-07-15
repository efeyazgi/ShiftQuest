import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "arcade-button inline-flex items-center justify-center gap-2 rounded-lg font-display text-xs font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-lime text-ink shadow-lime hover:-translate-y-0.5 hover:bg-white",
        variant === "secondary" && "border border-cyan/35 bg-cyan/10 text-cyan hover:border-cyan hover:bg-cyan/20",
        variant === "ghost" && "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 hover:text-white",
        variant === "danger" && "border border-coral/40 bg-coral/10 text-coral hover:bg-coral/20",
        size === "sm" && "min-h-9 px-3 py-2",
        size === "md" && "min-h-11 px-5 py-3",
        size === "lg" && "min-h-14 px-7 py-4 text-sm",
        className,
      )}
      {...props}
    />
  );
}
