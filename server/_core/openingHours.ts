export type OpeningHoursDay = {
  enabled: boolean;
  open: string;
  close: string;
};

export type OpeningHoursMap = Record<
  "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat",
  OpeningHoursDay
>;

export const DEFAULT_OPENING_HOURS: OpeningHoursMap = {
  sun: { enabled: false, open: "08:00", close: "18:00" },
  mon: { enabled: true, open: "08:00", close: "18:00" },
  tue: { enabled: true, open: "08:00", close: "18:00" },
  wed: { enabled: true, open: "08:00", close: "18:00" },
  thu: { enabled: true, open: "08:00", close: "18:00" },
  fri: { enabled: true, open: "08:00", close: "18:00" },
  sat: { enabled: true, open: "08:00", close: "14:00" },
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function isTimeString(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

export function parseOpeningHours(value?: string | null): OpeningHoursMap {
  if (!value) return DEFAULT_OPENING_HOURS;

  try {
    const parsed = JSON.parse(value) as Partial<OpeningHoursMap>;
    return DAY_KEYS.reduce((acc, key) => {
      const source = parsed?.[key];
      acc[key] = {
        enabled:
          typeof source?.enabled === "boolean"
            ? source.enabled
            : DEFAULT_OPENING_HOURS[key].enabled,
        open: isTimeString(source?.open)
          ? source.open
          : DEFAULT_OPENING_HOURS[key].open,
        close: isTimeString(source?.close)
          ? source.close
          : DEFAULT_OPENING_HOURS[key].close,
      };
      return acc;
    }, {} as OpeningHoursMap);
  } catch {
    return DEFAULT_OPENING_HOURS;
  }
}

export function stringifyOpeningHours(value: OpeningHoursMap) {
  return JSON.stringify(value);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getBrazilNowParts(now: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find(part => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find(part => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? "0");

  const weekdayMap: Record<string, keyof OpeningHoursMap> = {
    Sun: "sun",
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  };

  return {
    dayKey: weekdayMap[weekday] ?? "mon",
    minutesNow: hour * 60 + minute,
  };
}

export function isOpenNow(openingHoursJson?: string | null, now = new Date()) {
  const openingHours = parseOpeningHours(openingHoursJson);
  const { dayKey, minutesNow } = getBrazilNowParts(now);
  const config = openingHours[dayKey];

  if (!config.enabled) return false;

  const openMinutes = timeToMinutes(config.open);
  const closeMinutes = timeToMinutes(config.close);

  if (closeMinutes <= openMinutes) {
    return minutesNow >= openMinutes || minutesNow < closeMinutes;
  }

  return minutesNow >= openMinutes && minutesNow < closeMinutes;
}
