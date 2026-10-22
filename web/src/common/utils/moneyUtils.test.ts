import { centsToUnits, formatCents, unitsToCents } from './moneyUtils';

describe('formatCents', () => {
  it('formats cents as euros in the Portuguese locale', () => {
    expect(formatCents(1499).replace(/\u00a0/g, ' ')).toBe('14,99 \u20ac');
  });
});

describe('centsToUnits', () => {
  it('returns two decimals, and an empty string for nothing', () => {
    expect(centsToUnits(1050)).toBe('10.50');
    expect(centsToUnits(null)).toBe('');
  });
});

describe('unitsToCents', () => {
  it('rounds to whole cents', () => {
    expect(unitsToCents('14.99')).toBe(1499);
    expect(unitsToCents(0.1 + 0.2)).toBe(30);
  });
});
