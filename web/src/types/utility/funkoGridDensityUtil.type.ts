// How tightly a grid of funko cards is packed: the large grid is comfortable, the small grid compact.
export const FunkoGridDensityUtil = {
  COMFORTABLE: 'comfortable',
  COMPACT: 'compact',
} as const;

export type FunkoGridDensityUtil = (typeof FunkoGridDensityUtil)[keyof typeof FunkoGridDensityUtil];
