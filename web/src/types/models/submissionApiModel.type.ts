import type { SubmissionStatusUtil } from '@app-types/utility';
import type { FunkoSummaryApiModel } from './funkoSummaryApiModel.type';

// One funko the signed-in user sent in (GET /submissions), with where it stands; `createdAt` is when they sent it.
export interface SubmissionApiModel extends FunkoSummaryApiModel {
  status: SubmissionStatusUtil;
  createdAt: string;
  updatedAt: string;
}
