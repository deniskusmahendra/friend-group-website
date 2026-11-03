"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/me-provider";
import { EmptyState, LoadingCards, PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/event-bits";
import { Field, FormDialog } from "@/components/form-dialog";
import { PhotoGrid } from "@/components/photo-grid";
import { deleteUploadedPhoto, usePhotoLibrary } from "@/features/albums/photo-library";
import { UploadButton } from "@/features/albums/upload-button";
import { mutate } from "@/lib/mutate";
import type { Album } from "@/lib/types";
import { useCollection } from "@/lib/use-collection";
import { nameOf } from "@/content/members";
import type { Photo } from "@/content/photos";

type AlbumView = Pick<Album, "id" | "title" | "description" | "photos"> &
  Partial<Pick<Album, "by">> & { builtin?: boolean };

function useAlbums() {
  const { rows, loading } = useCollection("albums");
  const library = usePhotoLibrary();

  // An upload lives in the album it was uploaded into, even if that album's list misses it.
  // Older uploads have no album set, so for those: whichever custom album lists them.
  const albumIds = new Set(rows.map((a) => a.id));
  const homeOf = (p: Photo) => (p.upload?.album && (loading || albumIds.has(p.upload.album)) ? p.upload.album : undefined);
  const inCustomAlbum = (p: Photo) =>
    Boolean(homeOf(p)) || (p.upload?.album === undefined && rows.some((a) => a.photos.includes(p.src)));

  // Always-there album: built-in photos plus uploads that don't belong to a custom album
  const together: AlbumView = {
    id: "together",
    title: "Together",
    description: "All our pics. Photos uploaded to other albums stay in those albums.",
    photos: library.all.filter((p) => !inCustomAlbum(p)).map((p) => p.src),
    builtin: true,
  };
  const custom: AlbumView[] = [...rows]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((a) => {
      const home = library.all.filter((p) => homeOf(p) === a.id && !a.photos.includes(p.src)).map((p) => p.src);
      return { ...a, photos: [...home, ...a.photos] };
    });
  const albums = [together, ...custom];
  return { albums, loading, library };
}

export function AlbumList() {
  const { requireMe } = useMe();
  const { albums, loading, library } = useAlbums();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Albums"
        description="Our photo collections."
        action={
          <>
            <UploadButton />
            <Button size="lg" variant="outline" onClick={() => requireMe() && setCreating(true)}>
              <Plus /> New album
            </Button>
          </>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <AlbumCard key={a.id} album={a} photos={library.resolve(a.photos)} eager={a.builtin} />
        ))}
        {loading && <LoadingCards count={1} />}
      </div>
      <AlbumDialog open={creating} onOpenChange={setCreating} library={library.all} />
    </>
  );
}

function AlbumCard({ album, photos, eager }: { album: AlbumView; photos: Photo[]; eager?: boolean }) {
  const cover = photos.slice(0, 3);
  return (
    <Link
      href={`/albums/${album.id}`}
      className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:border-primary"
    >
      <div className="grid aspect-4/3 grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 bg-muted">
        {cover.length === 0 && <span className="col-span-2 row-span-2 grid place-items-center text-4xl">🖼️</span>}
        {cover.map((p, i) => (
          <div
            key={p.src}
            className={i === 0 ? (cover.length === 1 ? "relative col-span-2 row-span-2" : "relative row-span-2") : "relative"}
          >
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
          {photos.length} photos{album.by && ` · by ${nameOf(album.by)}`}
        </span>
      </div>
    </Link>
  );
}

export function AlbumDetail({ id }: { id: string }) {
  const router = useRouter();
  const { me, requireMe } = useMe();
  const { albums, loading, library } = useAlbums();
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
        {loading ? <LoadingCards count={1} /> : <EmptyState emoji="🫥">This album doesn&apos;t exist (anymore).</EmptyState>}
      </>
    );
  }

  const albumPhotos = library.resolve(album.photos);

  return (
    <>
      {back}
      <PageHeader
        title={album.title}
        description={album.description}
        action={
          <>
            <UploadButton albumId={album.builtin ? undefined : album.id} />
            {!album.builtin && (
              <Button variant="outline" size="lg" onClick={() => requireMe() && setEditing(true)}>
                <Pencil /> Edit
              </Button>
            )}
            {!album.builtin && album.by === me && (
              <DeleteButton
                label="Delete album"
                onDelete={async () => {
                  if (await mutate((s) => s.remove("albums", album.id), "Album deleted")) router.push("/albums");
                }}
              />
            )}
          </>
        }
      />
      {albumPhotos.length ? (
        <PhotoGrid
          photos={albumPhotos}
          renderActions={(photo, close) =>
            photo.upload?.by === me && <DeletePhotoButton photo={photo} onDeleted={close} />
          }
        />
      ) : (
        <EmptyState emoji="🖼️">No photos in this album yet. Upload some!</EmptyState>
      )}
      {!album.builtin && <AlbumDialog open={editing} onOpenChange={setEditing} album={album} library={library.all} />}
    </>
  );
}

/** Lightbox button: deletes a photo you uploaded, everywhere */
function DeletePhotoButton({ photo, onDeleted }: { photo: Photo; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="destructive"
      size={confirming ? "sm" : "icon-sm"}
      className="h-9 rounded-full bg-black/60 px-3 text-white hover:bg-destructive dark:bg-black/60"
      disabled={busy}
      aria-label="Delete photo"
      onClick={async () => {
        if (!confirming) return setConfirming(true);
        setBusy(true);
        try {
          await deleteUploadedPhoto(photo);
          toast.success("Photo deleted");
          onDeleted();
        } catch (err) {
          console.error(err);
          toast.error("Couldn't delete the photo. Try again?");
          setBusy(false);
        }
      }}
    >
      <Trash2 /> {confirming && (busy ? "Deleting…" : "Delete from every album?")}
    </Button>
  );
}

function AlbumDialog({
  open,
  onOpenChange,
  album,
  library,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  album?: AlbumView;
  library: Photo[];
}) {
  const router = useRouter();
  const { me } = useMe();
  const chosen = new Set(album?.photos);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={album ? "Edit album" : "New album"}
      description={
        album
          ? "Unticking a photo that was uploaded to this album deletes it. Other photos just leave the album."
          : "Pick existing photos, or create it empty and upload new ones."
      }
      submitLabel={album ? "Save" : "Create"}
      className="sm:max-w-2xl"
      onSubmit={async (fd) => {
        if (!me) return false;
        const data = {
          title: String(fd.get("title")).trim(),
          description: String(fd.get("description")).trim(),
          photos: fd.getAll("photos").map(String),
        };
        if (album) {
          // Photos uploaded into this album have nowhere else to live, so unticking one deletes it
          const kept = new Set(data.photos);
          const dropped = library.filter((p) => p.upload?.album === album.id && !kept.has(p.src) && chosen.has(p.src));
          const saved = await mutate((s) => s.update("albums", album.id, data), "Album saved");
          if (saved && dropped.length) {
            const results = await Promise.allSettled(dropped.map(deleteUploadedPhoto));
            const failed = results.filter((r) => r.status === "rejected").length;
            if (failed) toast.error(`Couldn't delete ${failed} photo${failed > 1 ? "s" : ""}. Try again?`);
          }
          return saved;
        }

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
            {library.map((p) => (
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
