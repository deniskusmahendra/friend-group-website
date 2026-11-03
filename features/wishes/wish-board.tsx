"use client";

import { useState } from "react";
import { Check, Hourglass, Plus, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/components/member-avatar";
import { useMe } from "@/components/me-provider";
import { EmptyState, LoadingCards, PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/event-bits";
import { Field, FieldRow, FormDialog, FormSelect } from "@/components/form-dialog";
import { mutate } from "@/lib/mutate";
import { formatDay } from "@/lib/time";
import { membersIn, type Wish } from "@/lib/types";
import { useCollection } from "@/lib/use-collection";
import { cn } from "@/lib/utils";
import { getMember, nameOf, type MemberId } from "@/content/members";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "wish", label: "🌠 Wishes" },
  { value: "goal", label: "🎯 Goals" },
  { value: "mine", label: "🙋 Mine" },
  { value: "done", label: "✅ Done" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function matches(w: Wish, filter: Filter, me: MemberId | null) {
  switch (filter) {
    case "done":
      return w.done;
    case "mine":
      return w.owner === me;
    case "wish":
    case "goal":
      return w.kind === filter && !w.done;
    default:
      return true;
  }
}

export function WishBoard() {
  const { me, requireMe } = useMe();
  const { rows, loading } = useCollection("wishes");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);

  const list = rows
    .filter((w) => matches(w, filter, me))
    .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);

  return (
    <>
      <PageHeader
        title="Wishes & goals"
        description="Say it out loud, the gang will hold you to it."
        action={
          <Button size="lg" onClick={() => requireMe() && setCreating(true)}>
            <Plus /> Make a wish
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter wishes">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className="rounded-full border bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground aria-selected:border-primary aria-selected:bg-primary/15 aria-selected:text-foreground"
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingCards count={3} />
        </div>
      ) : list.length ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {list.map((w) => (
            <WishCard key={w.id} wish={w} />
          ))}
        </div>
      ) : (
        <EmptyState emoji="✨">Nothing here yet.</EmptyState>
      )}

      <NewWishDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function WishCard({ wish: w }: { wish: Wish }) {
  const { me, requireMe } = useMe();
  const cheers = membersIn(w.cheers);
  const cheered = me ? cheers.includes(me) : false;
  // Group wishes can be updated by anyone
  const canEdit = w.owner === me || (w.owner === "gang" && me !== null);
  const progress = w.done ? 100 : Math.min(100, Math.max(0, w.progress || 0));
  const color = getMember(w.owner)?.color ?? "#888";

  const cheer = () => {
    const who = requireMe();
    if (!who) return;
    mutate((s) => s.update("wishes", w.id, { [`cheers.${who}`]: cheered ? null : true }));
  };

  const setDone = (done: boolean) =>
    mutate((s) => s.update("wishes", w.id, done ? { done, progress: 100 } : { done }), done ? "Achieved! 🎉" : undefined);

  return (
    <article
      style={{ "--c": color } as React.CSSProperties}
      className={cn(
        "mb-4 flex break-inside-avoid flex-col gap-3 rounded-2xl border border-(--c)/35 bg-linear-160 from-(--c)/14 via-card to-card p-5",
        w.done && "opacity-75",
      )}
    >
      <div className="flex gap-1.5">
        <Badge variant="secondary">{w.kind === "goal" ? "🎯 Goal" : "🌠 Wish"}</Badge>
        {w.done && <Badge className="bg-neon-green/15 text-neon-green">✅ Achieved</Badge>}
      </div>
      <p className={cn("text-lg leading-snug font-semibold wrap-anywhere whitespace-pre-wrap", w.done && "line-through decoration-(--c)")}>
        {w.text}
      </p>
      {w.target && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Hourglass className="size-3.5" /> by {formatDay(w.target)}
        </p>
      )}

      {w.kind === "goal" && (
        <div className="grid gap-2">
          {canEdit && !w.done ? (
            <Slider
              aria-label="Progress"
              defaultValue={progress}
              step={5}
              className="py-1.5 **:data-[slot=slider-range]:bg-linear-to-r **:data-[slot=slider-range]:from-(--c) **:data-[slot=slider-range]:to-neon-cyan **:data-[slot=slider-thumb]:size-4 **:data-[slot=slider-track]:h-2!"
              onValueCommitted={(v) => {
                const value = Number(v);
                mutate(
                  (s) => s.update("wishes", w.id, { progress: value, done: value >= 100 }),
                  value >= 100 ? "Achieved! 🎉" : undefined,
                );
              }}
            />
          ) : (
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-linear-to-r from-(--c) to-neon-cyan" style={{ width: `${progress}%` }} />
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {progress}%{canEdit && !w.done && " · drag to update"}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <MemberAvatar id={w.owner} size="sm" className="ring-offset-card" />
          {nameOf(w.owner)}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={cheer}
            aria-pressed={cheered}
            title={cheers.map(nameOf).join(", ") || "Cheer them on"}
            className="rounded-full border px-3 py-1 text-sm transition active:scale-110 aria-pressed:border-neon-pink aria-pressed:bg-neon-pink/15"
          >
            💖 {cheers.length || ""}
          </button>
          {canEdit && (
            <Button variant="ghost" size="icon-sm" aria-label={w.done ? "Mark not done" : "Mark achieved"} onClick={() => setDone(!w.done)}>
              {w.done ? <Undo2 /> : <Check />}
            </Button>
          )}
          {w.by === me && <DeleteButton onDelete={() => mutate((s) => s.remove("wishes", w.id), "Wish deleted")} />}
        </span>
      </div>
    </article>
  );
}

function NewWishDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { me } = useMe();
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Make a wish"
      submitLabel="Post"
      onSubmit={async (fd) => {
        if (!me) return false;
        return mutate(
          (s) =>
            s.add("wishes", {
              kind: fd.get("kind") === "goal" ? "goal" : "wish",
              text: String(fd.get("text")).trim(),
              owner: fd.get("owner") === "gang" ? "gang" : me,
              target: String(fd.get("target") ?? ""),
              progress: 0,
              done: false,
              by: me,
              cheers: {},
            }),
          "Wish sent into the universe 🌠",
        );
      }}
    >
      <fieldset className="grid grid-cols-2 gap-1 rounded-xl border bg-background/60 p-1">
        <legend className="sr-only">Type</legend>
        {[
          { value: "wish", label: "🌠 Wish" },
          { value: "goal", label: "🎯 Goal" },
        ].map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name="kind" value={o.value} defaultChecked={o.value === "wish"} className="peer sr-only" />
            <span className="block rounded-lg py-1.5 text-center text-sm font-semibold text-muted-foreground peer-checked:bg-accent peer-checked:text-foreground peer-checked:ring-1 peer-checked:ring-primary peer-focus-visible:outline-2 peer-focus-visible:outline-ring">
              {o.label}
            </span>
          </label>
        ))}
      </fieldset>
      <Field label="What is it?" htmlFor="w-text">
        <Textarea id="w-text" name="text" required rows={3} maxLength={200} placeholder="Trip to Bali together before graduation" autoFocus />
      </Field>
      <FieldRow>
        <Field label="For" htmlFor="w-owner">
          <FormSelect
            id="w-owner"
            name="owner"
            defaultValue="me"
            items={[
              { value: "me", label: `Me (${nameOf(me)})` },
              { value: "gang", label: "The whole gang" },
            ]}
          />
        </Field>
        <Field label="Target date" htmlFor="w-target">
          <Input id="w-target" name="target" type="date" />
        </Field>
      </FieldRow>
    </FormDialog>
  );
}
