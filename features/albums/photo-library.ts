"use client";

import { useMemo } from "react";
import { compressImage } from "@/lib/compress-image";
import { getStore } from "@/lib/store";
import { moveToTrash } from "@/lib/trash";
import { useCollection } from "@/lib/use-collection";
import { nameOf, type MemberId } from "@/content/members";
import { photos as builtInPhotos, type Photo } from "@/content/photos";

/** Every photo: uploads (newest first), then the ones that ship with the site */
export function usePhotoLibrary() {
  const { rows, loading } = useCollection("photos");

  return useMemo(() => {
    const uploaded: Photo[] = [...rows]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => ({
        src: p.src,
        width: p.width,
        height: p.height,
        alt: `Photo uploaded by ${nameOf(p.by)}`,
        upload: { id: p.id, by: p.by, album: p.album },
      }));
    const all = [...uploaded, ...builtInPhotos];
    const bySrc = new Map(all.map((p) => [p.src, p]));

    return {
      all,
      loading,
      /** Albums store photo srcs; skips any that were deleted */
      resolve: (srcs: readonly string[]) => srcs.map((s) => bySrc.get(s)).filter((p): p is Photo => Boolean(p)),
    };
  }, [rows, loading]);
}

export type UploadResult = { srcs: string[]; failed: string[] };

/** Shrinks and uploads each file, then records it in the "photos" collection. */
export async function uploadPhotos(
  files: File[],
  by: MemberId,
  /** Custom album the photos belong to; omit for the Together album */
  albumId: string | undefined,
  onProgress: (done: number, total: number) => void,
): Promise<UploadResult> {
  const [{ uploadPresigned }, { store }] = await Promise.all([import("@vercel/blob/client"), getStore()]);
  const result: UploadResult = { srcs: [], failed: [] };

  for (const [i, file] of files.entries()) {
    try {
      const img = await compressImage(file);
      // Unique name per photo; the server only signs URLs for this exact path
      const blob = await uploadPresigned(`photos/${by}-${crypto.randomUUID()}.${img.ext}`, img.blob, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: img.blob.type,
      });
      await store.add("photos", { src: blob.url, width: img.width, height: img.height, by, album: albumId ?? "" });
      result.srcs.push(blob.url);
    } catch (err) {
      console.error(`Upload failed: ${file.name}`, err);
      result.failed.push(file.name);
    }
    onProgress(i + 1, files.length);
  }
  return result;
}

/** Moves an uploaded photo to Trash. Its file stays in Blob storage until Trash is emptied. */
export function trashUploadedPhotos(photos: Photo[], me: MemberId) {
  const ids = photos.flatMap((p) => (p.upload ? [p.upload.id] : []));
  return moveToTrash("photos", ids, me, ids.length > 1 ? `${ids.length} photos` : "Photo");
}
