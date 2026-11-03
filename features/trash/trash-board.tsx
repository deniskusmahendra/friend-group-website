"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Download, Gamepad2, Images, MapPin, RotateCcw, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { EmptyState, LoadingCards, PageHeader } from "@/components/page-header";
import { nameOf } from "@/content/members";
import { daysLeft, downloadBackup, restoreBackup, restoreFromTrash, TRASH_DAYS } from "@/lib/trash";
import type { CollectionName } from "@/lib/types";
import { useCollection } from "@/lib/use-collection";
import { useNow } from "@/lib/use-now";

type Item = {
  col: CollectionName;
  id: string;
  kind: string;
  title: string;
  icon: React.ReactNode;
  deletedAt: number;
  deletedBy?: string | null;
};

function useTrash() {
  const hangouts = useCollection("hangouts");
  const sessions = useCollection("sessions");
  const wishes = useCollection("wishes");
  const albums = useCollection("albums");
  const photos = useCollection("photos");

  const items: Item[] = [
    ...hangouts.trashed.map((h) => ({ col: "hangouts" as const, id: h.id, kind: "Hangout", title: h.title, icon: <MapPin />, deletedAt: h.deletedAt!, deletedBy: h.deletedBy })),
    ...sessions.trashed.map((s) => ({ col: "sessions" as const, id: s.id, kind: "Gaming session", title: s.game, icon: <Gamepad2 />, deletedAt: s.deletedAt!, deletedBy: s.deletedBy })),
    ...wishes.trashed.map((w) => ({ col: "wishes" as const, id: w.id, kind: w.kind === "goal" ? "Goal" : "Wish", title: w.text, icon: <Sparkles />, deletedAt: w.deletedAt!, deletedBy: w.deletedBy })),
    ...albums.trashed.map((a) => ({ col: "albums" as const, id: a.id, kind: "Album", title: a.title, icon: <Images />, deletedAt: a.deletedAt!, deletedBy: a.deletedBy })),
    ...photos.trashed.map((p) => ({
      col: "photos" as const,
      id: p.id,
      kind: "Photo",
      title: `Uploaded by ${nameOf(p.by)}`,
      icon: <Image src={p.src} alt="" fill sizes="56px" className="object-cover" />,
      deletedAt: p.deletedAt!,
      deletedBy: p.deletedBy,
    })),
  ].sort((a, b) => b.deletedAt - a.deletedAt);

  const loading = [hangouts, sessions, wishes, albums, photos].some((c) => c.loading);
  return { items, loading };
}

export function TrashBoard() {
  const { items, loading } = useTrash();
  const now = useNow();

  return (
    <>
      <PageHeader
        title="Trash"
        description={`Deleted things stay here for ${TRASH_DAYS} days, then they're gone for good.`}
      />
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <TrashRow key={`${item.col}/${item.id}`} item={item} now={now} />
        ))}
        {loading && !items.length && <LoadingCards count={1} />}
        {!loading && !items.length && <EmptyState emoji="🗑️">Trash is empty. Nothing deleted lately.</EmptyState>}
      </div>
      <BackupCard />
    </>
  );
}

function TrashRow({ item, now }: { item: Item; now: number | null }) {
  const [busy, setBusy] = useState(false);
  const left = now === null ? null : daysLeft(item.deletedAt, now);

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground [&>svg]:size-6">
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{item.kind}</div>
        <div className="truncate font-semibold">{item.title}</div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {item.deletedBy && <MemberAvatar id={item.deletedBy} size="xs" ring={false} />}
          <span>
            deleted by {nameOf(item.deletedBy)}
            {left !== null && ` · ${left === 0 ? "goes today" : `${left} day${left > 1 ? "s" : ""} left`}`}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          if (!(await restoreFromTrash(item.col, item.id))) setBusy(false);
        }}
      >
        <RotateCcw /> Restore
      </Button>
    </div>
  );
}

function BackupCard() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="mt-10 rounded-2xl border bg-card p-5">
      <h2 className="font-pixel text-xl font-bold text-white">Backup</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Download everything (hangouts, sessions, wishes, albums, photo list) as one file. If something ever gets
        wiped, restoring the file brings back whatever is missing. It never overwrites things that still exist.
        Photo files themselves aren&apos;t in the backup, so a photo deleted more than {TRASH_DAYS} days ago comes
        back without its picture.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            try {
              await downloadBackup();
            } catch (err) {
              console.error(err);
              toast.error("Couldn't make the backup. Try again?");
            }
          }}
        >
          <Download /> Download backup
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          <Upload /> {busy ? "Restoring…" : "Restore from backup"}
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              const added = await restoreBackup(file);
              toast.success(added ? `Brought back ${added} thing${added > 1 ? "s" : ""} ↩️` : "Nothing was missing, all good 👍");
            } catch (err) {
              console.error(err);
              toast.error(err instanceof Error && err.message.includes("GANG") ? err.message : "Couldn't read that backup file.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </section>
  );
}
