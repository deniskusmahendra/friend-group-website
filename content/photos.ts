export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

// Photos live in public/photos. To add one: drop the file in that folder
// and add a line here (width/height keep the layout from jumping while it loads).
export const photos: Photo[] = [
  { src: "/photos/photo-01.jpeg", width: 1280, height: 960, alt: "The boys at home" },
  { src: "/photos/photo-02.jpeg", width: 960, height: 1280, alt: "Red cap selfie" },
  { src: "/photos/photo-03.jpeg", width: 853, height: 1280, alt: "Group photo at GBK" },
  { src: "/photos/photo-04.jpeg", width: 651, height: 1156, alt: "Board game night" },
  { src: "/photos/photo-05.jpeg", width: 1280, height: 960, alt: "Campus selfie" },
  { src: "/photos/photo-06.jpeg", width: 853, height: 1280, alt: "Hanging out" },
  { src: "/photos/photo-07.jpeg", width: 720, height: 1280, alt: "Hanging out" },
  { src: "/photos/photo-08.jpeg", width: 651, height: 1156, alt: "Hanging out" },
  { src: "/photos/photo-09.jpeg", width: 1280, height: 720, alt: "Hanging out" },
  { src: "/photos/photo-10.jpeg", width: 1280, height: 720, alt: "Hanging out" },
  { src: "/photos/photo-11.jpeg", width: 1280, height: 960, alt: "Hanging out" },
];

const bySrc = new Map(photos.map((p) => [p.src, p]));

/** Albums store photo paths; ignore any that were removed from the list above. */
export const resolvePhotos = (srcs: readonly string[]) =>
  srcs.map((s) => bySrc.get(s)).filter((p): p is Photo => Boolean(p));
