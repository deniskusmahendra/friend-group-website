import { Suspense } from "react";
import { AlbumDetail } from "@/features/albums/albums";
import { LoadingCards } from "@/components/page-header";

export default function AlbumPage({ params }: PageProps<"/albums/[id]">) {
  // Album ids come from the database, so params resolve at request time
  return (
    <Suspense fallback={<LoadingCards count={1} />}>
      {params.then(({ id }) => (
        <AlbumDetail id={id} />
      ))}
    </Suspense>
  );
}
