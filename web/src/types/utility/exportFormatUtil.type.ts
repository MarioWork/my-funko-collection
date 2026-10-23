// The file formats a funkos export comes in; the value is the file extension the API serves.
export const ExportFormatUtil = {
  SPREADSHEET: 'xlsx',
  CSV: 'csv',
  JSON: 'json',
} as const;

export type ExportFormatUtil = (typeof ExportFormatUtil)[keyof typeof ExportFormatUtil];
