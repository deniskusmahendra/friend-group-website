"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/components/lightbox";
import { PhotoCounts, usePhotoSocial } from "@/components/photo-social";
import { cn } from "@/lib/utils";
import type { Photo } from "@/content/photos";

/** Masonry grid (or square strip) of photos that open in the lightbox */
export function PhotoGrid({
  photos,
  variant = "masonry",
  renderActions,
}: {
  photos: Photo[];
  variant?: "masonry" | "strip";
  renderActions?: (photo: Photo, close: () => void) => React.ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const social = usePhotoSocial();

  return (
    <>
      <div className={variant === "masonry" ? "columns-2 gap-3 md:columns-3" : "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6"}>
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "group relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-card",
              variant === "masonry" ? "mb-3 break-inside-avoid" : "aspect-square",
            )}
          >
            <Image
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              loading={i < 6 ? "eager" : undefined}
              sizes={variant === "masonry" ? "(min-width: 768px) 33vw, 50vw" : "(min-width: 1024px) 17vw, 50vw"}
              className={cn(
                "w-full transition duration-300 group-hover:scale-105 group-hover:brightness-110",
                variant === "strip" ? "h-full object-cover" : "h-auto",
              )}
            />
            <PhotoCounts src={p.src} social={social} />
          </button>
        ))}
      </div>
      <Lightbox
        photos={photos}
        index={index !== null && index < photos.length ? index : null}
        onIndexChange={setIndex}
        renderActions={renderActions && ((photo) => renderActions(photo, () => setIndex(null)))}
      />
    </>
  );
}
