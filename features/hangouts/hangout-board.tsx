"use client";

import { useState } from "react";
import { Clock, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvatarStack, MemberAvatar } from "@/components/member-avatar";
import { useMe } from "@/components/me-provider";
import { EmptyState, LoadingCards, PageHeader } from "@/components/page-header";
import { CalendarButton, DateBadge, DeleteButton, LiveBadge, PastToggle } from "@/components/event-bits";
import { Field, FieldRow, FormDialog, FormSelect } from "@/components/form-dialog";
import { downloadIcs } from "@/lib/ics";
import { mutate } from "@/lib/mutate";
import { byStart, durationOptions, formatWhen, isLive, isUpcoming, relativeTime } from "@/lib/time";
import { membersIn, type Hangout, type RsvpStatus } from "@/lib/types";
import { useCollection } from "@/lib/use-collection";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { nameOf } from "@/content/members";

export function HangoutBoard() {
  const { requireMe } = useMe();
  const { rows, loading } = useCollection("hangouts");
  const now = useNow();
  const [creating, setCreating] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const ready = !loading && now !== null;
  const upcoming = ready ? rows.filter((h) => isUpcoming(h, now)).sort(byStart) : [];
  const past = ready ? rows.filter((h) => !isUpcoming(h, now)).sort((a, b) => byStart(b, a)) : [];

  return (
    <>
      <PageHeader
        title="Hangouts"
        description="Plan it here so it actually happens."
        action={
          <Button size="lg" onClick={() => requireMe() && setCreating(true)}>
            <Plus /> Plan a hangout
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {!ready ? (
          <LoadingCards />
        ) : upcoming.length ? (
          upcoming.map((h) => <HangoutCard key={h.id} hangout={h} now={now} />)
        ) : (
          <EmptyState emoji="🛋️">No hangouts planned. Nongki kapan nih?</EmptyState>
        )}
      </div>

      <PastToggle count={past.length} shown={showPast} onToggle={() => setShowPast((s) => !s)} />
      {showPast && ready && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {past.map((h) => (
            <HangoutCard key={h.id} hangout={h} now={now} />
          ))}
        </div>
      )}

      <NewHangoutDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "going", label: "🙋 Going" },
  { value: "maybe", label: "🤔 Maybe" },
  { value: "no", label: "😢 Can't" },
];

function HangoutCard({ hangout: h, now }: { hangout: Hangout; now: number }) {
  const { me, requireMe } = useMe();
  const upcoming = isUpcoming(h, now);
  const mine = me ? h.rsvp?.[me] : null;
  const withStatus = (status: RsvpStatus) => membersIn(h.rsvp).filter((id) => h.rsvp[id] === status);
  const going = withStatus("going");
  const maybe = withStatus("maybe");
  const cant = withStatus("no");

  const rsvp = (status: RsvpStatus) => {
    const who = requireMe();
    if (!who) return;
    mutate((s) => s.update("hangouts", h.id, { [`rsvp.${who}`]: mine === status ? null : status }));
  };

  return (
    <article className={cn("flex gap-4 rounded-2xl border bg-card p-5 max-sm:flex-col max-sm:gap-3", !upcoming && "opacity-60")}>
      <DateBadge when={h.when} />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h3 className="text-lg font-bold">{h.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" /> {formatWhen(h.when)} ·{" "}
          {isLive(h, now) ? <LiveBadge>NOW</LiveBadge> : relativeTime(h.when, now)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {h.place ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.place)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan hover:underline"
            >
              {h.place}
            </a>
          ) : (
            "place TBD"
          )}
        </p>
        {h.notes && <p className="rounded-lg bg-background/60 px-3 py-2 text-sm whitespace-pre-wrap">{h.notes}</p>}

        {upcoming && (
          <div className="grid grid-cols-3 gap-1 rounded-xl border bg-background/60 p-1">
            {RSVP_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => rsvp(o.value)}
                aria-pressed={mine === o.value}
                className="rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-accent aria-pressed:text-foreground aria-pressed:ring-1 aria-pressed:ring-primary"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            Going ({going.length}) <AvatarStack ids={going} />
          </span>
          {maybe.length > 0 && (
            <span className="flex items-center gap-2">
              Maybe <AvatarStack ids={maybe} />
            </span>
          )}
          {cant.length > 0 && (
            <span className="flex items-center gap-2">
              Can&apos;t <AvatarStack ids={cant} />
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MemberAvatar id={h.by} size="xs" ring={false} /> planned by {nameOf(h.by)}
          </span>
          <span className="flex items-center gap-1">
            {upcoming && (
              <CalendarButton
                onClick={() =>
                  downloadIcs({ title: h.title, when: h.when, duration: h.duration, location: h.place, description: h.notes })
                }
              />
            )}
            {h.by === me && (
              <DeleteButton onDelete={() => mutate((s) => s.remove("hangouts", h.id), "Hangout deleted")} />
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

function NewHangoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { me } = useMe();
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Plan a hangout"
      submitLabel="Post plan"
      onSubmit={async (fd) => {
        if (!me) return false;
        return mutate(
          (s) =>
            s.add("hangouts", {
              title: String(fd.get("title")).trim(),
              place: String(fd.get("place")).trim(),
              when: String(fd.get("when")),
              duration: Number(fd.get("duration")),
              notes: String(fd.get("notes")).trim(),
              by: me,
              rsvp: { [me]: "going" },
            }),
          "Hangout posted 📍",
        );
      }}
    >
      <Field label="What's the plan?" htmlFor="h-title">
        <Input id="h-title" name="title" required maxLength={80} placeholder="Nonton + makan malam" autoFocus />
      </Field>
      <Field label="Where?" htmlFor="h-place">
        <Input id="h-place" name="place" maxLength={100} placeholder="Grand Indonesia" />
      </Field>
      <FieldRow>
        <Field label="When?" htmlFor="h-when">
          <Input id="h-when" name="when" type="datetime-local" required />
        </Field>
        <Field label="How long?" htmlFor="h-duration">
          <FormSelect id="h-duration" name="duration" items={durationOptions} defaultValue="180" />
        </Field>
      </FieldRow>
      <Field label="Notes" htmlFor="h-notes">
        <Textarea id="h-notes" name="notes" rows={3} maxLength={500} placeholder="budget, dress code, who's driving…" />
      </Field>
    </FormDialog>
  );
}
