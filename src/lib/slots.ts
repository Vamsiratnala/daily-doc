// All clinic times are Indian Standard Time, regardless of where the server runs.
export const TZ = "Asia/Kolkata";

export type AvailabilityRule = { dayOfWeek: number; startTime: string; endTime: string };
export type Slot = { iso: string; label: string };
export type SlotDay = { date: string; label: string; slots: Slot[] };

export function istDateString(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function istAt(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`);
}

export function formatIST(d: Date, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts }).format(d);
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() + n);
  return istDateString(d);
}

function minutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function hhmm(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

export function generateSlots(
  rules: AvailabilityRule[],
  slotMinutes: number,
  booked: Date[],
  days = 7,
  now = new Date(),
): SlotDay[] {
  const taken = new Set(booked.map((b) => b.getTime()));
  const today = istDateString(now);
  const out: SlotDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const dow = new Date(`${date}T12:00:00+05:30`).getUTCDay();
    const slots: Slot[] = [];
    for (const r of rules.filter((r) => r.dayOfWeek === dow)) {
      for (let m = minutes(r.startTime); m + slotMinutes <= minutes(r.endTime); m += slotMinutes) {
        const at = istAt(date, hhmm(m));
        // Need at least 30 minutes notice.
        if (at.getTime() < now.getTime() + 30 * 60_000 || taken.has(at.getTime())) continue;
        slots.push({ iso: at.toISOString(), label: formatIST(at, { hour: "numeric", minute: "2-digit" }) });
      }
    }
    slots.sort((a, b) => a.iso.localeCompare(b.iso));
    out.push({
      date,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatIST(istAt(date, "12:00"), { weekday: "short", day: "numeric", month: "short" }),
      slots,
    });
  }
  return out;
}

/** True if `at` lines up with one of the doctor's rules and slot grid. */
export function isValidSlot(rules: AvailabilityRule[], slotMinutes: number, at: Date) {
  const date = istDateString(at);
  const dow = new Date(`${date}T12:00:00+05:30`).getUTCDay();
  const t = formatIST(at, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const m = minutes(t);
  return rules.some(
    (r) => r.dayOfWeek === dow && m >= minutes(r.startTime) && m + slotMinutes <= minutes(r.endTime) && (m - minutes(r.startTime)) % slotMinutes === 0,
  );
}
