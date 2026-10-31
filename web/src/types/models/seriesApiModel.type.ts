import type { SubmissionStatusUtil } from '@app-types/utility';

export interface SeriesApiModel {
  id: number;
  name: string;
  // WAITING: typed in by the signed-in member with a submission, seen only by them until approved.
  status: SubmissionStatusUtil;
  funkoCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SeriesId = SeriesApiModel['id'];
