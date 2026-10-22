export const SortingDirectionUtil = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;

export type SortingDirectionUtil = (typeof SortingDirectionUtil)[keyof typeof SortingDirectionUtil];
