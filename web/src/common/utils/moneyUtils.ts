import { LOCALE } from '@utils/localeUtils';

const CENTS_PER_UNIT = 100;
// A price field shows whole cents: "12.50".
const PRICE_DECIMALS = 2;
export const DEFAULT_CURRENCY = 'EUR';

export function formatCents(cents: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(cents / CENTS_PER_UNIT);
}

export function centsToUnits(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? '' : (cents / CENTS_PER_UNIT).toFixed(PRICE_DECIMALS);
}

export function unitsToCents(units: string | number): number {
  return Math.round(Number(units) * CENTS_PER_UNIT);
}
