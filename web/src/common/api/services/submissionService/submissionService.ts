import axios from 'axios';
import { axiosActions } from '@api/axiosActions';
import type { ReviewSubmissionApiModel, SubmissionApiModel, SubmissionId } from '@app-types/models';
import {
  ApiUrlParamsUtil,
  HttpVerbsUtil,
  SortingDirectionUtil,
  type JSONResponseUtil,
  type PaginationUtil,
  type ResponseWithPaginationUtil,
  type SubmissionStatusUtil,
} from '@app-types/utility';
import type { MergeSubmission, RejectSubmission } from './submissionService.type';

const BASE_SUBMISSIONS_URL = '/submissions';
const REVIEW_SUBMISSIONS_URL = `${BASE_SUBMISSIONS_URL}/review`;

// What the signed-in user sent in, whatever became of it, and the admins' review of everyone's. A member's new funko
// is a submission through the funko service.
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

  // Admins only: the waiting submissions (oldest first), or the reviewed ones (last reviewed first).
  getReviewSubmissions: async ({
    pagination,
    ...searchFields
  }: GetReviewSubmissionsFields): Promise<ResponseWithPaginationUtil<ReviewSubmissionApiModel>> => {
    const response = await axios.get<ResponseWithPaginationUtil<ReviewSubmissionApiModel>>(REVIEW_SUBMISSIONS_URL, {
      params: {
        [ApiUrlParamsUtil.page]: pagination.page,
        [ApiUrlParamsUtil.pageSize]: pagination.size,
        ...searchFields,
      },
    });

    return response.data;
  },

  approveSubmission: async (id: SubmissionId): Promise<JSONResponseUtil<SubmissionApiModel>> =>
    axiosActions<SubmissionApiModel>({ url: `${BASE_SUBMISSIONS_URL}/${id}/approval`, method: HttpVerbsUtil.POST }),

  rejectSubmission: async (id: SubmissionId, fields: RejectSubmission): Promise<JSONResponseUtil<SubmissionApiModel>> =>
    axiosActions<SubmissionApiModel>({
      url: `${BASE_SUBMISSIONS_URL}/${id}/rejection`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  // Admins only: the sender's items move onto a catalogue funko, which takes the picked fields and images, and the
  // submission reads as merged into it.
  mergeSubmission: async (id: SubmissionId, fields: MergeSubmission): Promise<JSONResponseUtil<SubmissionApiModel>> =>
    axiosActions<SubmissionApiModel>({
      url: `${BASE_SUBMISSIONS_URL}/${id}/merge`,
      method: HttpVerbsUtil.POST,
      data: fields,
    }),

  // The sender sends a rejected submission in again.
  resendSubmission: async (id: SubmissionId): Promise<JSONResponseUtil<SubmissionApiModel>> =>
    axiosActions<SubmissionApiModel>({ url: `${BASE_SUBMISSIONS_URL}/${id}/resubmission`, method: HttpVerbsUtil.POST }),
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

// The review list's two tabs.
export const SubmissionApiReviewStates = {
  WAITING: 'WAITING',
  DONE: 'DONE',
} as const;
export type SubmissionApiReviewStates = (typeof SubmissionApiReviewStates)[keyof typeof SubmissionApiReviewStates];

// The catalogue fields a merge can take from the submission instead of keeping the catalogue funko's own.
export const SubmissionApiMergeFields = {
  NAME: 'NAME',
  NUMBER: 'NUMBER',
  TYPE: 'TYPE',
  CATEGORY: 'CATEGORY',
  SERIES: 'SERIES',
  CHASE: 'CHASE',
  EXCLUSIVE: 'EXCLUSIVE',
  BARCODE: 'BARCODE',
} as const;
export type SubmissionApiMergeFields = (typeof SubmissionApiMergeFields)[keyof typeof SubmissionApiMergeFields];

export const SubmissionApiReviewSearchFields = {
  STATE: 'state',
} as const;
export type SubmissionApiReviewSearchFields =
  (typeof SubmissionApiReviewSearchFields)[keyof typeof SubmissionApiReviewSearchFields];

type SearchFields = { [SubmissionApiSearchFields.STATUS]?: SubmissionStatusUtil };

type ReviewSearchFields = { [SubmissionApiReviewSearchFields.STATE]?: SubmissionApiReviewStates };

export type GetSubmissionsFields = {
  pagination: PaginationUtil;
  direction?: SortingDirectionUtil;
  sortingField?: SubmissionApiSortingFields;
} & SearchFields;

export type GetReviewSubmissionsFields = {
  pagination: PaginationUtil;
} & ReviewSearchFields;

// Newest first, as the API defaults.
export const DEFAULT_SUBMISSION_SORT_FIELD = SubmissionApiSortingFields.CREATION_DATE;
export const DEFAULT_SUBMISSION_SORT_DIRECTION = SortingDirectionUtil.DESC;
export const DEFAULT_REVIEW_STATE = SubmissionApiReviewStates.WAITING;
