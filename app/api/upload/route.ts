import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// Hands the browser a short-lived token so it can upload a photo straight to Vercel Blob.
// The browser shrinks photos first, so 5 MB is plenty.

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "Photo uploads aren't set up yet (see README)." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("photos/")) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: ["image/webp", "image/jpeg", "image/png"],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }
}
