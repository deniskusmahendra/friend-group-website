import Image from "next/image";
import Link from "next/link";
import { Gamepad2, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PhotoGrid } from "@/components/photo-grid";
import { ComingUp, Crew, FreshWishes } from "@/features/home/home-sections";
import { cn } from "@/lib/utils";
import { photos } from "@/content/photos";
import { site } from "@/content/site";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="relative aspect-4/5 overflow-hidden rounded-3xl border shadow-2xl sm:aspect-3/2 sm:max-h-140">
        <Image
          src={site.groupPhoto.src}
          alt={site.groupPhoto.alt}
          fill
          preload
          sizes="(min-width: 1152px) 1104px, 100vw"
          className="object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 flex flex-col justify-end gap-2.5 bg-linear-to-t from-background/95 via-background/35 via-45% to-transparent to-70% p-5 sm:p-10">
          <h1 className="font-pixel text-6xl font-bold text-white glow-white sm:text-8xl">{site.name}</h1>
          <p className="text-lg text-white/85 sm:text-xl">{site.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            <Link
              href="/hangouts"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base shadow-[0_4px_24px_-4px_var(--neon-red)]")}
            >
              <MapPin /> Plan a hangout
            </Link>
            <Link href="/gaming" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-5 text-base")}>
              <Gamepad2 /> Game night
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-pixel text-xl font-bold">The crew</h2>
        <Crew />
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <ComingUp />
        <FreshWishes />
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-pixel text-xl font-bold">Memories</h2>
          <Link href="/albums" className="text-sm text-neon-cyan hover:underline">
            all albums →
          </Link>
        </div>
        <PhotoGrid photos={photos.slice(0, 6)} variant="strip" />
      </section>
    </div>
  );
}
