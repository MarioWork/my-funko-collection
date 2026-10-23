// How a list of funkos is shown: a large grid, a small grid, or a list (a table on desktop, rows on phones).
export const FunkoLayoutUtil = {
  LARGE_GRID: 'large-grid',
  SMALL_GRID: 'small-grid',
  LIST: 'list',
} as const;

export type FunkoLayoutUtil = (typeof FunkoLayoutUtil)[keyof typeof FunkoLayoutUtil];
