import type { Metadata } from "next";
import { AlbumList } from "@/features/albums/albums";

export const metadata: Metadata = { title: "Albums", description: "Our photo collections." };

export default function AlbumsPage() {
  return <AlbumList />;
}
