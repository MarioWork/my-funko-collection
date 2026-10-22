import getExportHandler from './getExport.mock.handler';

export const exportMockHandlers = (baseUrl: string) => [...getExportHandler(baseUrl)];
