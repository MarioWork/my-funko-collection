import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import writeExcelFile from 'write-excel-file/browser';
import { MOCK_DELAY } from '@mocks/handlers';
import { mockStore, type MockImageRow } from '@mocks/mockStore';
import { attachment, CSV_CONTENT_TYPE, toCsvLine, XLSX_CONTENT_TYPE, type Cell } from './funkosExportMockUtils';

const FILE_BASE = 'my-funko-collection-images';
const CSV_LINE_BREAK = '\r\n';
const CSV_HEADER = [
  'funko_id',
  'funko_name',
  'funko_number',
  'file_name',
  'is_main',
  'width',
  'height',
  'size_bytes',
  'uploaded_at',
  'url',
  'medium_url',
  'small_url',
];
// The demo's image urls are already full addresses; the file name is the url's last segment.
const LAST_SEGMENT = /[^/]+$/;

function toImageExport(image: MockImageRow) {
  const funko = mockStore.funkos.find((candidate) => candidate.id === image.funkoId);

  return {
    funkoId: image.funkoId,
    funkoName: funko?.name ?? null,
    funkoNumber: funko?.number ?? null,
    fileName: LAST_SEGMENT.exec(image.url)?.[0] ?? image.url,
    isMain: image.position === 0,
    width: image.width,
    height: image.height,
    sizeBytes: image.sizeBytes,
    uploadedAt: image.createdAt,
    url: image.url,
    mediumUrl: image.mediumUrl,
    smallUrl: image.smallUrl,
  };
}

function toRows(): Cell[][] {
  return mockStore.images.map((image) => Object.values(toImageExport(image)));
}

// GET /export/images.{csv,json,xlsx}: every image's details and links, like the API.
export default (baseUrl: string) => [
  http.get(`${baseUrl}/export/images.csv`, async () => {
    await delay(MOCK_DELAY);

    const csv = [CSV_HEADER.join(','), ...toRows().map(toCsvLine)].join(CSV_LINE_BREAK) + CSV_LINE_BREAK;

    return new HttpResponse(csv, {
      headers: { 'content-type': CSV_CONTENT_TYPE, 'content-disposition': attachment(`${FILE_BASE}.csv`) },
    });
  }),
  http.get(`${baseUrl}/export/images.json`, async () => {
    await delay(MOCK_DELAY);

    return HttpResponse.json(
      { exportedAt: new Date().toISOString(), images: mockStore.images.map(toImageExport) },
      { headers: { 'content-disposition': attachment(`${FILE_BASE}.json`) } },
    );
  }),
  http.get(`${baseUrl}/export/images.xlsx`, async () => {
    await delay(MOCK_DELAY);

    const header = CSV_HEADER.map((title) => ({ value: title, fontWeight: 'bold' as const }));
    const blob = await writeExcelFile([header, ...toRows()]).toBlob();

    return new HttpResponse(blob, {
      headers: { 'content-type': XLSX_CONTENT_TYPE, 'content-disposition': attachment(`${FILE_BASE}.xlsx`) },
    });
  }),
];
