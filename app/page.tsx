import Image from "next/image";
import Link from "next/link";
import { Gamepad2, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ComingUp, Crew, FreshWishes, Memories } from "@/features/home/home-sections";
import { cn } from "@/lib/utils";
import { site } from "@/content/site";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="grid items-center gap-6 overflow-hidden rounded-3xl border bg-card/60 p-4 shadow-2xl sm:p-6 md:grid-cols-[1fr_minmax(0,30rem)] md:gap-10 md:p-10">
        <div className="order-2 flex flex-col gap-3 md:order-1">
          <h1 className="font-pixel text-6xl font-bold text-white glow-white sm:text-7xl lg:text-8xl">{site.name}</h1>
          <p className="text-lg text-white/85 sm:text-xl">{site.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
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
        {/* Square photo shown whole, so the title and everyone's feet stay in frame */}
        <Image
          src={site.heroPhoto.src}
          alt={site.heroPhoto.alt}
          width={site.heroPhoto.width}
          height={site.heroPhoto.height}
          preload
          sizes="(min-width: 768px) 30rem, 100vw"
          className="order-1 aspect-square w-full rounded-2xl object-cover shadow-[0_0_40px_-12px_var(--neon-red)] ring-1 ring-white/10 md:order-2"
        />
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
        <Memories />
      </section>
    </div>
  );
}
