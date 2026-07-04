import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";

export function monthRange(month?: string | null) {
  const base = month ? parseISO(`${month}-01`) : new Date();
  return { start: startOfMonth(base), end: endOfMonth(base), month: format(base, "yyyy-MM") };
}

export function toDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}
