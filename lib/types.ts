import type { MemberId, OwnerId } from "@/content/members";

type Doc = {
  id: string;
  createdAt: number;
  by: MemberId;
  /** Set when moved to Trash (ms timestamp); null/missing = live */
  deletedAt?: number | null;
  deletedBy?: MemberId | null;
};

/** Maps keyed by member id. A null value means "removed" (Firestore-friendly). */
type MemberMap<V> = Partial<Record<MemberId, V | null>>;

export type RsvpStatus = "going" | "maybe" | "no";

export type Hangout = Doc & {
  title: string;
  place: string;
  /** Local datetime from <input type="datetime-local">, e.g. "2026-11-10T19:00" */
  when: string;
  /** Minutes */
  duration: number;
  notes: string;
  rsvp: MemberMap<RsvpStatus>;
};

export type Session = Doc & {
  game: string;
  when: string;
  duration: number;
  platform: string;
  link: string;
  /** 0 = no limit */
  slots: number;
  notes: string;
  players: MemberMap<true>;
};

export type Wish = Doc & {
  kind: "wish" | "goal";
  text: string;
  owner: OwnerId;
  /** "YYYY-MM-DD" or "" */
  target: string;
  progress: number;
  done: boolean;
  cheers: MemberMap<true>;
};

export type Album = Doc & {
  title: string;
  description: string;
  photos: string[];
};

/** A photo someone uploaded through the site (file lives in Vercel Blob) */
export type UploadedPhoto = Doc & {
  src: string;
  width: number;
  height: number;
  /** Id of the album it was uploaded into; "" (or missing on older photos) = the Together album */
  album?: string;
};

export const reactionEmoji = { love: "❤️", laugh: "😂", fire: "🔥", wow: "😮", cry: "😭", skull: "💀" } as const;
export type ReactionKind = keyof typeof reactionEmoji;
export const reactionKinds = Object.keys(reactionEmoji) as ReactionKind[];

/** All reactions on one photo. Doc id = photoKey(src); one map of members per emoji. */
export type PhotoReactions = {
  id: string;
  photo: string;
  deletedAt?: number | null;
  deletedBy?: MemberId | null;
} & Partial<Record<ReactionKind, MemberMap<true>>>;

export type PhotoComment = Doc & {
  /** src of the photo */
  photo: string;
  text: string;
};

export type Collections = {
  hangouts: Hangout;
  sessions: Session;
  wishes: Wish;
  albums: Album;
  photos: UploadedPhoto;
  reactions: PhotoReactions;
  comments: PhotoComment;
};

export type CollectionName = keyof Collections;

/** Fields the caller provides when creating a document */
export type NewDoc<C extends CollectionName> = Omit<Collections[C], "id" | "createdAt" | "deletedAt" | "deletedBy">;

/** Firestore-safe document id for a photo src (srcs contain slashes) */
export function photoKey(src: string) {
  // cyrb53 hash: tiny, stable, and collisions are practically impossible for a few thousand photos
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < src.length; i++) {
    const c = src.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return "p" + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const collectionNames: CollectionName[] = ["hangouts", "sessions", "wishes", "albums", "photos", "reactions", "comments"];

/** Member ids whose value in the map is set (not null/false) */
export const membersIn = <V,>(map: MemberMap<V> | undefined) =>
  (Object.keys(map ?? {}) as MemberId[]).filter((k) => map?.[k]);
