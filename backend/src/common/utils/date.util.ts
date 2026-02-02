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

