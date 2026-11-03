"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DateBadge({ when, tone = "red" }: { when: string; tone?: "red" | "blue" }) {
  const d = new Date(when);
  return (
    <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border bg-background/60 max-sm:h-auto max-sm:w-auto max-sm:flex-row max-sm:gap-2 max-sm:self-start max-sm:px-3 max-sm:py-1">
      <span className={cn("font-pixel text-[11px] uppercase", tone === "red" ? "text-neon-red" : "text-neon-blue")}>
        {d.toLocaleString(undefined, { month: "short" })}
      </span>
      <b className="text-2xl leading-none max-sm:text-lg">{d.getDate()}</b>
    </div>
  );
}

export function LiveBadge({ children = "LIVE" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-block animate-pulse rounded-md bg-neon-red px-2 py-0.5 align-middle font-pixel text-[11px] text-white shadow-[0_0_14px_var(--neon-red)]">
      {children}
    </span>
  );
}

/** Two-step delete: first click asks, second click deletes. */
export function DeleteButton({ onDelete, label = "Delete" }: { onDelete: () => void; label?: string }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <Button
      type="button"
      variant={confirming ? "destructive" : "ghost"}
      size={confirming ? "sm" : "icon-sm"}
      aria-label={label}
      onClick={() => (confirming ? onDelete() : setConfirming(true))}
    >
      <Trash2 />
      {confirming && "Sure?"}
    </Button>
  );
}

export function CalendarButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <CalendarPlus />
      Calendar
    </Button>
  );
}

export function PastToggle({ count, shown, onToggle }: { count: number; shown: boolean; onToggle: () => void }) {
  if (!count) return null;
  return (
    <div className="mt-6 flex justify-center">
      <Button variant="ghost" size="sm" onClick={onToggle}>
        {shown ? "Hide" : "Show"} past ({count})
      </Button>
    </div>
  );
}
