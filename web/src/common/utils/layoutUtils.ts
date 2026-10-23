// How a list of funkos is shown: a large grid, a small grid, or a list (a table on desktop, rows on phones).
export const FunkoLayoutUtil = { LARGE_GRID: 'large-grid', SMALL_GRID: 'small-grid', LIST: 'list' } as const;
export type FunkoLayoutUtil = (typeof FunkoLayoutUtil)[keyof typeof FunkoLayoutUtil];

export type FunkoGridDensity = 'comfortable' | 'compact';

// The grid density each layout uses; the list has none.
export const LAYOUT_DENSITY_MAP: Record<FunkoLayoutUtil, FunkoGridDensity | null> = {
  [FunkoLayoutUtil.LARGE_GRID]: 'comfortable',
  [FunkoLayoutUtil.SMALL_GRID]: 'compact',
  [FunkoLayoutUtil.LIST]: null,
};

export const DEFAULT_FUNKO_LAYOUT = FunkoLayoutUtil.LARGE_GRID;
