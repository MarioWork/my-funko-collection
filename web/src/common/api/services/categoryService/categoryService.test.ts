import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import categoryService, { CategoryApiSearchFields, CategoryApiSortingFields } from './categoryService';

describe('getCategories', () => {
  it('sends the page, sort and name filter under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/categories`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await categoryService.getCategories({
      pagination: { page: '1', size: '10' },
      sortingField: CategoryApiSortingFields.NAME,
      direction: SortingDirectionUtil.ASC,
      [CategoryApiSearchFields.NAME]: 'marvel',
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '1',
      size: '10',
      sorting_fields: 'NAME',
      direction: 'ASC',
      name: 'marvel',
    });
  });

  it('returns the seeded categories with their funko counts', async () => {
    const response = await categoryService.getCategories({ pagination: { page: '1', size: '10' } });

    expect(response.totalResultNumber).toBe(5);
    expect(response.data.find((category) => category.name === 'Pop! Marvel')?.funkoCount).toBe(8);
  });
});

describe('deleteCategory', () => {
  it('returns the 409 envelope while funkos use the category', async () => {
    const result = await categoryService.deleteCategory(1);

    expect(result).toMatchObject({ success: false, error: { statusCode: 409, code: 'CONFLICT' } });
  });
});
