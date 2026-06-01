export const INDIA_TIMEZONE = "Asia/Kolkata";

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);

export const formatIndiaDate = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIMEZONE,
    ...options
  }).format(new Date(value));

export const formatIndiaShortDate = (value: string | Date) =>
  formatIndiaDate(value, { day: "2-digit", month: "short" });

export const formatIndiaChartDate = (value: string | Date) =>
  formatIndiaDate(value, { day: "2-digit", month: "2-digit" });
