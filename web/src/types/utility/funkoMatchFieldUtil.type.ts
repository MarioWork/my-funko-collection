// Which fields a free-text search hit; the API returns it as `matchedOn`.
export const FunkoMatchFieldUtil = {
  ID: 'ID',
  NAME: 'NAME',
  NUMBER: 'NUMBER',
  BARCODE: 'BARCODE',
  EXCLUSIVE: 'EXCLUSIVE',
  CATEGORY: 'CATEGORY',
  SERIES: 'SERIES',
  TAG: 'TAG',
  COLLECTION: 'COLLECTION',
} as const;
export type FunkoMatchFieldUtil = (typeof FunkoMatchFieldUtil)[keyof typeof FunkoMatchFieldUtil];

export const FUNKO_MATCH_FIELD_LABELS: Record<FunkoMatchFieldUtil, string> = {
  ID: 'id',
  NAME: 'name',
  NUMBER: 'number',
  BARCODE: 'barcode',
  EXCLUSIVE: 'exclusive',
  CATEGORY: 'category',
  SERIES: 'series',
  TAG: 'tag',
  COLLECTION: 'collection',
};
