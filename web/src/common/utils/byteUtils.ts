const BYTES_PER_UNIT = 1024;
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

// "1.4 GB", "350 KB": whole numbers below a megabyte.
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;

  while (value >= BYTES_PER_UNIT && unitIndex < BYTE_UNITS.length - 1) {
    value /= BYTES_PER_UNIT;
    unitIndex += 1;
  }

  const digits = unitIndex >= 2 ? 1 : 0;

  return `${value.toFixed(digits)} ${BYTE_UNITS[unitIndex]}`;
}
