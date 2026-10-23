import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { ImageGroupApiModel, ImageListEntryApiModel } from '@app-types/models';
import { ApiUrlParamsUtil, SortingDirectionUtil, type ResponseWithPaginationUtil } from '@app-types/utility';
import { MOCK_DELAY } from '@mocks/handlers';
import { ImageApiSearchFields, ImageApiSortingFields } from '@services/imageService/imageService';
import { allImageEntries } from './imageMockUtils';

const LOOSE_GROUP_KEY = 'loose';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

type GroupComparator = (first: ImageGroupApiModel, second: ImageGroupApiModel) => number;

const GROUP_COMPARATORS: Record<string, GroupComparator> = {
  [ImageApiSortingFields.SIZE]: (first, second) => first.sizeBytes - second.sizeBytes,
  [ImageApiSortingFields.CREATION_DATE]: (first, second) => first.newestCreatedAt.localeCompare(second.newestCreatedAt),
  [ImageApiSortingFields.NAME]: (first, second) => (first.funko?.name ?? '').localeCompare(second.funko?.name ?? ''),
};

function matchesParams(entry: ImageListEntryApiModel, params: URLSearchParams): boolean {
  const query = params.get(ImageApiSearchFields.QUERY)?.toLowerCase();
  const hasFunko = params.get(ImageApiSearchFields.HAS_FUNKO);
  const isTextMatch = !query || `${entry.funko?.name ?? ''} ${entry.fileName}`.toLowerCase().includes(query);
  const isFunkoMatch = !hasFunko || String(entry.funko !== null) === hasFunko;

  return isTextMatch && isFunkoMatch;
}

function toGroup(key: string, images: ImageListEntryApiModel[]): ImageGroupApiModel {
  return {
    key,
    funko: images[0]?.funko ?? null,
    imageCount: images.length,
    sizeBytes: images.reduce((total, image) => total + image.sizeBytes, 0),
    newestCreatedAt: images.reduce((latest, image) => (image.createdAt > latest ? image.createdAt : latest), ''),
    images,
  };
}

// As the API does: filter the images, group them per funko, sort the funko groups, the loose files last, then page.
export default (baseUrl: string) => [
  http.get(
    `${baseUrl}/images/groups`,
    async ({ request }): Promise<HttpResponse<ResponseWithPaginationUtil<ImageGroupApiModel>>> => {
      await delay(MOCK_DELAY);

      const params = new URL(request.url).searchParams;
      const byGroup = new Map<string, ImageListEntryApiModel[]>();

      for (const entry of allImageEntries().filter((image) => matchesParams(image, params))) {
        const key = entry.funko ? String(entry.funko.id) : LOOSE_GROUP_KEY;

        byGroup.set(key, [...(byGroup.get(key) ?? []), entry]);
      }

      const groups = [...byGroup.entries()].map(([key, images]) => toGroup(key, images));
      const compare = GROUP_COMPARATORS[params.get(ApiUrlParamsUtil.sorting_fields) ?? ''] ?? GROUP_COMPARATORS.SIZE;
      const factor = params.get(ApiUrlParamsUtil.sortingDirection) === SortingDirectionUtil.ASC ? 1 : -1;
      const funkoGroups = groups
        .filter((group) => group.funko)
        .sort((first, second) => compare(first, second) * factor);
      const ordered = [...funkoGroups, ...groups.filter((group) => !group.funko)];
      const page = Number(params.get(ApiUrlParamsUtil.page) ?? DEFAULT_PAGE);
      const size = Number(params.get(ApiUrlParamsUtil.pageSize) ?? DEFAULT_PAGE_SIZE);

      return HttpResponse.json({
        data: ordered.slice((page - 1) * size, page * size),
        totalResultNumber: ordered.length,
        currentPage: page,
      });
    },
  ),
];
