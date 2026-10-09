/**
 * Pakistan Standard Time is UTC+05:00 all year (no DST), so a fixed offset is exact.
 */
export const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Start of the PKT calendar day containing `at`, as a UTC Date. */
export function pktDayStart(at: Date): Date {
  const shifted = at.getTime() + PKT_OFFSET_MS;
  const dayStartShifted = Math.floor(shifted / 86_400_000) * 86_400_000;
  return new Date(dayStartShifted - PKT_OFFSET_MS);
}

/** End (exclusive) of the PKT day containing `at`. */
export function pktDayEnd(at: Date): Date {
  return new Date(pktDayStart(at).getTime() + 86_400_000);
}

export function isSamePktDay(a: Date, b: Date): boolean {
  return pktDayStart(a).getTime() === pktDayStart(b).getTime();
}

/** "2026-10-09" in PKT. */
export function pktDateKey(at: Date): string {
  return new Date(at.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "9 Oct 2026" in PKT. */
export function formatPktDate(at: Date): string {
  const d = new Date(at.getTime() + PKT_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "9 Oct 2026, 4:05 pm" in PKT. */
export function formatPktDateTime(at: Date): string {
  const d = new Date(at.getTime() + PKT_OFFSET_MS);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${formatPktDate(at)}, ${h12}:${m} ${h < 12 ? "am" : "pm"}`;
}
