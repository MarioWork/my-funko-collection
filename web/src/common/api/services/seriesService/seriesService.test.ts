import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import seriesService, { SeriesApiSearchFields, SeriesApiSortingFields } from './seriesService';

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

describe('deleteSeries', () => {
  it('deletes a series still in use, and its funkos lose it', async () => {
    const strangerThingsId = 3;

    const result = await seriesService.deleteSeries(strangerThingsId);
    const remaining = await seriesService.getSeriesList({ pagination: { page: '1', size: '10' } });

    expect(result.success).toBe(true);
    expect(remaining.data.map((series) => series.name)).not.toContain('Stranger Things');
  });
});
