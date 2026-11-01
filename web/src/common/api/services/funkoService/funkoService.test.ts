import { http, HttpResponse } from 'msw/http';
import { FunkoTypeUtil, SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import funkoService, { FunkoApiSearchFields, FunkoApiSortingFields } from './funkoService';

describe('getFunkos', () => {
  it('sends paging, sort and every search field under its wire name', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/funkos`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 2, totalResultNumber: 0 });
      }),
    );

    await funkoService.getFunkos({
      pagination: { page: '2', size: '60' },
      sortingField: FunkoApiSortingFields.NUMBER,
      direction: SortingDirectionUtil.DESC,
      [FunkoApiSearchFields.QUERY]: 'spider',
      [FunkoApiSearchFields.TAG_ID]: '1,2',
      [FunkoApiSearchFields.NOT_IN_COLLECTION_ID]: '1',
      [FunkoApiSearchFields.IS_CHASE]: 'true',
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '2',
      size: '60',
      sorting_fields: 'NUMBER',
      direction: 'DESC',
      q: 'spider',
      tagId: '1,2',
      notInCollectionId: '1',
      isChase: 'true',
    });
  });

  it('returns the seeded page from the mock store with matchedOn when searching', async () => {
    const response = await funkoService.getFunkos({
      pagination: { page: '1', size: '10' },
      [FunkoApiSearchFields.QUERY]: 'thanos',
    });

    expect(response.totalResultNumber).toBe(2);
    expect(response.data[0]).toMatchObject({ name: 'Thanos', matchedOn: ['NAME'] });
  });
});

describe('getFunkoByBarcode', () => {
  it('returns the funko that carries the barcode', async () => {
    const funko = await funkoService.getFunkoByBarcode('889698624008');

    expect(funko).toMatchObject({ name: 'Spider-Man', barcode: '889698624008' });
  });

  it('throws for an unknown barcode so the route error boundary shows', async () => {
    await expect(funkoService.getFunkoByBarcode('000000000000')).rejects.toMatchObject({ response: { status: 404 } });
  });
});

describe('addFunko', () => {
  it('returns the created funko in a success envelope', async () => {
    const result = await funkoService.addFunko({
      name: 'Groot',
      number: '9001',
      type: FunkoTypeUtil.POP,
      categoryId: 1,
      seriesId: 1,
      isChase: false,
      exclusive: '',
      barcode: null,
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ name: 'Groot', number: '9001', collections: [] });
  });

  it('returns the 409 envelope with the existing id instead of throwing', async () => {
    const result = await funkoService.addFunko({
      name: 'Thanos',
      number: '78',
      type: FunkoTypeUtil.POP,
      categoryId: 1,
      seriesId: 1,
      isChase: false,
      exclusive: '',
      barcode: null,
    });

    expect(result).toEqual({
      success: false,
      error: { statusCode: 409, code: 'CONFLICT', message: 'This funko already exists', existingId: 5 },
    });
  });
});

describe('deleteFunko', () => {
  it('sends force=true as a query param only when asked', async () => {
    const receivedQueries: string[] = [];
    server.use(
      http.delete(`${TEST_BASE_API_URL}/funkos/:funkoId`, ({ request }) => {
        receivedQueries.push(new URL(request.url).search);

        return new HttpResponse(null, { status: 204 });
      }),
    );

    await funkoService.deleteFunko(1);
    await funkoService.deleteFunko(1, { force: true });

    expect(receivedQueries).toEqual(['', '?force=true']);
  });

  it('sends the reason in the body only when one is given', async () => {
    const receivedBodies: string[] = [];
    server.use(
      http.delete(`${TEST_BASE_API_URL}/funkos/:funkoId`, async ({ request }) => {
        receivedBodies.push(await request.text());

        return new HttpResponse(null, { status: 204 });
      }),
    );

    await funkoService.deleteFunko(1, { force: true });
    await funkoService.deleteFunko(1, { force: true, reason: 'A double' });

    expect(receivedBodies).toEqual(['', JSON.stringify({ reason: 'A double' })]);
  });

  it('returns the 409 envelope with how many users have it when the funko sits in a collection', async () => {
    const result = await funkoService.deleteFunko(1);

    expect(result.success).toBe(false);
    expect(result.error).toMatchObject({ statusCode: 409, code: 'IN_COLLECTIONS', userCount: 1 });
  });
});
