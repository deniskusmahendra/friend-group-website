// Builds an .ics file so an event can be added to Google/Apple/Outlook calendars.

type CalendarEvent = {
  title: string;
  when: string;
  duration: number;
  location?: string;
  description?: string;
};

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapeText = (s = "") =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&");

export function downloadIcs(ev: CalendarEvent) {
  const start = new Date(ev.when);
  const end = new Date(start.getTime() + (ev.duration || 180) * 60_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//gang//friend-group-website//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@gang`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(ev.title)}`,
    `LOCATION:${escapeText(ev.location)}`,
    `DESCRIPTION:${escapeText(ev.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${ev.title.replace(/[^\w-]+/g, "-").toLowerCase() || "event"}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Only allow http(s) links (blocks javascript: and similar) */
export function safeUrl(input: string) {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}
