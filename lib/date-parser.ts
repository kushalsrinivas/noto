const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function nextWeekday(dayIndex: number, from: Date): Date {
  const result = new Date(from);
  const diff = (dayIndex - from.getDay() + 7) % 7 || 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function setTimeOnDate(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function parseTimeString(
  raw: string,
): { hours: number; minutes: number } | null {
  const normalized = raw.toLowerCase().trim();

  if (/\bmorning\b/.test(normalized)) return { hours: 9, minutes: 0 };
  if (/\bnoon\b/.test(normalized)) return { hours: 12, minutes: 0 };
  if (/\bafternoon\b/.test(normalized)) return { hours: 14, minutes: 0 };
  if (/\bevening\b/.test(normalized)) return { hours: 18, minutes: 0 };
  if (/\bnight\b|tonight\b/.test(normalized)) return { hours: 21, minutes: 0 };
  if (/\bmidnight\b/.test(normalized)) return { hours: 0, minutes: 0 };

  const timeMatch = normalized.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i,
  );
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.replace(/\./g, "").toLowerCase();

    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    if (!meridiem && hours >= 1 && hours <= 6) hours += 12;

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  return null;
}

/**
 * Parse a natural-language date/time string into an ISO datetime.
 * Returns undefined if the string cannot be understood.
 */
export function parseNaturalDate(input: string): string | undefined {
  if (!input || typeof input !== "string") return undefined;

  const text = input.toLowerCase().trim();
  const now = new Date();

  // "in X minutes/hours/days"
  const relativeMatch = text.match(
    /in\s+(\d+)\s*(min(?:utes?)?|hrs?|hours?|days?|weeks?)/,
  );
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const result = new Date(now);
    if (/^min/.test(unit)) result.setMinutes(result.getMinutes() + amount);
    else if (/^h/.test(unit)) result.setHours(result.getHours() + amount);
    else if (/^d/.test(unit)) result.setDate(result.getDate() + amount);
    else if (/^w/.test(unit)) result.setDate(result.getDate() + amount * 7);
    return result.toISOString();
  }

  let targetDate: Date | null = null;

  if (/\btoday\b/.test(text)) {
    targetDate = new Date(now);
  } else if (/\btomorrow\b/.test(text)) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (/\bday after tomorrow\b/.test(text)) {
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (/\btonight\b/.test(text)) {
    targetDate = new Date(now);
  } else {
    const nextDayMatch = text.match(
      /(?:next|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/,
    );
    if (nextDayMatch) {
      const dayIdx = DAYS_OF_WEEK.indexOf(
        nextDayMatch[1] as (typeof DAYS_OF_WEEK)[number],
      );
      if (dayIdx >= 0) {
        targetDate = nextWeekday(dayIdx, now);
      }
    }
  }

  // Try ISO / absolute date: "2025-01-15", "Jan 15", "January 15 2025"
  if (!targetDate) {
    const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const d = new Date(isoMatch[0]);
      if (!isNaN(d.getTime())) targetDate = d;
    }
  }

  if (!targetDate) {
    const monthMatch = text.match(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?\b/,
    );
    if (monthMatch) {
      const monthNames = [
        "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec",
      ];
      const month = monthNames.findIndex((m) =>
        monthMatch[1].startsWith(m),
      );
      const day = parseInt(monthMatch[2], 10);
      const year = monthMatch[3]
        ? parseInt(monthMatch[3], 10)
        : now.getFullYear();
      if (month >= 0 && day >= 1 && day <= 31) {
        targetDate = new Date(year, month, day);
      }
    }
  }

  if (!targetDate) return undefined;

  const time = parseTimeString(text);
  if (time) {
    return setTimeOnDate(targetDate, time.hours, time.minutes).toISOString();
  }

  return setTimeOnDate(targetDate, 9, 0).toISOString();
}
