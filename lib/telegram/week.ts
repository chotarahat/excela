import type { UserDoc } from "@/lib/models";
import { getSchedule } from "@/lib/planner-service";

const DAY_MS = 86_400_000;

function addDays(date: string, days: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function formatDay(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(value);
  const day = value.getUTCDate();
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" })
    .format(value)
    .toUpperCase();
  return `${month} ${day}: ${weekday}`;
}

/**
 * Reads the user's existing Google Sheets planner for exactly today + the next 6 days.
 * This intentionally calls the shared planner service; it does not introduce another
 * Google Sheets data-fetching implementation or modify Smart Agent behavior.
 */
export async function getNextSevenDaysForTelegram(user: UserDoc, today: string) {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const rows = await getSchedule(user, dates[0], dates[6]);
  const byDate = new Map(rows.map((row) => [row.date, row]));

  return dates.map((date) => ({
    date,
    label: formatDay(date),
    items: byDate.get(date)?.slots.map((slot) => slot.text).filter(Boolean) ?? [],
  }));
}

export function formatNextSevenDaysTelegramSchedule(
  days: Array<{ label: string; items: string[] }>,
): string {
  return days
    .map(({ label, items }) => `${label} → ${items.length ? items.join(" | ") : "—"}`)
    .join("\n");
}
