import { isLikelyFunkoBarcode, normaliseBarcode } from './barcodeUtils';

describe('normaliseBarcode', () => {
  it('pads a 12-digit UPC-A to EAN-13 and leaves EAN-13 alone', () => {
    expect(normaliseBarcode('889698624008')).toBe('0889698624008');
    expect(normaliseBarcode('5060631480000')).toBe('5060631480000');
  });

  it('returns non-numeric input trimmed and unchanged', () => {
    expect(normaliseBarcode(' abc ')).toBe('abc');
  });
});

describe('isLikelyFunkoBarcode', () => {
  it('recognises the Funko GS1 prefix in either form', () => {
    expect(isLikelyFunkoBarcode('889698624008')).toBe(true);
    expect(isLikelyFunkoBarcode('4005556001187')).toBe(false);
  });
});
