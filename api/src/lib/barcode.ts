const UPC_A_LENGTH = 12;
const DIGITS_ONLY = /^\d+$/;

// A UPC-A code (12 digits, what US boxes carry) is the EAN-13 code with a leading zero. Scanners report one or the
// other depending on the symbology they picked, so every barcode is stored and looked up in the 13-digit form.
export function normaliseBarcode(raw: string): string {
  const digits = raw.trim();

  if (!DIGITS_ONLY.test(digits)) return digits;

  return digits.length === UPC_A_LENGTH ? `0${digits}` : digits;
}
