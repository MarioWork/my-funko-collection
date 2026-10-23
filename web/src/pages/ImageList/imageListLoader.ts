import type { LoaderFunctionArgs } from 'react-router';
import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE, SortingDirectionUtil } from '@app-types/utility';
import imageService, {
  DEFAULT_IMAGE_SORT_DIRECTION,
  DEFAULT_IMAGE_SORT_FIELD,
  ImageApiSearchFields,
  ImageApiSortingFields,
} from '@services/imageService/imageService';
import {
  DEFAULT_IMAGE_VIEW,
  IMAGE_GROUP_PAGE_SIZE,
  IMAGE_PAGE_SIZE,
  IMAGE_VIEW_PARAM,
  ImageViewUtil,
} from './imageListUtils';

const SORT_FIELDS = new Set<string>(Object.values(ImageApiSortingFields));
const DIRECTIONS = new Set<string>(Object.values(SortingDirectionUtil));

type SearchFields = Partial<Record<ImageApiSearchFields, string>>;

function readSearchFields(searchParams: URLSearchParams): SearchFields {
  const fields: SearchFields = {};

  for (const field of Object.values(ImageApiSearchFields)) {
    const value = searchParams.get(field);

    if (value) fields[field] = value;
  }

  return fields;
}

// Reads the list state from the URL (view, search, filter, sort, page) and loads that page: of images, or of
// funko groups when the list is grouped by funko.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const sortParam = searchParams.get(ApiUrlParamsUtil.sorting_fields) ?? '';
  const directionParam = searchParams.get(ApiUrlParamsUtil.sortingDirection) ?? '';
  const sortField = SORT_FIELDS.has(sortParam) ? (sortParam as ImageApiSortingFields) : DEFAULT_IMAGE_SORT_FIELD;
  const direction = DIRECTIONS.has(directionParam)
    ? (directionParam as SortingDirectionUtil)
    : DEFAULT_IMAGE_SORT_DIRECTION;
  const page = searchParams.get(ApiUrlParamsUtil.page) ?? DEFAULT_FIRST_PAGE;
  const viewParam = searchParams.get(IMAGE_VIEW_PARAM) ?? DEFAULT_IMAGE_VIEW;
  const isGrouped = viewParam !== ImageViewUtil.IMAGES;
  const pageSize = isGrouped ? IMAGE_GROUP_PAGE_SIZE : IMAGE_PAGE_SIZE;
  const fields = {
    pagination: { page, size: pageSize },
    sortingField: sortField,
    direction,
    ...readSearchFields(searchParams),
  };

  const [imagesResponse, groupsResponse] = isGrouped
    ? [null, await imageService.getImageGroups(fields)]
    : [await imageService.getImages(fields), null];

  return {
    view: isGrouped ? ImageViewUtil.FUNKOS : ImageViewUtil.IMAGES,
    imagesResponse,
    groupsResponse,
    total: (imagesResponse ?? groupsResponse).totalResultNumber,
    sort: { field: sortField, direction },
    page: Number(page),
    pageSize: Number(pageSize),
  };
}
