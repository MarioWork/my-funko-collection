import axios from 'axios';

const BASE_EXPORT_URL = '/export';
const ITEMS_CSV_SEGMENT = 'items.csv';

// Plain downloads: the browser follows these links; no axios call is involved.
export default {
  getExportJsonUrl: (): string => `${axios.defaults.baseURL ?? ''}${BASE_EXPORT_URL}`,
  getExportCsvUrl: (): string => `${axios.defaults.baseURL ?? ''}${BASE_EXPORT_URL}/${ITEMS_CSV_SEGMENT}`,
};
