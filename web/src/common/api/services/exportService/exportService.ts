import axios from 'axios';
import type { ExportFormatUtil, ExportFunkosScopeUtil, ExportListKindUtil } from '@app-types/utility';

const BASE_EXPORT_URL = '/export';
const ITEMS_CSV_SEGMENT = 'items.csv';
const FUNKOS_FILE_NAME = 'funkos';
export const INCLUDE_FUNKOS_PARAM = 'includeFunkos';
const IMAGES_FILE_NAME = 'images';

function exportUrl(segment: string): string {
  return `${axios.defaults.baseURL ?? ''}${BASE_EXPORT_URL}/${segment}`;
}

// Plain downloads: the browser follows these links; no axios call is involved.
export default {
  getExportJsonUrl: (): string => `${axios.defaults.baseURL ?? ''}${BASE_EXPORT_URL}`,
  getExportCsvUrl: (): string => exportUrl(ITEMS_CSV_SEGMENT),
  // The funkos of one category, series, collection or tag, as a spreadsheet, CSV or JSON file.
  getFunkosExportUrl: (format: ExportFormatUtil, scope: ExportFunkosScopeUtil, id: number): string => {
    const params = new URLSearchParams({ [scope]: String(id) });

    return `${exportUrl(`${FUNKOS_FILE_NAME}.${format}`)}?${params.toString()}`;
  },
  // A whole list (every category, series, collection or tag), with or without the funkos of each.
  getListExportUrl: (format: ExportFormatUtil, kind: ExportListKindUtil, includeFunkos: boolean): string => {
    const params = new URLSearchParams({ [INCLUDE_FUNKOS_PARAM]: String(includeFunkos) });

    return `${exportUrl(`${kind}.${format}`)}?${params.toString()}`;
  },
  // Every stored image: what it is and links to it, not the files.
  getImagesExportUrl: (format: ExportFormatUtil): string => exportUrl(`${IMAGES_FILE_NAME}.${format}`),
};
