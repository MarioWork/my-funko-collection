import axios from 'axios';
import type { ImageGroupApiModel, ImageListEntryApiModel } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  SortingDirectionUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';

const BASE_IMAGES_URL = '/images';
const GROUPS_SEGMENT = 'groups';

export default {
  // Read-only: every stored image, including loose files no funko uses. Writes go through a funko's images.
  getImages: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetImagesFields): Promise<ResponseWithPaginationUtil<ImageListEntryApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<ImageListEntryApiModel>>(BASE_IMAGES_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
        [ApiUrlParamsUtil.sorting_fields]: sortingField,
        [ApiUrlParamsUtil.sortingDirection]: direction,
        ...searchFields,
      },
    });

    return response.data;
  },

  // The same images, one group per funko (count and total size), the loose files last. Groups are paged.
  getImageGroups: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetImagesFields): Promise<ResponseWithPaginationUtil<ImageGroupApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<ImageGroupApiModel>>(
      `${BASE_IMAGES_URL}/${GROUPS_SEGMENT}`,
      {
        params: {
          [ApiUrlParamsUtil.page]: pagination.page,
          [ApiUrlParamsUtil.pageSize]: pagination.size,
          [ApiUrlParamsUtil.sorting_fields]: sortingField,
          [ApiUrlParamsUtil.sortingDirection]: direction,
          ...searchFields,
        },
      },
    );

    return response.data;
  },
};

export const ImageApiSortingFields = {
  CREATION_DATE: 'CREATION_DATE',
  SIZE: 'SIZE',
  NAME: 'NAME',
} as const;
export type ImageApiSortingFields = (typeof ImageApiSortingFields)[keyof typeof ImageApiSortingFields];

export const ImageApiSearchFields = {
  // Contains, in the funko's name or the file name.
  QUERY: 'q',
  // "false": only loose files no funko uses.
  HAS_FUNKO: 'hasFunko',
} as const;
export type ImageApiSearchFields = (typeof ImageApiSearchFields)[keyof typeof ImageApiSearchFields];

type SearchFields = { [key in ImageApiSearchFields]?: string };

export type GetImagesFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: ImageApiSortingFields;
} & SearchFields;

export const DEFAULT_IMAGE_SORT_FIELD = ImageApiSortingFields.SIZE;
export const DEFAULT_IMAGE_SORT_DIRECTION = SortingDirectionUtil.DESC;
