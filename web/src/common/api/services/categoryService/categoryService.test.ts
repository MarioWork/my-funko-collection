import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import categoryService, { CategoryApiSearchFields, CategoryApiSortingFields } from './categoryService';

const MARVEL_CATEGORY_ID = 1;
const UNKNOWN_CATEGORY_ID = 999;

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

describe('addCategory', () => {
  it('returns the new category with no funkos', async () => {
    const result = await categoryService.addCategory({ name: 'Pop! Movies' });

    expect(result).toMatchObject({ success: true, data: { name: 'Pop! Movies', funkoCount: 0 } });
  });

  it('returns the 409 envelope for a taken name', async () => {
    const result = await categoryService.addCategory({ name: 'Star Wars' });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});

describe('updateCategory', () => {
  it('returns the renamed category', async () => {
    const result = await categoryService.updateCategory(MARVEL_CATEGORY_ID, { name: 'Marvel' });

    expect(result).toMatchObject({ success: true, data: { id: MARVEL_CATEGORY_ID, name: 'Marvel', funkoCount: 8 } });
  });

  it('returns the 404 envelope for an unknown category', async () => {
    const result = await categoryService.updateCategory(UNKNOWN_CATEGORY_ID, { name: 'Marvel' });

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('deleteCategory', () => {
  it('deletes a category no funko uses', async () => {
    const created = await categoryService.addCategory({ name: 'Pop! Movies' });

    const result = await categoryService.deleteCategory(created.data?.id ?? UNKNOWN_CATEGORY_ID);

    expect(result.success).toBe(true);
  });

  it('returns the 409 envelope while funkos use the category', async () => {
    const result = await categoryService.deleteCategory(MARVEL_CATEGORY_ID);

    expect(result).toMatchObject({ success: false, error: { statusCode: 409, code: 'CONFLICT' } });
  });
});
