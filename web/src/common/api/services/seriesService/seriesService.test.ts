import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import seriesService, { SeriesApiSearchFields, SeriesApiSortingFields } from './seriesService';

const STRANGER_THINGS_SERIES_ID = 3;
const UNKNOWN_SERIES_ID = 999;

describe('getSeriesList', () => {
  it('sends the page, sort and name filter under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/series`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await seriesService.getSeriesList({
      pagination: { page: '1', size: '10' },
      sortingField: SeriesApiSortingFields.NAME,
      direction: SortingDirectionUtil.ASC,
      [SeriesApiSearchFields.NAME]: 'stranger',
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '1',
      size: '10',
      sorting_fields: 'NAME',
      direction: 'ASC',
      name: 'stranger',
    });
  });

  it('returns the seeded series with their funko counts', async () => {
    const response = await seriesService.getSeriesList({ pagination: { page: '1', size: '10' } });

    expect(response.totalResultNumber).toBe(3);
    expect(response.data.find((series) => series.name === 'Stranger Things')?.funkoCount).toBe(4);
  });
});

describe('addSeries', () => {
  it('returns the new series with no funkos', async () => {
    const result = await seriesService.addSeries({ name: 'Andor' });

    expect(result).toMatchObject({ success: true, data: { name: 'Andor', funkoCount: 0 } });
  });

  it('returns the 409 envelope for a taken name', async () => {
    const result = await seriesService.addSeries({ name: 'Stranger Things' });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});

describe('updateSeries', () => {
  it('returns the renamed series', async () => {
    const result = await seriesService.updateSeries(STRANGER_THINGS_SERIES_ID, { name: 'Stranger Things 5' });

    expect(result).toMatchObject({
      success: true,
      data: { id: STRANGER_THINGS_SERIES_ID, name: 'Stranger Things 5', funkoCount: 4 },
    });
  });

  it('returns the 404 envelope for an unknown series', async () => {
    const result = await seriesService.updateSeries(UNKNOWN_SERIES_ID, { name: 'Andor' });

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('deleteSeries', () => {
  it('returns the 404 envelope for an unknown series', async () => {
    const result = await seriesService.deleteSeries(UNKNOWN_SERIES_ID);

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });

  it('deletes a series still in use, and its funkos lose it', async () => {
    const result = await seriesService.deleteSeries(STRANGER_THINGS_SERIES_ID);
    const remaining = await seriesService.getSeriesList({ pagination: { page: '1', size: '10' } });

    expect(result.success).toBe(true);
    expect(remaining.data.map((series) => series.name)).not.toContain('Stranger Things');
  });
});
