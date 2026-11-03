import type { MemberId, OwnerId } from "@/content/members";

type Doc = { id: string; createdAt: number; by: MemberId };

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

export type Collections = {
  hangouts: Hangout;
  sessions: Session;
  wishes: Wish;
  albums: Album;
  photos: UploadedPhoto;
};

export type CollectionName = keyof Collections;

/** Fields the caller provides when creating a document */
export type NewDoc<C extends CollectionName> = Omit<Collections[C], "id" | "createdAt">;

/** Member ids whose value in the map is set (not null/false) */
export const membersIn = <V,>(map: MemberMap<V> | undefined) =>
  (Object.keys(map ?? {}) as MemberId[]).filter((k) => map?.[k]);
