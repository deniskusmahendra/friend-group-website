import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { blobConfigured } from "@/lib/blob";

// Gives the browser a short-lived presigned URL so it can upload one photo straight
// to Vercel Blob. Works with Vercel's OIDC store connection (BLOB_STORE_ID) and with
// a classic BLOB_READ_WRITE_TOKEN. The browser shrinks photos first, so 5 MB is plenty.

const MAX_BYTES = 5 * 1024 * 1024;
const CONTENT_TYPES = ["image/webp", "image/jpeg"];
// Matches the names the browser picks: photos/<member>-<uuid>.<ext>
const PATHNAME = /^photos\/[a-z]+-[0-9a-f-]{36}\.(webp|jpg)$/;

export async function POST(request: Request) {
  if (!blobConfigured()) {
    return Response.json({ error: "Photo uploads aren't set up yet (see README)." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body,
      request,
      // Only used to verify upload-completed webhooks, which this app doesn't use
      webhookPublicKey: process.env.BLOB_WEBHOOK_PUBLIC_KEY ?? "unused",
      getSignedToken: async (pathname) => {
        if (!PATHNAME.test(pathname)) throw new Error("Invalid upload path");
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + 10 * 60_000,
        });
        return {
          token,
          urlOptions: { allowedContentTypes: CONTENT_TYPES, maximumSizeInBytes: MAX_BYTES },
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    console.error("[upload]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 400 });
  }
}
