"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { Photo } from "@/content/photos";

const navButton =
  "absolute z-10 grid size-12 place-items-center rounded-full border border-white/15 bg-black/60 text-white transition-colors hover:border-primary";

/** Full-screen photo viewer. index === null means closed. */
export function Lightbox({
  photos,
  index,
  onIndexChange,
}: {
  photos: Photo[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const touchX = useRef<number | null>(null);
  const photo = index === null ? null : photos[index];
  const step = (d: number) => index !== null && onIndexChange((index + d + photos.length) % photos.length);

  return (
    <DialogPrimitive.Root open={photo !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/95 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 grid place-items-center outline-none"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
          }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
            touchX.current = null;
          }}
        >
          <DialogPrimitive.Title className="sr-only">{photo?.alt ?? "Photo"}</DialogPrimitive.Title>
          {photo && (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="92vw"
              className="max-h-[84dvh] w-auto max-w-[92vw] rounded-lg object-contain shadow-2xl animate-in fade-in-0 zoom-in-95"
            />
          )}
          <DialogPrimitive.Close className={`${navButton} top-4 right-4`} aria-label="Close">
            <X className="size-5" />
          </DialogPrimitive.Close>
          {photos.length > 1 && (
            <>
              <button type="button" className={`${navButton} bottom-5 left-5 md:top-1/2 md:bottom-auto md:-translate-y-1/2`} onClick={() => step(-1)} aria-label="Previous photo">
                <ChevronLeft className="size-6" />
              </button>
              <button type="button" className={`${navButton} right-5 bottom-5 md:top-1/2 md:bottom-auto md:-translate-y-1/2`} onClick={() => step(1)} aria-label="Next photo">
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
          {index !== null && (
            <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-pixel text-sm text-white/60">
              {index + 1} / {photos.length}
            </span>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
