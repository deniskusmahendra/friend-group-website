import type { Metadata } from "next";
import { TrashBoard } from "@/features/trash/trash-board";

export const metadata: Metadata = { title: "Trash & backup", description: "Restore deleted things, or back up everything." };

export default function TrashPage() {
  return <TrashBoard />;
}
