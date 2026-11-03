// Event times are stored as local "YYYY-MM-DDTHH:mm" strings from <input type="datetime-local">.

type Timed = { when: string; duration?: number };

const DEFAULT_MINUTES = 180;

export const startOf = (ev: Timed) => new Date(ev.when).getTime();
export const endOf = (ev: Timed) => startOf(ev) + (ev.duration || DEFAULT_MINUTES) * 60_000;
export const isLive = (ev: Timed, now: number) => startOf(ev) <= now && now < endOf(ev);
export const isUpcoming = (ev: Timed, now: number) => endOf(ev) > now;
export const byStart = (a: Timed, b: Timed) => startOf(a) - startOf(b);

const whenFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
export const formatWhen = (when: string) => whenFormat.format(new Date(when));

const dayFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
/** For "YYYY-MM-DD" dates. Parsed as local midnight, not UTC. */
export const formatDay = (date: string) => dayFormat.format(new Date(`${date}T00:00`));

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
export function relativeTime(when: string, now: number) {
  const diff = new Date(when).getTime() - now;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  }
}

export const durationOptions = [
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
  { value: "360", label: "6 hours" },
  { value: "720", label: "All day" },
];
