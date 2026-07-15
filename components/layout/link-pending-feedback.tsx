"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

export function LinkPendingFeedback({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending ? (
        <span className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden bg-cyan/10" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 w-2/5 animate-[shimmer_900ms_linear_infinite] bg-gradient-to-r from-transparent via-cyan to-lime" />
        </span>
      ) : null}
      <span className={cn("contents", pending && "[&>svg]:animate-pulse [&>svg]:text-cyan")}>{children}</span>
      <span className="sr-only" role="status" aria-live="polite">{pending ? `${label} yükleniyor` : ""}</span>
    </>
  );
}
