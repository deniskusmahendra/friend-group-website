"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { MemberAvatar } from "@/components/member-avatar";
import { PhotoSocialPanel } from "@/components/photo-social";
import { nameOf } from "@/content/members";
import type { Photo } from "@/content/photos";

const navButton =
  "absolute z-10 grid size-11 place-items-center rounded-full border border-white/15 bg-black/60 text-white transition-colors hover:border-primary";

/** Full-screen photo viewer with reactions and comments. index === null means closed. */
export function Lightbox({
  photos,
  index,
  onIndexChange,
  renderActions,
}: {
  photos: Photo[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  /** Extra buttons for the current photo, e.g. delete */
  renderActions?: (photo: Photo) => React.ReactNode;
}) {
  const touchX = useRef<number | null>(null);
  const photo = index === null ? null : photos[index];
  const step = (d: number) => index !== null && onIndexChange((index + d + photos.length) % photos.length);

  return (
    <DialogPrimitive.Root open={photo !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/95 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          // Phones/tablets: photo on top, reactions and comments below. Desktop: comments in a side panel.
          className="fixed inset-0 z-50 flex flex-col overflow-hidden outline-none lg:flex-row"
          onKeyDown={(e) => {
            if (e.target instanceof HTMLInputElement) return; // arrow keys move the cursor while typing
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
          }}
        >
          <DialogPrimitive.Title className="sr-only">{photo?.alt ?? "Photo"}</DialogPrimitive.Title>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-3 pt-16 pb-10 lg:px-20 lg:py-12"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
              touchX.current = null;
            }}
          >
            {photo && (
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(min-width: 1024px) 70vw, 96vw"
                className="max-h-[calc(58dvh-6.5rem)] w-auto max-w-full rounded-lg object-contain shadow-2xl animate-in fade-in-0 zoom-in-95 lg:max-h-[86dvh]"
              />
            )}
            {photo && (photo.upload || renderActions) && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                {photo.upload && (
                  <span className="flex items-center gap-2 rounded-full bg-black/60 py-1 pr-3 pl-1 text-sm text-white">
                    <MemberAvatar id={photo.upload.by} size="sm" ring={false} />
                    {nameOf(photo.upload.by)}
                  </span>
                )}
                {renderActions?.(photo)}
              </div>
            )}
            <DialogPrimitive.Close className={`${navButton} top-4 right-4`} aria-label="Close">
              <X className="size-5" />
            </DialogPrimitive.Close>
            {photos.length > 1 && (
              <>
                <button type="button" className={`${navButton} top-1/2 left-3 -translate-y-1/2 md:left-5`} onClick={() => step(-1)} aria-label="Previous photo">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" className={`${navButton} top-1/2 right-3 -translate-y-1/2 md:right-5`} onClick={() => step(1)} aria-label="Next photo">
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
            {index !== null && (
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-pixel text-sm text-white/60">
                {index + 1} / {photos.length}
              </span>
            )}
          </div>
          {photo && (
            <aside className="flex h-[42dvh] shrink-0 flex-col border-t border-white/10 bg-card lg:h-full lg:w-88 lg:border-t-0 lg:border-l">
              <PhotoSocialPanel src={photo.src} />
            </aside>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
