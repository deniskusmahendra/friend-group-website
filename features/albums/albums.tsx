"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/me-provider";
import { EmptyState, LoadingCards, PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/event-bits";
import { Field, FormDialog } from "@/components/form-dialog";
import { PhotoGrid } from "@/components/photo-grid";
import { mutate } from "@/lib/mutate";
import type { Album } from "@/lib/types";
import { useCollection } from "@/lib/use-collection";
import { photos, resolvePhotos } from "@/content/photos";
import { nameOf } from "@/content/members";

type AlbumView = Pick<Album, "id" | "title" | "description" | "photos"> & Partial<Pick<Album, "by">> & { builtin?: boolean };

/** Always-there album with every photo in content/photos.ts */
const TOGETHER: AlbumView = {
  id: "together",
  title: "Together",
  description: "Every pic of us, all in one place.",
  photos: photos.map((p) => p.src),
  builtin: true,
};

function useAlbums() {
  const { rows, loading } = useCollection("albums");
  const albums: AlbumView[] = [TOGETHER, ...[...rows].sort((a, b) => b.createdAt - a.createdAt)];
  return { albums, loading };
}

export function AlbumList() {
  const { requireMe } = useMe();
  const { albums, loading } = useAlbums();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Albums"
        description="Our photo collections."
        action={
          <Button size="lg" onClick={() => requireMe() && setCreating(true)}>
            <Plus /> New album
          </Button>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <AlbumCard key={a.id} album={a} eager={a.builtin} />
        ))}
        {loading && <LoadingCards count={1} />}
      </div>
      <AlbumDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function AlbumCard({ album, eager }: { album: AlbumView; eager?: boolean }) {
  const cover = resolvePhotos(album.photos).slice(0, 3);
  return (
    <Link
      href={`/albums/${album.id}`}
      className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:border-primary"
    >
      <div className="grid aspect-4/3 grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 bg-muted">
        {cover.map((p, i) => (
          <div key={p.src} className={i === 0 ? (cover.length === 1 ? "relative col-span-2 row-span-2" : "relative row-span-2") : "relative"}>
            <Image
              src={p.src}
              alt=""
              fill
              loading={eager ? "eager" : undefined}
              sizes={i === 0 ? "(min-width: 1024px) 22vw, 60vw" : "15vw"}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5 px-4 py-3.5">
        <b>{album.title}</b>
        <span className="text-sm text-muted-foreground">
          {album.photos.length} photos{album.by && ` · by ${nameOf(album.by)}`}
        </span>
      </div>
    </Link>
  );
}

export function AlbumDetail({ id }: { id: string }) {
  const router = useRouter();
  const { me, requireMe } = useMe();
  const { albums, loading } = useAlbums();
  const [editing, setEditing] = useState(false);
  const album = albums.find((a) => a.id === id);

  const back = (
    <Link href="/albums" className="mb-4 inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:underline">
      <ArrowLeft className="size-4" /> all albums
    </Link>
  );

  if (!album) {
    return (
      <>
        {back}
        {loading ? (
          <LoadingCards count={1} />
        ) : (
          <EmptyState emoji="🫥">This album doesn&apos;t exist (anymore).</EmptyState>
        )}
      </>
    );
  }

  const albumPhotos = resolvePhotos(album.photos);

  return (
    <>
      {back}
      <PageHeader
        title={album.title}
        description={album.description}
        action={
          !album.builtin && (
            <>
              <Button variant="outline" size="lg" onClick={() => requireMe() && setEditing(true)}>
                <Pencil /> Edit
              </Button>
              {album.by === me && (
                <DeleteButton
                  label="Delete album"
                  onDelete={async () => {
                    if (await mutate((s) => s.remove("albums", album.id), "Album deleted")) router.push("/albums");
                  }}
                />
              )}
            </>
          )
        }
      />
      {albumPhotos.length ? <PhotoGrid photos={albumPhotos} /> : <EmptyState emoji="🖼️">No photos in this album yet.</EmptyState>}
      {!album.builtin && <AlbumDialog open={editing} onOpenChange={setEditing} album={album} />}
    </>
  );
}

function AlbumDialog({
  open,
  onOpenChange,
  album,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album?: AlbumView;
}) {
  const router = useRouter();
  const { me } = useMe();
  const chosen = new Set(album?.photos);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={album ? "Edit album" : "New album"}
      submitLabel={album ? "Save" : "Create"}
      className="sm:max-w-2xl"
      onSubmit={async (fd) => {
        if (!me) return false;
        const data = {
          title: String(fd.get("title")).trim(),
          description: String(fd.get("description")).trim(),
          photos: fd.getAll("photos").map(String),
        };
        if (!data.photos.length) {
          toast("Pick at least one photo 📸");
          return false;
        }
        if (album) return mutate((s) => s.update("albums", album.id, data), "Album saved");

        let newId = "";
        const ok = await mutate(async (s) => (newId = await s.add("albums", { ...data, by: me })), "Album created 📸");
        if (ok) router.push(`/albums/${newId}`);
        return ok;
      }}
    >
      <Field label="Name" htmlFor="a-title">
        <Input id="a-title" name="title" required maxLength={60} placeholder="Bukber 2026" defaultValue={album?.title} autoFocus />
      </Field>
      <Field label="Description" htmlFor="a-desc">
        <Input id="a-desc" name="description" maxLength={140} placeholder="optional" defaultValue={album?.description} />
      </Field>
      <Field label="Photos">
        <div className="max-h-80 overflow-y-auto rounded-lg">
          <div className="grid grid-cols-3 gap-2 p-0.5 sm:grid-cols-4">
          {photos.map((p) => (
            <label key={p.src} className="relative aspect-square cursor-pointer overflow-hidden rounded-lg">
              <input
                type="checkbox"
                name="photos"
                value={p.src}
                defaultChecked={chosen.has(p.src)}
                className="peer absolute top-1.5 left-1.5 z-10 size-4 accent-primary"
              />
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="150px"
                className="object-cover opacity-45 transition peer-checked:opacity-100"
              />
              <span className="pointer-events-none absolute inset-0 rounded-lg ring-primary ring-inset peer-checked:ring-3" />
            </label>
          ))}
          </div>
        </div>
      </Field>
    </FormDialog>
  );
}
