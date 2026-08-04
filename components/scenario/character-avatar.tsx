import {
  BriefcaseBusiness,
  ClipboardCheck,
  FlaskConical,
  HardHat,
  Laptop,
  Presentation,
  ShieldCheck,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/components/ui/cn";
import type { ScenarioCharacter } from "@/types";

type AvatarStyle = {
  icon: LucideIcon;
  gradient: string;
  accent: string;
};

const avatarStyles: Record<string, AvatarStyle> = {
  maya: { icon: Presentation, gradient: "from-fuchsia-500/35 via-violet-500/20 to-cyan-500/15", accent: "text-fuchsia-200" },
  daniel: { icon: BriefcaseBusiness, gradient: "from-cyan-500/35 via-sky-500/20 to-blue-500/15", accent: "text-cyan-100" },
  emre: { icon: HardHat, gradient: "from-amber-500/35 via-orange-500/20 to-red-500/10", accent: "text-amber-100" },
  lena: { icon: HardHat, gradient: "from-orange-500/30 via-amber-500/20 to-lime-500/10", accent: "text-orange-100" },
  sofia: { icon: ClipboardCheck, gradient: "from-emerald-500/35 via-teal-500/20 to-cyan-500/10", accent: "text-emerald-100" },
  kerem: { icon: FlaskConical, gradient: "from-teal-500/35 via-cyan-500/20 to-blue-500/10", accent: "text-teal-100" },
  nora: { icon: FlaskConical, gradient: "from-violet-500/35 via-fuchsia-500/20 to-cyan-500/10", accent: "text-violet-100" },
  alex: { icon: HardHat, gradient: "from-lime-500/30 via-emerald-500/20 to-cyan-500/10", accent: "text-lime-100" },
  sam: { icon: ShieldCheck, gradient: "from-orange-500/35 via-red-500/20 to-amber-500/10", accent: "text-orange-100" },
  aylin: { icon: Wrench, gradient: "from-sky-500/35 via-cyan-500/20 to-emerald-500/10", accent: "text-sky-100" },
  riley: { icon: BriefcaseBusiness, gradient: "from-indigo-500/35 via-violet-500/20 to-fuchsia-500/10", accent: "text-indigo-100" },
  james: { icon: Laptop, gradient: "from-blue-500/35 via-indigo-500/20 to-cyan-500/10", accent: "text-blue-100" },
};

export function CharacterAvatar({
  character,
  size = "compact",
  online = false,
}: {
  character: ScenarioCharacter;
  size?: "compact" | "hero";
  online?: boolean;
}) {
  const style = avatarStyles[character.avatar] ?? {
    icon: UserRound,
    gradient: "from-cyan-500/30 via-slate-500/20 to-blue-500/10",
    accent: "text-cyan-100",
  };
  const RoleIcon = style.icon;
  const initial = character.name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?";
  const hero = size === "hero";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate grid shrink-0 place-items-center overflow-hidden border border-white/15 bg-[#102b39] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]",
        hero ? "h-28 w-28 rounded-3xl" : "h-11 w-11 rounded-xl",
      )}
    >
      <span className={cn("absolute inset-0 bg-gradient-to-br", style.gradient)} />
      <span className={cn("relative font-display font-black text-white/95 drop-shadow", hero ? "text-5xl" : "text-xl")}>{initial}</span>
      <span
        className={cn(
          "absolute grid place-items-center rounded-md border border-white/15 bg-[#07131c]/90 shadow-lg backdrop-blur",
          style.accent,
          hero ? "bottom-2 right-2 h-8 w-8" : "bottom-1 right-1 h-[18px] w-[18px]",
        )}
      >
        <RoleIcon className={hero ? "h-4 w-4" : "h-2.5 w-2.5"} strokeWidth={2.2} />
      </span>
      {online ? (
        <span className={cn("absolute rounded-full border-[#0c1d28] bg-lime shadow-lime", hero ? "right-2 top-2 h-3.5 w-3.5 border-[3px]" : "right-1 top-1 h-2.5 w-2.5 border-2")} />
      ) : null}
    </div>
  );
}
