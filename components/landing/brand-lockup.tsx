import Image from "next/image";

import { brand } from "@/config/brand";

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-cyan/30 bg-cyan/10 shadow-[0_0_28px_rgba(85,246,255,0.14)]">
        <Image
          src="/shiftquest-mark.svg"
          alt=""
          width={40}
          height={40}
          className="size-9"
          priority
        />
        <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white/40" />
      </span>
      <span className={compact ? "hidden sm:block" : "block"}>
        <span className="block font-display text-sm font-black uppercase leading-none tracking-[0.12em] text-white">
          {brand.name}
        </span>
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-cyan/70">
          {brand.subtitle}
        </span>
      </span>
    </span>
  );
}
