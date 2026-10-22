export const EAN_13_LENGTH = 13;
export const UPC_A_LENGTH = 12;
export const FUNKO_GS1_PREFIX = '889698';
const DIGITS_ONLY = /^\d+$/;

// UPC-A is EAN-13 with a leading zero; the API stores whatever was typed, so the app normalises before it asks.
export function normaliseBarcode(raw: string): string {
  const digits = raw.trim();

  if (!DIGITS_ONLY.test(digits)) return digits;

  return digits.length === UPC_A_LENGTH ? `0${digits}` : digits;
}

export function isLikelyFunkoBarcode(barcode: string): boolean {
  return normaliseBarcode(barcode).includes(FUNKO_GS1_PREFIX);
}

export function isCameraAvailable(): boolean {
  const hasMediaDevices =
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';

  return hasMediaDevices && window.isSecureContext;
}
