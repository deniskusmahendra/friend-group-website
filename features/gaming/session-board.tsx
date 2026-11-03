"use client";

import { useState } from "react";
import { Clock, ExternalLink, Gamepad2, Headphones, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvatarStack, MemberAvatar } from "@/components/member-avatar";
import { useMe } from "@/components/me-provider";
import { EmptyState, LoadingCards, PageHeader } from "@/components/page-header";
import { CalendarButton, DateBadge, DeleteButton, LiveBadge, PastToggle } from "@/components/event-bits";
import { Field, FieldRow, FormDialog, FormSelect } from "@/components/form-dialog";
import { downloadIcs, safeUrl } from "@/lib/ics";
import { mutate } from "@/lib/mutate";
import { moveToTrash } from "@/lib/trash";
import { byStart, durationOptions, formatWhen, isLive, isUpcoming, relativeTime } from "@/lib/time";
import { membersIn, type Session } from "@/lib/types";
import { useCollection } from "@/lib/use-collection";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { nameOf } from "@/content/members";
import { games } from "@/content/site";

export function SessionBoard() {
  const { requireMe } = useMe();
  const { rows, loading } = useCollection("sessions");
  const now = useNow();
  const [creating, setCreating] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const ready = !loading && now !== null;
  const upcoming = ready ? rows.filter((s) => isUpcoming(s, now)).sort(byStart) : [];
  const past = ready ? rows.filter((s) => !isUpcoming(s, now)).sort((a, b) => byStart(b, a)) : [];

  return (
    <>
      <PageHeader
        title="Gaming"
        description="Schedule a session, see who's in."
        action={
          <Button size="lg" onClick={() => requireMe() && setCreating(true)}>
            <Plus /> Schedule session
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {!ready ? (
          <LoadingCards />
        ) : upcoming.length ? (
          upcoming.map((s) => <SessionCard key={s.id} session={s} now={now} />)
        ) : (
          <EmptyState emoji="🕹️">No sessions scheduled. Mabar?</EmptyState>
        )}
      </div>

      <PastToggle count={past.length} shown={showPast} onToggle={() => setShowPast((v) => !v)} />
      {showPast && ready && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {past.map((s) => (
            <SessionCard key={s.id} session={s} now={now} />
          ))}
        </div>
      )}

      <NewSessionDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function SessionCard({ session: s, now }: { session: Session; now: number }) {
  const { me, requireMe } = useMe();
  const players = membersIn(s.players);
  const joined = me ? players.includes(me) : false;
  const full = s.slots > 0 && players.length >= s.slots;
  const live = isLive(s, now);
  const upcoming = isUpcoming(s, now);
  const link = safeUrl(s.link);

  const setJoined = (join: boolean) => {
    const who = requireMe();
    if (!who) return;
    mutate((st) => st.update("sessions", s.id, { [`players.${who}`]: join || null }), join ? "You're in! 🎮" : undefined);
  };

  return (
    <article
      className={cn(
        "flex gap-4 rounded-2xl border bg-card p-5 max-sm:flex-col max-sm:gap-3",
        !upcoming && "opacity-60",
        live && "border-neon-red shadow-[0_0_30px_-10px_var(--neon-red)]",
      )}
    >
      <DateBadge when={s.when} tone="blue" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Gamepad2 className="size-5 text-neon-blue" /> {s.game} {live && <LiveBadge />}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" /> {formatWhen(s.when)} · {live ? "on now" : relativeTime(s.when, now)}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Headphones className="size-4" /> {s.platform}
          {link && (
            <>
              ·
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-neon-cyan hover:underline">
                join link <ExternalLink className="size-3" />
              </a>
            </>
          )}
        </p>
        {s.notes && <p className="rounded-lg bg-background/60 px-3 py-2 text-sm whitespace-pre-wrap">{s.notes}</p>}

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            Players {players.length}
            {s.slots > 0 && ` / ${s.slots}`} <AvatarStack ids={players} />
          </span>
          {s.slots > 0 && (
            <div className="flex gap-1">
              {Array.from({ length: s.slots }, (_, i) => (
                <i
                  key={i}
                  className={cn(
                    "h-1.5 max-w-7 flex-1 rounded-full bg-border",
                    i < players.length && "bg-neon-blue shadow-[0_0_6px_var(--neon-blue)]",
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="flex items-center gap-1">
            {upcoming &&
              (joined ? (
                <Button variant="outline" size="sm" onClick={() => setJoined(false)}>
                  Leave
                </Button>
              ) : (
                <Button size="sm" disabled={full} onClick={() => setJoined(true)}>
                  {full ? "Full" : "🎮 I'm in"}
                </Button>
              ))}
            {upcoming && (
              <CalendarButton
                onClick={() =>
                  downloadIcs({
                    title: `🎮 ${s.game}`,
                    when: s.when,
                    duration: s.duration,
                    location: link || s.platform,
                    description: s.notes,
                  })
                }
              />
            )}
            {s.by === me && <DeleteButton onDelete={() => moveToTrash("sessions", s.id, me, "Session")} />}
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MemberAvatar id={s.by} size="xs" ring={false} /> host: {nameOf(s.by)}
          </span>
        </div>
      </div>
    </article>
  );
}

const platforms = ["Discord voice", "Discord stream", "In-game voice", "In person"].map((p) => ({ value: p, label: p }));

function NewSessionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { me } = useMe();
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule a session"
      submitLabel="Schedule"
      onSubmit={async (fd) => {
        if (!me) return false;
        return mutate(
          (s) =>
            s.add("sessions", {
              game: String(fd.get("game")).trim(),
              when: String(fd.get("when")),
              duration: Number(fd.get("duration")),
              platform: String(fd.get("platform")),
              slots: Math.max(0, Math.min(20, Number(fd.get("slots")) || 0)),
              link: safeUrl(String(fd.get("link"))),
              notes: String(fd.get("notes")).trim(),
              by: me,
              players: { [me]: true },
            }),
          "Session scheduled 🎮",
        );
      }}
    >
      <Field label="Game" htmlFor="s-game">
        <Input id="s-game" name="game" required maxLength={60} list="games" placeholder="Valorant" autoFocus />
        <datalist id="games">
          {games.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </Field>
      <FieldRow>
        <Field label="When?" htmlFor="s-when">
          <Input id="s-when" name="when" type="datetime-local" required />
        </Field>
        <Field label="How long?" htmlFor="s-duration">
          <FormSelect id="s-duration" name="duration" items={durationOptions} defaultValue="120" />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Where?" htmlFor="s-platform">
          <FormSelect id="s-platform" name="platform" items={platforms} defaultValue="Discord voice" />
        </Field>
        <Field label="Max players" htmlFor="s-slots" hint="0 = no limit">
          <Input id="s-slots" name="slots" type="number" min={0} max={20} defaultValue={5} />
        </Field>
      </FieldRow>
      <Field label="Discord / invite link" htmlFor="s-link">
        <Input id="s-link" name="link" type="url" placeholder="https://discord.gg/…" />
      </Field>
      <Field label="Notes" htmlFor="s-notes">
        <Textarea id="s-notes" name="notes" rows={2} maxLength={300} placeholder="ranked or unrated? bring snacks?" />
      </Field>
    </FormDialog>
  );
}
