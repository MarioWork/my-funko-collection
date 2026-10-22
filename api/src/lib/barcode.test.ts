import { describe, expect, it } from 'vitest';
import { normaliseBarcode } from './barcode.ts';

describe('normaliseBarcode', () => {
  it('pads a 12-digit UPC-A to the 13-digit EAN form', () => {
    expect(normaliseBarcode('889698624008')).toBe('0889698624008');
  });

  it('keeps a 13-digit EAN and trims around it', () => {
    expect(normaliseBarcode(' 0889698624008 ')).toBe('0889698624008');
  });

  it('leaves anything that is not all digits alone', () => {
    expect(normaliseBarcode('ABC-123')).toBe('ABC-123');
  });
});
