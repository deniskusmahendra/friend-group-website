"use client";

import Link from "next/link";
import { Gamepad2, MapPin } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { useMe } from "@/components/me-provider";
import { EmptyState } from "@/components/page-header";
import { PhotoGrid } from "@/components/photo-grid";
import { usePhotoLibrary } from "@/features/albums/photo-library";
import { LiveBadge } from "@/components/event-bits";
import { byStart, formatWhen, isLive, isUpcoming, relativeTime } from "@/lib/time";
import { useCollection } from "@/lib/use-collection";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { members, nameOf } from "@/content/members";

export function Crew() {
  const { me } = useMe();
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
      {members.map((m) => (
        <div
          key={m.id}
          style={{ "--c": m.color } as React.CSSProperties}
          className={cn(
            "flex flex-col items-center gap-2.5 rounded-2xl border bg-card px-2 pt-4 pb-3 font-semibold transition duration-200 hover:-translate-y-1 hover:border-(--c) hover:shadow-[0_8px_30px_-10px_var(--c)] sm:max-w-32 sm:flex-[1_0_6rem]",
            m.id === me && "border-(--c)",
          )}
        >
          <MemberAvatar id={m.id} size="xl" className="max-sm:size-16 ring-offset-card" />
          <span>
            {m.name}
            {m.id === me && <span className="font-normal text-muted-foreground"> (you)</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-pixel text-base font-bold">{title}</h2>
        <Link href={href} className="text-sm text-neon-cyan hover:underline">
          see all →
        </Link>
      </div>
      {children}
    </section>
  );
}

const rowClass = "flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent";

export function ComingUp() {
  const hangouts = useCollection("hangouts");
  const sessions = useCollection("sessions");
  const now = useNow();
  const ready = !hangouts.loading && !sessions.loading && now !== null;

  const events = ready
    ? [
        ...hangouts.rows.filter((h) => isUpcoming(h, now)).map((h) => ({ ...h, label: h.title, href: "/hangouts", icon: MapPin })),
        ...sessions.rows.filter((s) => isUpcoming(s, now)).map((s) => ({ ...s, label: s.game, href: "/gaming", icon: Gamepad2 })),
      ]
        .sort(byStart)
        .slice(0, 4)
    : [];

  return (
    <Panel title="Coming up" href="/hangouts">
      {!ready ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted/50" />
      ) : events.length ? (
        <ul className="grid gap-1">
          {events.map(({ id, label, href, icon: Icon, ...ev }) => (
            <li key={id}>
              <Link href={href} className={rowClass}>
                <Icon className="size-5 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-col">
                  <b className="truncate">{label}</b>
                  <span className="text-sm text-muted-foreground">
                    {isLive(ev, now) ? <LiveBadge /> : relativeTime(ev.when, now)} · {formatWhen(ev.when)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState emoji="🦗">Nothing planned yet. Be the one who starts it!</EmptyState>
      )}
    </Panel>
  );
}

export function FreshWishes() {
  const { rows, loading } = useCollection("wishes");
  const latest = [...rows].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <Panel title="Fresh wishes" href="/wishes">
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted/50" />
      ) : latest.length ? (
        <ul className="grid gap-1">
          {latest.map((w) => (
            <li key={w.id}>
              <Link href="/wishes" className={rowClass}>
                <MemberAvatar id={w.owner} size="sm" className="ring-offset-card" />
                <span className="flex min-w-0 flex-col">
                  <b className="truncate">{w.text}</b>
                  <span className="text-sm text-muted-foreground">
                    {w.kind === "goal" ? "🎯 goal" : "🌠 wish"} · {nameOf(w.owner)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState emoji="🌠">No wishes yet. Make the first one!</EmptyState>
      )}
    </Panel>
  );
}

/** Latest 6 photos, uploads first */
export function Memories() {
  const { all } = usePhotoLibrary();
  return <PhotoGrid photos={all.slice(0, 6)} variant="strip" />;
}
