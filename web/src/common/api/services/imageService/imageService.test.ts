import { http, HttpResponse } from 'msw/http';
import { SortingDirectionUtil } from '@app-types/utility';
import { TEST_BASE_API_URL, server } from '@mocks/server';
import imageService, { ImageApiSearchFields, ImageApiSortingFields } from './imageService';

describe('getImages', () => {
  it('sends the page, sort and filters under their wire names', async () => {
    let receivedQuery = new URLSearchParams();
    server.use(
      http.get(`${TEST_BASE_API_URL}/images`, ({ request }) => {
        receivedQuery = new URL(request.url).searchParams;

        return HttpResponse.json({ data: [], currentPage: 1, totalResultNumber: 0 });
      }),
    );

    await imageService.getImages({
      pagination: { page: '2', size: '25' },
      sortingField: ImageApiSortingFields.SIZE,
      direction: SortingDirectionUtil.DESC,
      [ImageApiSearchFields.QUERY]: 'eleven',
      [ImageApiSearchFields.HAS_FUNKO]: 'false',
    });

    expect(Object.fromEntries(receivedQuery)).toEqual({
      page: '2',
      size: '25',
      sorting_fields: 'SIZE',
      direction: 'DESC',
      q: 'eleven',
      hasFunko: 'false',
    });
  });

  it('groups the mock images by funko with the loose file last', async () => {
    const response = await imageService.getImageGroups({ pagination: { page: '1', size: '100' } });
    const lastGroup = response.data.at(-1);

    expect(lastGroup?.funko).toBeNull();
    expect(response.data[0]?.imageCount).toBe(response.data[0]?.images.length);
  });

  it('lists the mock images, the loose file included', async () => {
    const response = await imageService.getImages({
      pagination: { page: '1', size: '100' },
      [ImageApiSearchFields.HAS_FUNKO]: 'false',
    });

    expect(response.data).toHaveLength(1);
    expect(response.data[0]?.funko).toBeNull();
  });
});
