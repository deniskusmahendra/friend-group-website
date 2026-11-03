import type { Metadata } from "next";
import { SessionBoard } from "@/features/gaming/session-board";

export const metadata: Metadata = { title: "Gaming", description: "Schedule a gaming or Discord session." };

export default function GamingPage() {
  return <SessionBoard />;
}
