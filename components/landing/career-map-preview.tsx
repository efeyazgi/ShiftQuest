import {
  BadgeCheck,
  Building2,
  FlaskConical,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const mapNodes = [
  {
    label: "Office Hub",
    meta: "02 missions",
    icon: Building2,
    status: "complete",
    position: "left-[8%] top-[52%]",
  },
  {
    label: "Production",
    meta: "Current shift",
    icon: RadioTower,
    status: "current",
    position: "left-[35%] top-[23%]",
  },
  {
    label: "Quality Lab",
    meta: "160 XP",
    icon: FlaskConical,
    status: "locked",
    position: "right-[8%] top-[17%]",
  },
  {
    label: "Safety Zone",
    meta: "240 XP",
    icon: ShieldCheck,
    status: "locked",
    position: "right-[13%] bottom-[9%]",
  },
] as const;

export function CareerMapPreview() {
  return (
    <div className="relative mx-auto min-h-[440px] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#07141e] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-arcade-grid bg-[size:44px_44px] opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_38%,rgba(85,246,255,0.16),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(199,255,74,0.1),transparent_32%)]" />

      <div className="absolute left-[17%] top-[56%] h-[3px] w-[28%] -rotate-[32deg] bg-gradient-to-r from-cyan/70 to-cyan/20 shadow-[0_0_14px_rgba(85,246,255,0.55)]" />
      <div className="absolute left-[44%] top-[31%] h-[3px] w-[33%] -rotate-[4deg] bg-gradient-to-r from-cyan/50 to-white/10" />
      <div className="absolute left-[51%] top-[53%] h-[3px] w-[34%] rotate-[27deg] bg-gradient-to-r from-white/10 to-white/5" />

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-black/15 px-5 py-4 sm:px-7">
        <div>
          <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-white">
            Campus network
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/40">
            Career map / sector 01
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-lime/20 bg-lime/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-lime">
          <span className="size-1.5 animate-pulse rounded-full bg-lime" />
          Live route
        </div>
      </div>

      <div className="absolute bottom-5 left-5 z-10 rounded-xl border border-white/10 bg-ink/80 px-4 py-3 backdrop-blur sm:left-7">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Rank progress</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-display text-xs font-black text-white">Graduate Engineer</span>
          <span className="text-[10px] font-bold text-lime">120 / 200 XP</span>
        </div>
        <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-cyan to-lime shadow-[0_0_12px_rgba(199,255,74,0.45)]" />
        </div>
      </div>

      {mapNodes.map((node) => {
        const Icon = node.icon;
        const isCurrent = node.status === "current";
        const isComplete = node.status === "complete";
        return (
          <div key={node.label} className={`absolute z-20 ${node.position}`}>
            {isCurrent && (
              <span className="absolute -inset-4 animate-pulse rounded-[1.4rem] border border-cyan/25" />
            )}
            <div
              className={`relative min-w-32 rounded-2xl border p-3 backdrop-blur sm:min-w-40 sm:p-4 ${
                isCurrent
                  ? "border-cyan/60 bg-cyan/15 shadow-[0_0_35px_rgba(85,246,255,0.22)]"
                  : isComplete
                    ? "border-lime/30 bg-lime/10"
                    : "border-white/10 bg-[#0b1822]/90 text-white/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`grid size-9 place-items-center rounded-xl border ${
                    isCurrent
                      ? "border-cyan/40 bg-cyan/15 text-cyan"
                      : isComplete
                        ? "border-lime/30 bg-lime/10 text-lime"
                        : "border-white/10 bg-white/5"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {isComplete ? (
                  <BadgeCheck className="size-4 text-lime" aria-hidden="true" />
                ) : isCurrent ? (
                  <Sparkles className="size-4 text-cyan" aria-hidden="true" />
                ) : (
                  <LockKeyhole className="size-4 text-white/35" aria-hidden="true" />
                )}
              </div>
              <p className="mt-3 font-display text-[11px] font-black uppercase tracking-[0.08em] text-white">
                {node.label}
              </p>
              <p className={`mt-1 text-[9px] font-bold uppercase tracking-[0.15em] ${isCurrent ? "text-cyan" : isComplete ? "text-lime" : "text-white/35"}`}>
                {node.meta}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
