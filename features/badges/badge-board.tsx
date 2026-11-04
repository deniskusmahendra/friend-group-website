"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { useMe } from "@/components/me-provider";
import { LoadingCards, PageHeader } from "@/components/page-header";
import { members, nameOf, type MemberId } from "@/content/members";
import { cn } from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import { scoreOf, tiers, useBadges, type BadgeProgress } from "@/features/badges/badges";

export function BadgeIcon({ progress, size = "md" }: { progress: BadgeProgress; size?: "sm" | "md" }) {
  const { badge, level } = progress;
  const Icon = badge.icon;
  const color = level ? tiers[level - 1].color : undefined;
  return (
    <span
      title={level ? `${badge.name} (${tiers[level - 1].name})` : badge.name}
      style={color ? ({ "--t": color } as React.CSSProperties) : undefined}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2",
        size === "md" ? "size-14 [&>svg]:size-6" : "size-8 [&>svg]:size-4",
        level
          ? "border-(--t) bg-(--t)/15 text-(--t) shadow-[0_0_14px_-4px_var(--t)]"
          : "border-dashed border-white/15 bg-white/5 text-white/25",
      )}
    >
      <Icon />
    </span>
  );
}

export function BadgeBoard() {
  const { me } = useMe();
  const now = useNow();
  const progress = useBadges(now);
  const [picked, setPicked] = useState<MemberId | null>(null);
  const selected = picked ?? me ?? members[0].id;

  if (!progress) {
    return (
      <>
        <Header />
        <div className="grid gap-3 sm:grid-cols-2">
          <LoadingCards count={2} />
        </div>
      </>
    );
  }

  const ranking = [...members].sort((a, b) => scoreOf(progress.get(b.id)!) - scoreOf(progress.get(a.id)!));
  const mine = progress.get(selected)!;

  return (
    <>
      <Header />
      <section aria-label="Leaderboard" className="flex gap-2.5 overflow-x-auto pb-2">
        {ranking.map((m, i) => {
          const p = progress.get(m.id)!;
          const earned = p.filter((x) => x.level > 0).length;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPicked(m.id)}
              aria-pressed={m.id === selected}
              style={{ "--c": m.color } as React.CSSProperties}
              className={cn(
                "flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border bg-card px-2 pt-3 pb-2.5 transition hover:border-(--c)",
                m.id === selected && "border-(--c) shadow-[0_8px_30px_-12px_var(--c)]",
              )}
            >
              <span className="font-pixel text-xs text-muted-foreground">#{i + 1}</span>
              <MemberAvatar id={m.id} size="lg" className="ring-offset-card" />
              <span className="text-sm font-semibold">{m.name}</span>
              <span className="text-xs text-muted-foreground">
                🏅 {earned} · {scoreOf(p)} pts
              </span>
            </button>
          );
        })}
      </section>

      <h2 className="mt-8 mb-4 flex items-center gap-2.5 font-pixel text-xl font-bold text-white">
        <MemberAvatar id={selected} size="sm" ring={false} />
        {nameOf(selected)}
        {selected === me && <span className="font-sans text-sm font-normal text-muted-foreground">(you)</span>}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mine.map((p) => (
          <BadgeCard key={p.badge.id} progress={p} />
        ))}
      </div>
    </>
  );
}

function Header() {
  return (
    <PageHeader
      title="Badges"
      description="Earned by showing up, playing, sharing and cheering. Bronze, silver, then gold."
    />
  );
}

function BadgeCard({ progress }: { progress: BadgeProgress }) {
  const { badge, count, level, next } = progress;
  const from = level ? badge.levels[level - 1] : 0;
  const pct = next === null ? 100 : Math.min(100, ((count - from) / (next - from)) * 100);
  const tier = level ? tiers[level - 1] : null;

  return (
    <div className={cn("flex gap-3.5 rounded-2xl border bg-card p-4", !level && "opacity-80")}>
      <BadgeIcon progress={progress} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <b className="truncate">{badge.name}</b>
          {tier ? (
            <span className="text-xs font-bold tracking-wide uppercase" style={{ color: tier.color }}>
              {tier.name}
            </span>
          ) : (
            <Lock className="size-3.5 text-muted-foreground" aria-label="Locked" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{badge.how}</p>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: tier && next === null ? tier.color : next !== null ? tiers[level].color : undefined }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {next === null ? `${count} · maxed` : `${count} / ${next}`}
          </span>
        </div>
      </div>
    </div>
  );
}
