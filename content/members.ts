export type Member = {
  id: string;
  name: string;
  /** Path under /public. Leave out to show the member's initial instead. */
  photo?: string;
  /** Accent colour used for their avatar ring and wish cards */
  color: string;
};

export const members = [
  { id: "denis", name: "Denis", photo: "/members/denis.jpeg", color: "#ff3b5c" },
  { id: "nauval", name: "Nauval", photo: "/members/nauval.jpeg", color: "#3b82ff" },
  { id: "fergio", name: "Fergio", photo: "/members/fergio.jpeg", color: "#22d3ee" },
  { id: "jovano", name: "Jovano", photo: "/members/jovano.jpeg", color: "#a78bfa" },
  { id: "hafizh", name: "Hafizh", photo: "/members/hafizh.jpeg", color: "#34d399" },
  { id: "nailah", name: "Nailah", photo: "/members/nailah.jpeg", color: "#f472b6" },
  { id: "zhafira", name: "Zhafira", photo: "/members/zhafira.jpeg", color: "#fbbf24" },
  { id: "thesa", name: "Thesa", photo: "/members/thesa.jpeg", color: "#fb923c" },
  { id: "tazkia", name: "Tazkia", photo: "/members/tazkia.jpeg", color: "#2dd4bf" },
] as const satisfies readonly Member[];

export type MemberId = (typeof members)[number]["id"];

/** Wishes can belong to one member or to the whole group */
export type OwnerId = MemberId | "gang";

export const GANG: Member = { id: "gang", name: "The whole gang", photo: "/group.jpg", color: "#ff3b5c" };

const byId = new Map<string, Member>(members.map((m) => [m.id, m]));

export function getMember(id: string | null | undefined): Member | undefined {
  if (id === "gang") return GANG;
  return id ? byId.get(id) : undefined;
}

export function isMemberId(id: unknown): id is MemberId {
  return typeof id === "string" && byId.has(id);
}

export const nameOf = (id: string | null | undefined) => getMember(id)?.name ?? "Someone";
