// Shrinks a photo in the browser before upload: phone photos are often 3–8 MB,
// this gets them to ~200–400 KB with no visible difference on screen.

const MAX_SIDE = 1920;
const QUALITY = 0.82;

export type CompressedImage = { blob: Blob; width: number; height: number; ext: "webp" | "jpg" };

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

export async function compressImage(file: File): Promise<CompressedImage> {
  // "from-image" applies the EXIF rotation so phone photos aren't sideways
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Safari can't encode WebP and silently returns PNG instead, so fall back to JPEG
  const webp = await toBlob(canvas, "image/webp");
  if (webp?.type === "image/webp") return { blob: webp, width, height, ext: "webp" };

  const jpeg = await toBlob(canvas, "image/jpeg");
  if (!jpeg) throw new Error("Couldn't process this image");
  return { blob: jpeg, width, height, ext: "jpg" };
}
