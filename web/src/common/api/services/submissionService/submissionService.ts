import axios from 'axios';
import type { SubmissionApiModel } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  SortingDirectionUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
  type SubmissionStatusUtil,
} from '@app-types/utility';

const BASE_SUBMISSIONS_URL = '/submissions';

// What the signed-in user sent in, whatever became of it. Writes go through the funko service: a member's new funko
// is a submission.
export default {
  getSubmissions: async ({
    pagination,
    sortingField,
    direction,
    ...searchFields
  }: GetSubmissionsFields): Promise<ResponseWithPaginationUtil<SubmissionApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<SubmissionApiModel>>(BASE_SUBMISSIONS_URL, {
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
};

export const SubmissionApiSortingFields = {
  NAME: 'NAME',
  CREATION_DATE: 'CREATION_DATE',
} as const;
export type SubmissionApiSortingFields = (typeof SubmissionApiSortingFields)[keyof typeof SubmissionApiSortingFields];

export const SubmissionApiSearchFields = {
  STATUS: 'status',
} as const;
export type SubmissionApiSearchFields = (typeof SubmissionApiSearchFields)[keyof typeof SubmissionApiSearchFields];

type SearchFields = { [SubmissionApiSearchFields.STATUS]?: SubmissionStatusUtil };

export type GetSubmissionsFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: SubmissionApiSortingFields;
} & SearchFields;

// Newest first, as the API defaults.
export const DEFAULT_SUBMISSION_SORT_FIELD = SubmissionApiSortingFields.CREATION_DATE;
export const DEFAULT_SUBMISSION_SORT_DIRECTION = SortingDirectionUtil.DESC;
