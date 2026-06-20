/**
 * lib/timeUtils.ts
 *
 * ==============================================================================
 * IMPORTANT: TIMEZONE HANDLING (IST - UTC+5:30)
 * ==============================================================================
 * The Vaniyambadi Bus Tracker application ONLY serves Vaniyambadi, India.
 * All schedules and live reports are based on Indian Standard Time (IST).
 * 
 * Since the Next.js server (e.g., hosted on Vercel) runs in UTC by default,
 * all date/time logic, comparisons, and display formatting MUST explicitly
 * convert to/from IST to avoid bugs where buses appear "early" or "late"
 * due to server timezone offsets.
 * 
 * Use the helper functions in this file for all time-related operations
 * to ensure consistent IST handling across the application.
 * ==============================================================================
 */

import { toZonedTime, format } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Gets the current time in IST explicitly.
 */
export function getCurrentISTDate(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

/**
 * Formats a given Date object (or the current time if omitted) 
 * to a string representation in IST.
 * 
 * @param date - The Date object to format. Defaults to current time.
 * @param formatStr - The date-fns format string (e.g., 'HH:mm', 'yyyy-MM-dd HH:mm:ss')
 */
export function formatIST(date: Date = new Date(), formatStr: string = 'HH:mm'): string {
  const zonedDate = toZonedTime(date, IST_TIMEZONE);
  return format(zonedDate, formatStr, { timeZone: IST_TIMEZONE });
}

/**
 * Returns the ISO string representation of the time 20 minutes ago in IST,
 * useful for querying Supabase for recent live reports.
 */
export function getTwentyMinutesAgoIST(): string {
  const now = new Date();
  const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);
  // Although Supabase TIMESTAMPTZ handles UTC offsets internally if passed an ISO string,
  // returning standard ISO string of (now - 20m) works correctly for filtering.
  return twentyMinsAgo.toISOString();
}

/**
 * Helper to get the current day of the week as a short string (e.g. 'mon', 'tue').
 */
export function getCurrentISTDayOfWeek(offsetDays: number = 0): string {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  const zonedDate = toZonedTime(targetDate, IST_TIMEZONE);
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[zonedDate.getDay()];
}

/**
 * Given an array of schedules with `departure_time` (HH:mm:ss) and `days_of_week` (string[]),
 * calculates the next two upcoming departure times. Handles end-of-day by checking tomorrow.
 */
export function getNextDepartures(schedules: { departure_time: string, days_of_week: string[] }[]): string[] {
  if (!schedules || schedules.length === 0) return [];

  const currentTime = formatIST(new Date(), 'HH:mm:ss');
  const todayStr = getCurrentISTDayOfWeek(0);
  const tomorrowStr = getCurrentISTDayOfWeek(1);

  // Today's remaining schedules
  const todaysRemaining = schedules
    .filter(s => s.days_of_week.includes(todayStr) && s.departure_time >= currentTime)
    .sort((a, b) => a.departure_time.localeCompare(b.departure_time));

  const results: string[] = [];

  // Take up to 2 from today
  for (let i = 0; i < Math.min(2, todaysRemaining.length); i++) {
    const timeWithoutSeconds = todaysRemaining[i].departure_time.substring(0, 5); // "HH:mm"
    results.push(timeWithoutSeconds);
  }

  // If we need more, look at tomorrow
  if (results.length < 2) {
    const tomorrowsFirst = schedules
      .filter(s => s.days_of_week.includes(tomorrowStr))
      .sort((a, b) => a.departure_time.localeCompare(b.departure_time));
      
    for (let i = 0; i < Math.min(2 - results.length, tomorrowsFirst.length); i++) {
      const timeWithoutSeconds = tomorrowsFirst[i].departure_time.substring(0, 5);
      results.push(`Tomorrow at ${timeWithoutSeconds}`);
    }
  }

  return results;
}
