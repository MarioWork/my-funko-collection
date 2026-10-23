import type { LoaderFunctionArgs } from 'react-router';
import { ApiUrlParamsUtil, DEFAULT_FIRST_PAGE } from '@app-types/utility';
import imageService, {
  DEFAULT_IMAGE_SORT_DIRECTION,
  DEFAULT_IMAGE_SORT_FIELD,
  ImageApiSearchFields,
  ImageApiSortingFields,
} from '@services/imageService/imageService';
import { readSearchFields, readSortDirection, readSortField } from '@utils/listParamsUtils';
import { ImageViewUtil, readStoredImageView } from '@utils/layoutUtils';
import { IMAGE_GROUP_PAGE_SIZE, IMAGE_PAGE_SIZE, IMAGE_VIEW_PARAM } from './imageListUtils';

const SORT_FIELDS = Object.values(ImageApiSortingFields);
const SEARCH_FIELDS = Object.values(ImageApiSearchFields);

// Reads the list state from the URL (view, search, filter, sort, page) and loads that page: of images, or of
// funko groups when the list is grouped by funko.
export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const sortParam = searchParams.get(ApiUrlParamsUtil.sorting_fields) ?? '';
  const directionParam = searchParams.get(ApiUrlParamsUtil.sortingDirection) ?? '';
  const sortField = readSortField(sortParam, SORT_FIELDS) ?? DEFAULT_IMAGE_SORT_FIELD;
  const direction = readSortDirection(directionParam) ?? DEFAULT_IMAGE_SORT_DIRECTION;
  const page = searchParams.get(ApiUrlParamsUtil.page) ?? DEFAULT_FIRST_PAGE;
  // A view in the URL wins; otherwise the one saved on this device (Settings → Layouts, or the last one picked).
  const viewParam = searchParams.get(IMAGE_VIEW_PARAM) ?? readStoredImageView();
  const isGrouped = viewParam !== ImageViewUtil.IMAGES;
  const pageSize = isGrouped ? IMAGE_GROUP_PAGE_SIZE : IMAGE_PAGE_SIZE;
  const fields = {
    pagination: { page, size: pageSize },
    sortingField: sortField,
    direction,
    ...readSearchFields(searchParams, SEARCH_FIELDS),
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
