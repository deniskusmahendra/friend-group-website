"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMe } from "@/components/me-provider";
import { useNow } from "@/lib/use-now";
import { tiers, useBadges } from "@/features/badges/badges";

/** Pops a toast when you reach a new badge level. Remembers what you've seen per browser. */
export function BadgeWatcher() {
  const { me } = useMe();
  const now = useNow();
  const progress = useBadges(now);
  const router = useRouter();

  useEffect(() => {
    if (!me || !progress) return;
    const key = `gang:badges:${me}`;
    const current = Object.fromEntries(progress.get(me)!.map((p) => [p.badge.id, p.level]));
    const raw = localStorage.getItem(key);
    localStorage.setItem(key, JSON.stringify(current));
    if (raw === null) return; // first visit: don't announce badges earned before

    const seen = JSON.parse(raw) as Record<string, number>;
    for (const p of progress.get(me)!) {
      if (p.level > (seen[p.badge.id] ?? 0)) {
        toast.success(`🏅 ${tiers[p.level - 1].name} badge: ${p.badge.name}`, {
          description: p.badge.how,
          action: { label: "See", onClick: () => router.push("/badges") },
        });
      }
    }
  }, [me, progress, router]);

  return null;
}
