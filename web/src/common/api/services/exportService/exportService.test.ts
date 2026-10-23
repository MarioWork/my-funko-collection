import { ExportFormatUtil, ExportFunkosScopeUtil, ExportListKindUtil } from '@app-types/utility';
import exportService from './exportService';

// Reads the whole file, like a browser saving it. A body left unread keeps the mocked socket paused, and closing it
// then makes undici assert (an unhandled error that fails the run even when every test passes).
async function download(url: string): Promise<Response> {
  const response = await fetch(url);

  await response.arrayBuffer();

  return response;
}

describe('getFunkosExportUrl', () => {
  it.each([
    [ExportFunkosScopeUtil.CATEGORY, 'categoryId'],
    [ExportFunkosScopeUtil.SERIES, 'seriesId'],
    [ExportFunkosScopeUtil.COLLECTION, 'collectionId'],
    [ExportFunkosScopeUtil.TAG, 'tagId'],
  ])('points at the funkos file narrowed by %s when given an id', (scope, param) => {
    expect(exportService.getFunkosExportUrl(ExportFormatUtil.CSV, scope, 7)).toMatch(
      new RegExp(`/export/funkos\\.csv\\?${param}=7$`),
    );
  });

  it.each([ExportFormatUtil.SPREADSHEET, ExportFormatUtil.CSV, ExportFormatUtil.JSON])(
    'downloads a .%s file named after the category when asked for that format',
    async (format) => {
      const response = await download(exportService.getFunkosExportUrl(format, ExportFunkosScopeUtil.CATEGORY, 1));

      expect(response.status).toBe(200);
      expect(response.headers.get('content-disposition')).toMatch(
        new RegExp(`filename="category-[a-z0-9-]+\\.${format}"`),
      );
    },
  );

  it('answers 404 when the category does not exist', async () => {
    const response = await download(
      exportService.getFunkosExportUrl(ExportFormatUtil.JSON, ExportFunkosScopeUtil.CATEGORY, 999),
    );

    expect(response.status).toBe(404);
  });
});

describe('getListExportUrl', () => {
  it.each([true, false])('downloads every tag with includeFunkos=%s as a named file', async (includeFunkos) => {
    const response = await download(
      exportService.getListExportUrl(ExportFormatUtil.CSV, ExportListKindUtil.TAGS, includeFunkos),
    );
    const suffix = includeFunkos ? '-with-funkos' : '';

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toBe(
      `attachment; filename="my-funko-collection-tags${suffix}.csv"`,
    );
  });
});

describe('getImagesExportUrl', () => {
  it.each([ExportFormatUtil.SPREADSHEET, ExportFormatUtil.CSV, ExportFormatUtil.JSON])(
    'downloads every image as a .%s file when asked for that format',
    async (format) => {
      const response = await download(exportService.getImagesExportUrl(format));

      expect(response.status).toBe(200);
      expect(response.headers.get('content-disposition')).toBe(
        `attachment; filename="my-funko-collection-images.${format}"`,
      );
    },
  );
});
