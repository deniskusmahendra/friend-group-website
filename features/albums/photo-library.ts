"use client";

import { useMemo } from "react";
import { compressImage } from "@/lib/compress-image";
import { getStore } from "@/lib/store";
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
        upload: { id: p.id, by: p.by },
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
      await store.add("photos", { src: blob.url, width: img.width, height: img.height, by });
      result.srcs.push(blob.url);
    } catch (err) {
      console.error(`Upload failed: ${file.name}`, err);
      result.failed.push(file.name);
    }
    onProgress(i + 1, files.length);
  }
  return result;
}

/** Removes the file from Blob storage and its record from the database */
export async function deleteUploadedPhoto(photo: Photo) {
  if (!photo.upload) throw new Error("Only uploaded photos can be deleted");
  const res = await fetch("/api/photos", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: photo.src }),
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  const { store } = await getStore();
  await store.remove("photos", photo.upload.id);
}
