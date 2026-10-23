import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { SeriesApiModel, SeriesId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
} from '@app-types/utility';
import type { CreateSeries, UpdateSeries } from './seriesService.type';

const BASE_SERIES_URL = '/series';

export default {
  getSeriesList: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetSeriesFields): Promise<ResponseWithPaginationUtil<SeriesApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<SeriesApiModel>>(BASE_SERIES_URL, {
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

  getSeries: async (id: SeriesId): Promise<SeriesApiModel> => {
    const response = await axios.get<SeriesApiModel>(`${BASE_SERIES_URL}/${id}`);

    return response.data;
  },

  addSeries: async (fields: CreateSeries): Promise<JSONResponseUtil<SeriesApiModel>> =>
    axiosActions<SeriesApiModel>({ url: BASE_SERIES_URL, method: HttpVerbsUtil.POST, data: fields }),

  updateSeries: async (id: SeriesId, fields: UpdateSeries): Promise<JSONResponseUtil<SeriesApiModel>> =>
    axiosActions<SeriesApiModel>({ url: `${BASE_SERIES_URL}/${id}`, method: HttpVerbsUtil.PATCH, data: fields }),

  deleteSeries: async (id: SeriesId): Promise<JSONResponseUtil> =>
    axiosActions({ url: `${BASE_SERIES_URL}/${id}`, method: HttpVerbsUtil.DELETE }),
};

export const SeriesApiSortingFields = {
  NAME: 'NAME',
  CREATION_DATE: 'CREATION_DATE',
} as const;
export type SeriesApiSortingFields = (typeof SeriesApiSortingFields)[keyof typeof SeriesApiSortingFields];

export const SeriesApiSearchFields = {
  NAME: 'name',
} as const;
export type SeriesApiSearchFields = (typeof SeriesApiSearchFields)[keyof typeof SeriesApiSearchFields];

type SearchFields = { [key in SeriesApiSearchFields]?: string };

export type GetSeriesFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: SeriesApiSortingFields;
} & SearchFields;

export const DEFAULT_SERIES_SORT_FIELD = SeriesApiSortingFields.NAME;
export const DEFAULT_SERIES_SORT_DIRECTION = SortingDirectionUtil.ASC;
