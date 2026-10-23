export const FIRST_PAGE = 1;

// The page numbers to show around the current one: `visible` of them, kept inside 1..last.
export function pageNumbers(current: number, last: number, visible: number): number[] {
  const half = Math.floor(visible / 2);
  const start = Math.max(FIRST_PAGE, Math.min(current - half, last - visible + 1));
  const end = Math.min(last, start + visible - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
