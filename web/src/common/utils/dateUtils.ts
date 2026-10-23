import { LOCALE } from '@utils/localeUtils';

// `YYYY-MM-DD` → "2 mar. 2024"; the API stores purchase dates as calendar days, not instants.
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);

  if (!year || !month || !day) return isoDate;

  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

export function formatDateTime(isoDateTime: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoDateTime));
}

// An instant, as its calendar day only, in the same style as formatIsoDate: "5 jan. 2026".
export function formatDate(isoDateTime: string): string {
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(isoDateTime),
  );
}
