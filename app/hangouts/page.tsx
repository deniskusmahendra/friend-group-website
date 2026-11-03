import type { Metadata } from "next";
import { HangoutBoard } from "@/features/hangouts/hangout-board";

export const metadata: Metadata = { title: "Hangouts", description: "Plan a hangout with the gang." };

export default function HangoutsPage() {
  return <HangoutBoard />;
}
