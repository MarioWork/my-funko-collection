// What a funkos export can be narrowed to (one category, series, collection, tag or funko), and the query param
// the API reads for each.
export const ExportFunkosScopeUtil = {
  CATEGORY: 'categoryId',
  SERIES: 'seriesId',
  COLLECTION: 'collectionId',
  TAG: 'tagId',
  FUNKO: 'funkoId',
} as const;

export type ExportFunkosScopeUtil = (typeof ExportFunkosScopeUtil)[keyof typeof ExportFunkosScopeUtil];
