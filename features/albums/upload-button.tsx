"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMe } from "@/components/me-provider";
import { uploadPhotos } from "@/features/albums/photo-library";

/** Opens the file picker and uploads the chosen photos. onUploaded gets the new photo srcs. */
export function UploadButton({
  albumId,
  onUploaded,
  size = "lg",
}: {
  /** Custom album to upload into; omit for the Together album */
  albumId?: string;
  onUploaded?: (srcs: string[]) => void | Promise<unknown>;
  size?: "lg" | "default";
}) {
  const { requireMe } = useMe();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const start = async (files: File[]) => {
    const me = requireMe();
    if (!me || !files.length) return;

    setBusy(true);
    const id = toast.loading(`Uploading 0 / ${files.length}…`);
    try {
      const { srcs, failed } = await uploadPhotos(files, me, albumId, (done, total) =>
        toast.loading(`Uploading ${done} / ${total}…`, { id }),
      );
      if (srcs.length) await onUploaded?.(srcs);

      if (!failed.length) toast.success(`${srcs.length} photo${srcs.length > 1 ? "s" : ""} uploaded 📸`, { id });
      else if (srcs.length) toast.warning(`Uploaded ${srcs.length}, but ${failed.length} failed: ${failed.join(", ")}`, { id });
      else toast.error("Upload failed. Photo uploads may not be set up yet, or the file isn't an image.", { id });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size={size} disabled={busy} onClick={() => requireMe() && input.current?.click()}>
        <ImageUp /> {busy ? "Uploading…" : "Upload photos"}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allow picking the same files again
          start(files);
        }}
      />
    </>
  );
}
