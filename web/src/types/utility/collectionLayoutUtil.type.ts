// The Collections page as a grid of cards (the default) or as a table, like the funkos page's list.
export const CollectionLayoutUtil = {
  GRID: 'grid',
  LIST: 'list',
} as const;

export type CollectionLayoutUtil = (typeof CollectionLayoutUtil)[keyof typeof CollectionLayoutUtil];
