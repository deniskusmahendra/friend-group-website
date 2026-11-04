import type { Metadata } from "next";
import { BadgeBoard } from "@/features/badges/badge-board";

export const metadata: Metadata = { title: "Badges", description: "Achievements earned by the gang." };

export default function BadgesPage() {
  return <BadgeBoard />;
}
