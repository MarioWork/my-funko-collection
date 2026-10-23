import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import tagService, { TagApiSearchFields, TagApiSortingFields } from './tagService';

const UNKNOWN_TAG_ID = 999;

describe('getTags', () => {
  it('sends the page, sort and name filter under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/tags`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await tagService.getTags({
      pagination: { page: '2', size: '20' },
      sortingField: TagApiSortingFields.CREATION_DATE,
      direction: SortingDirectionUtil.DESC,
      [TagApiSearchFields.NAME]: 'box',
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '2',
      size: '20',
      sorting_fields: 'CREATION_DATE',
      direction: 'DESC',
      name: 'box',
    });
  });
});

describe('addTag', () => {
  it('creates the tag and lists it afterwards', async () => {
    const created = await tagService.addTag({ name: 'Box 4', notes: 'Attic' });
    const list = await tagService.getTags({ pagination: { page: '1', size: '10' } });

    expect(created.data).toMatchObject({ name: 'Box 4', notes: 'Attic', itemCount: 0 });
    expect(list.data.map((tag) => tag.name)).toContain('Box 4');
  });

  it('returns the 409 envelope for a taken name', async () => {
    const result = await tagService.addTag({ name: 'Box 1', notes: null });

    expect(result).toMatchObject({ success: false, error: { statusCode: 409 } });
  });
});

describe('updateTag', () => {
  it('returns the renamed tag', async () => {
    const result = await tagService.updateTag(1, { name: 'Box 9' });

    expect(result).toMatchObject({ success: true, data: { id: 1, name: 'Box 9' } });
  });

  it('returns the 404 envelope for an unknown tag', async () => {
    const result = await tagService.updateTag(UNKNOWN_TAG_ID, { name: 'Box 9' });

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});

describe('deleteTag', () => {
  it('deletes the tag, which then no longer lists', async () => {
    const result = await tagService.deleteTag(1);
    const list = await tagService.getTags({ pagination: { page: '1', size: '10' } });

    expect(result.success).toBe(true);
    expect(list.data.map((tag) => tag.name)).not.toContain('Box 1');
  });

  it('returns the 404 envelope for an unknown tag', async () => {
    const result = await tagService.deleteTag(UNKNOWN_TAG_ID);

    expect(result).toMatchObject({ success: false, error: { statusCode: 404 } });
  });
});
