const BYTES_PER_UNIT = 1024;
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];
// From a megabyte up, one decimal: "1.4 GB".
const FIRST_DECIMAL_UNIT_INDEX = 2;
const LARGE_UNIT_DIGITS = 1;
const SMALL_UNIT_DIGITS = 0;

// "1.4 GB", "350 KB": whole numbers below a megabyte.
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;

  while (value >= BYTES_PER_UNIT && unitIndex < BYTE_UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unitIndex += 1;
  }

  const digits = unitIndex >= FIRST_DECIMAL_UNIT_INDEX ? LARGE_UNIT_DIGITS : SMALL_UNIT_DIGITS;

  return `${value.toFixed(digits)} ${BYTE_UNITS[unitIndex]}`;
}
