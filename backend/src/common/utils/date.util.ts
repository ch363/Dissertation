// Converts UTC timestamp to end of user's local day, then back to UTC for storage
export function getEndOfLocalDayUtc(
  now: Date,
  tzOffsetMinutes?: number,
): Date {
  if (!Number.isFinite(tzOffsetMinutes)) return now;
  
  // Guardrail: ignore invalid offsets outside -14h to +14h range
  if (tzOffsetMinutes! < -14 * 60 || tzOffsetMinutes! > 14 * 60) return now;

  const offsetMs = tzOffsetMinutes! * 60_000;
  
  // Shift into user's local timeline, compute end-of-day, shift back to UTC
  const localNow = new Date(now.getTime() - offsetMs);
  
  const endOfLocalDayShiftedUtc = new Date(
    Date.UTC(
      localNow.getUTCFullYear(),
      localNow.getUTCMonth(),
      localNow.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  
  return new Date(endOfLocalDayShiftedUtc.getTime() + offsetMs);
}

/**
 * Start of current week (Monday 00:00:00.000) in user's local time, as UTC instant.
 */
export function getStartOfWeekLocalUtc(
  now: Date,
  tzOffsetMinutes?: number,
): Date {
  if (!Number.isFinite(tzOffsetMinutes) || tzOffsetMinutes! < -14 * 60 || tzOffsetMinutes! > 14 * 60) {
    return now;
  }
  const offsetMs = tzOffsetMinutes! * 60_000;
  const localNow = new Date(now.getTime() - offsetMs);
  const localDay = localNow.getUTCDay();
  const mondayOffset = localDay === 0 ? -6 : 1 - localDay;
  const mondayLocal = new Date(localNow);
  mondayLocal.setUTCDate(localNow.getUTCDate() + mondayOffset);
  mondayLocal.setUTCHours(0, 0, 0, 0);
  return new Date(mondayLocal.getTime() + offsetMs);
}

/**
 * End of current week (Sunday 23:59:59.999) in user's local time, as UTC instant.
 */
export function getEndOfWeekLocalUtc(
  now: Date,
  tzOffsetMinutes?: number,
): Date {
  if (!Number.isFinite(tzOffsetMinutes) || tzOffsetMinutes! < -14 * 60 || tzOffsetMinutes! > 14 * 60) {
    return now;
  }
  const offsetMs = tzOffsetMinutes! * 60_000;
  const localNow = new Date(now.getTime() - offsetMs);
  const localDay = localNow.getUTCDay();
  const sundayOffset = localDay === 0 ? 0 : 7 - localDay;
  const sundayLocal = new Date(localNow);
  sundayLocal.setUTCDate(localNow.getUTCDate() + sundayOffset);
  sundayLocal.setUTCHours(23, 59, 59, 999);
  return new Date(sundayLocal.getTime() + offsetMs);
}

