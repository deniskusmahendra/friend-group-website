import { del } from "@vercel/blob";

// Deletes an uploaded photo file from Vercel Blob. Only files under /photos/
// in a Blob store can be targeted.

function isUploadedPhotoUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith("/photos/")
    );
  } catch {
    return false;
  }
}

export async function DELETE(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Photo uploads aren't set up yet." }, { status: 503 });
  }

  const { url } = (await request.json().catch(() => ({}))) as { url?: unknown };
  if (!isUploadedPhotoUrl(url)) {
    return Response.json({ error: "Not an uploaded photo" }, { status: 400 });
  }

  await del(url);
  return new Response(null, { status: 204 });
}
