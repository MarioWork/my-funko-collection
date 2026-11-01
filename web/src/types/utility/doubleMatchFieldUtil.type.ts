// Why another funko may be the same one as a submission (the API's `matchedOn` on a possible double).
export const DoubleMatchFieldUtil = {
  BARCODE: 'BARCODE',
  NUMBER_AND_CATEGORY: 'NUMBER_AND_CATEGORY',
} as const;
export type DoubleMatchFieldUtil = (typeof DoubleMatchFieldUtil)[keyof typeof DoubleMatchFieldUtil];

export const DOUBLE_MATCH_FIELD_LABELS: Record<DoubleMatchFieldUtil, string> = {
  [DoubleMatchFieldUtil.BARCODE]: 'same barcode',
  [DoubleMatchFieldUtil.NUMBER_AND_CATEGORY]: 'same number and category',
};
