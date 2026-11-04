"use client";

import { useMemo } from "react";
import {
  CalendarCheck,
  Camera,
  Gamepad2,
  Images,
  Megaphone,
  MessageCircle,
  Moon,
  PartyPopper,
  Shuffle,
  SmilePlus,
  Sparkles,
  Star,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { members, type MemberId } from "@/content/members";
import { startOf } from "@/lib/time";
import { membersIn, reactionKinds, type Collections } from "@/lib/types";
import { useCollection } from "@/lib/use-collection";

// Badges are worked out from what's already in the database, so they need no
// storage of their own and stay correct if something is deleted or restored.

type Data = { [C in keyof Collections]: Collections[C][] };

export type Badge = {
  id: string;
  name: string;
  /** What you do to earn it, e.g. "Plan hangouts" */
  how: string;
  icon: LucideIcon;
  /** Counts needed for bronze, silver, gold */
  levels: [number, number, number];
  count: (data: Data, m: MemberId, now: number) => number;
};

export const tiers = [
  { name: "Bronze", color: "#e0915a" },
  { name: "Silver", color: "#cfd8e3" },
  { name: "Gold", color: "#ffd23f" },
] as const;

const isNight = (when: string) => {
  const hour = Number(when.slice(11, 13));
  return hour >= 22 || hour < 4;
};

export const badges: Badge[] = [
  {
    id: "planner",
    name: "Party Starter",
    how: "Plan hangouts",
    icon: PartyPopper,
    levels: [1, 5, 15],
    count: (d, m) => d.hangouts.filter((h) => h.by === m).length,
  },
  {
    id: "always-there",
    name: "Always There",
    how: "Go to hangouts (said “going”, and it happened)",
    icon: CalendarCheck,
    levels: [3, 10, 25],
    count: (d, m, now) => d.hangouts.filter((h) => h.rsvp?.[m] === "going" && startOf(h) < now).length,
  },
  {
    id: "game-host",
    name: "Game Host",
    how: "Schedule gaming sessions",
    icon: Gamepad2,
    levels: [1, 5, 15],
    count: (d, m) => d.sessions.filter((s) => s.by === m).length,
  },
  {
    id: "squad-up",
    name: "Squad Up",
    how: "Join gaming sessions",
    icon: Users,
    levels: [3, 10, 30],
    count: (d, m) => d.sessions.filter((s) => s.players?.[m]).length,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    how: "Join gaming sessions starting 10pm–4am",
    icon: Moon,
    levels: [1, 5, 15],
    count: (d, m) => d.sessions.filter((s) => s.players?.[m] && isNight(s.when)).length,
  },
  {
    id: "game-hopper",
    name: "Game Hopper",
    how: "Play different games",
    icon: Shuffle,
    levels: [2, 4, 7],
    count: (d, m) => new Set(d.sessions.filter((s) => s.players?.[m]).map((s) => s.game.trim().toLowerCase())).size,
  },
  {
    id: "photographer",
    name: "Photographer",
    how: "Upload photos",
    icon: Camera,
    levels: [5, 25, 100],
    count: (d, m) => d.photos.filter((p) => p.by === m).length,
  },
  {
    id: "curator",
    name: "Curator",
    how: "Make albums",
    icon: Images,
    levels: [1, 3, 10],
    count: (d, m) => d.albums.filter((a) => a.by === m).length,
  },
  {
    id: "dreamer",
    name: "Dreamer",
    how: "Make wishes and set goals",
    icon: Sparkles,
    levels: [1, 5, 15],
    count: (d, m) => d.wishes.filter((w) => w.by === m).length,
  },
  {
    id: "goal-crusher",
    name: "Goal Crusher",
    how: "Complete your own wishes and goals",
    icon: Target,
    levels: [1, 3, 10],
    count: (d, m) => d.wishes.filter((w) => w.owner === m && w.done).length,
  },
  {
    id: "hype-squad",
    name: "Hype Squad",
    how: "Cheer on other people’s wishes and goals",
    icon: Megaphone,
    levels: [5, 20, 50],
    count: (d, m) => d.wishes.filter((w) => w.by !== m && w.cheers?.[m]).length,
  },
  {
    id: "chatterbox",
    name: "Chatterbox",
    how: "Comment on photos",
    icon: MessageCircle,
    levels: [5, 25, 100],
    count: (d, m) => d.comments.filter((c) => c.by === m).length,
  },
  {
    id: "reactor",
    name: "Reactor",
    how: "React to photos",
    icon: SmilePlus,
    levels: [10, 50, 200],
    count: (d, m) => d.reactions.reduce((n, r) => n + reactionKinds.filter((k) => r[k]?.[m]).length, 0),
  },
  {
    id: "crowd-favourite",
    name: "Crowd Favourite",
    how: "Get reactions on photos you uploaded",
    icon: Star,
    levels: [10, 50, 150],
    count: (d, m) => {
      const mine = new Set(d.photos.filter((p) => p.by === m).map((p) => p.src));
      return d.reactions
        .filter((r) => mine.has(r.photo))
        .reduce((n, r) => n + reactionKinds.reduce((k, kind) => k + membersIn(r[kind]).filter((x) => x !== m).length, 0), 0);
    },
  },
];

export type BadgeProgress = {
  badge: Badge;
  count: number;
  /** 0 = locked, 1 bronze, 2 silver, 3 gold */
  level: number;
  /** Count needed for the next level (null at gold) */
  next: number | null;
};

const progressOf = (badge: Badge, count: number): BadgeProgress => {
  const level = badge.levels.filter((n) => count >= n).length;
  return { badge, count, level, next: level < 3 ? badge.levels[level] : null };
};

/** Badge progress for every member. null while data is still loading or before the clock is known. */
export function useBadges(now: number | null) {
  const hangouts = useCollection("hangouts");
  const sessions = useCollection("sessions");
  const wishes = useCollection("wishes");
  const albums = useCollection("albums");
  const photos = useCollection("photos");
  const reactions = useCollection("reactions");
  const comments = useCollection("comments");
  const all = [hangouts, sessions, wishes, albums, photos, reactions, comments];
  const loading = all.some((c) => c.loading);

  return useMemo(() => {
    if (loading || now === null) return null;
    const data: Data = {
      hangouts: hangouts.rows,
      sessions: sessions.rows,
      wishes: wishes.rows,
      albums: albums.rows,
      photos: photos.rows,
      reactions: reactions.rows,
      comments: comments.rows,
    };
    return new Map(
      members.map((m) => [m.id as MemberId, badges.map((b) => progressOf(b, b.count(data, m.id, now)))]),
    );
  }, [loading, now, hangouts.rows, sessions.rows, wishes.rows, albums.rows, photos.rows, reactions.rows, comments.rows]);
}

/** Total levels earned (each bronze/silver/gold counts once) */
export const scoreOf = (progress: BadgeProgress[]) => progress.reduce((n, p) => n + p.level, 0);
