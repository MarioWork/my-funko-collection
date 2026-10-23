import { normaliseBarcode } from './barcodeUtils';

describe('normaliseBarcode', () => {
  it('pads a 12-digit UPC-A to EAN-13 and leaves EAN-13 alone', () => {
    expect(normaliseBarcode('889698624008')).toBe('0889698624008');
    expect(normaliseBarcode('5060631480000')).toBe('5060631480000');
  });

  it('returns non-numeric input trimmed and unchanged', () => {
    expect(normaliseBarcode(' abc ')).toBe('abc');
  });
});
