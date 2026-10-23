// The lists that can be exported whole; the value is the file name the API serves (/export/categories.xlsx).
export const ExportListKindUtil = {
  CATEGORIES: 'categories',
  SERIES: 'series',
  COLLECTIONS: 'collections',
  TAGS: 'tags',
} as const;

export type ExportListKindUtil = (typeof ExportListKindUtil)[keyof typeof ExportListKindUtil];
