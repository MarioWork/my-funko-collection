import { normaliseBarcode } from './barcode.ts';

describe('normaliseBarcode', () => {
  it('pads to the 13-digit EAN form when the code is a 12-digit UPC-A', () => {
    expect(normaliseBarcode('889698624008')).toBe('0889698624008');
  });

  it('keeps the code and trims around it when the code is a 13-digit EAN', () => {
    expect(normaliseBarcode(' 0889698624008 ')).toBe('0889698624008');
  });

  it('leaves the code alone when it is not all digits', () => {
    expect(normaliseBarcode('ABC-123')).toBe('ABC-123');
  });
});
