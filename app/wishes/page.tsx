import type { Metadata } from "next";
import { WishBoard } from "@/features/wishes/wish-board";

export const metadata: Metadata = { title: "Wishes & goals", description: "Make a wish or set a goal." };

export default function WishesPage() {
  return <WishBoard />;
}
