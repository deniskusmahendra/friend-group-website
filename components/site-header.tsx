"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, House, Images, MapPin, Sparkles } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { useMe } from "@/components/me-provider";
import { cn } from "@/lib/utils";
import { nameOf } from "@/content/members";
import { site } from "@/content/site";

const nav = [
  { href: "/", label: "Home", icon: House },
  { href: "/albums", label: "Albums", icon: Images },
  { href: "/hangouts", label: "Hangouts", icon: MapPin },
  { href: "/gaming", label: "Gaming", icon: Gamepad2 },
  { href: "/wishes", label: "Wishes", icon: Sparkles },
];

export function SiteHeader() {
  return (
    // No backdrop-filter here on mobile: it would trap the fixed bottom nav inside the header
    <header className="sticky top-0 z-40 border-b bg-background/95 md:bg-background/75 md:backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="neon-frame rounded-md border-2 border-white px-2.5 py-0.5 font-pixel text-2xl font-bold text-white glow-white"
        >
          {site.name}
        </Link>
        <Nav />
        <MeChip />
      </div>
    </header>
  );
}

function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Main"
      className={cn(
        // Mobile: fixed tab bar at the bottom. Desktop: pills in the header.
        "fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/95 px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]",
        "md:static md:mx-auto md:justify-center md:gap-1 md:border-0 md:bg-transparent md:p-0",
      )}
    >
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
            "md:flex-row md:gap-2 md:rounded-full md:px-4 md:py-2 md:text-sm md:hover:bg-card",
            "aria-[current=page]:bg-linear-to-r aria-[current=page]:from-neon-red/25 aria-[current=page]:to-neon-blue/25 aria-[current=page]:text-foreground aria-[current=page]:ring-1 aria-[current=page]:ring-white/10",
          )}
        >
          <Icon className="size-5 md:size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function MeChip() {
  const { me, openPicker } = useMe();
  return (
    <button
      type="button"
      onClick={openPicker}
      className="flex items-center gap-2 rounded-full border bg-card py-1 pr-3.5 pl-1 text-sm font-semibold transition-colors hover:border-primary"
    >
      <MemberAvatar id={me} size="sm" ring={false} />
      {me ? nameOf(me) : "Who are you?"}
    </button>
  );
}
