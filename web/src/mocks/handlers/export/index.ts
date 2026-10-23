import getExportHandler from './getExport.mock.handler';
import getFunkosCsvHandler from './getFunkosCsv.mock.handler';
import getFunkosJsonHandler from './getFunkosJson.mock.handler';
import getFunkosSpreadsheetHandler from './getFunkosSpreadsheet.mock.handler';
import getImagesExportHandler from './getImagesExport.mock.handler';
import getListExportHandler from './getListExport.mock.handler';

export const exportMockHandlers = (baseUrl: string) => [
  ...getExportHandler(baseUrl),
  ...getFunkosCsvHandler(baseUrl),
  ...getFunkosJsonHandler(baseUrl),
  ...getFunkosSpreadsheetHandler(baseUrl),
  ...getListExportHandler(baseUrl),
  ...getImagesExportHandler(baseUrl),
];
