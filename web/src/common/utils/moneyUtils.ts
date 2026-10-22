const CENTS_PER_UNIT = 100;
const LOCALE = 'pt-PT';
export const DEFAULT_CURRENCY = 'EUR';

export function formatCents(cents: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(cents / CENTS_PER_UNIT);
}

export function centsToUnits(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? '' : (cents / CENTS_PER_UNIT).toFixed(2);
}

export function unitsToCents(units: string | number): number {
  return Math.round(Number(units) * CENTS_PER_UNIT);
}
